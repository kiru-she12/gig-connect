<?php
// backend/models/DeliveryModel.php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../config/sms.php';
require_once __DIR__ . '/../config/mapbox.php';

class DeliveryModel extends BaseModel {

    public function verifyOtp($data, $user) {
        $delivery_ID = $data['delivery_ID'];
        $otp = $data['otp'];

        $stmt = $this->pdo->prepare("SELECT * FROM delivery WHERE delivery_ID = ?");
        $stmt->execute([$delivery_ID]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$delivery) {
            return ["error" => "Delivery not found!"];
        }

        // Security check: must be either the student associated with the delivery or the job provider
        $job_stmt = $this->pdo->prepare("SELECT provider_ID FROM job WHERE job_ID = ?");
        $job_stmt->execute([$delivery['job_ID']]);
        $provider_ID = $job_stmt->fetchColumn();

        if ($user->user_ID !== $delivery['sender_std_ID'] && $user->user_ID !== $provider_ID) {
            return ["error" => "Unauthorized to verify OTP for this delivery!"];
        }

        if($delivery['otp'] != $otp) {
            return ["error" => "Invalid OTP!"];
        }

        $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'delivered' WHERE delivery_ID = ?");
        $stmt->execute([$delivery_ID]);

        $stmt = $this->pdo->prepare("UPDATE job SET status = 'completed', completed_time = NOW() WHERE job_ID = ?");
        $stmt->execute([$delivery['job_ID']]);

        return [
            "success" => "OTP verified! Delivery completed successfully!",
            "delivery_ID" => $delivery_ID
        ];
    }

    public function updateDelivery($data, $user) {
        $delivery_ID = $data['delivery_ID'];
        $action = $data['action'];

        $stmt = $this->pdo->prepare("SELECT * FROM delivery WHERE delivery_ID = ?");
        $stmt->execute([$delivery_ID]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$delivery) {
            return ["error" => "Delivery not found!"];
        }

        if($action === 'assign') {
            if($user->role !== 'admin' && $user->role !== 'manager') {
                return ["error" => "Unauthorized!"];
            }
            $delivery_person_ID = $data['delivery_person_ID'];
            $stmt = $this->pdo->prepare("UPDATE delivery SET delivery_person_ID = ?, status = 'assigned' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_person_ID, $delivery_ID]);
            return ["success" => "Delivery staff assigned successfully!"];

        } else if($action === 'ready_for_pickup') {
            if($delivery['sender_std_ID'] !== $user->user_ID) {
                return ["error" => "Unauthorized!"];
            }

            $pickup_address = $data['pickup_address'] ?? null;
            $delivery_address = $data['delivery_address'] ?? null;
            $phone = $data['phone'] ?? null;

            if (empty($pickup_address) || empty($delivery_address) || empty($phone)) {
                return ["error" => "Pickup location, delivery destination, and phone number are all required!"];
            }

            // Update student phone number
            $stmt = $this->pdo->prepare("UPDATE users SET phone = ? WHERE user_ID = ?");
            $stmt->execute([$phone, $user->user_ID]);

            // Update delivery details
            $stmt = $this->pdo->prepare("UPDATE delivery SET pickup_address = ?, delivery_address = ? WHERE delivery_ID = ?");
            $stmt->execute([$pickup_address, $delivery_address, $delivery_ID]);

            // Update application details
            $stmt = $this->pdo->prepare("UPDATE application SET pickup_address = ?, delivery_address = ? WHERE job_ID = ? AND student_ID = ?");
            $stmt->execute([$pickup_address, $delivery_address, $delivery['job_ID'], $user->user_ID]);
            
            // Create admin notification
            $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');
            $admin_stmt = $this->pdo->query("SELECT user_ID FROM users WHERE role = 'admin' LIMIT 1");
            $admin_id = $admin_stmt->fetchColumn() ?: 'ADM001';

            $job_stmt = $this->pdo->prepare("SELECT title FROM job WHERE job_ID = ?");
            $job_stmt->execute([$delivery['job_ID']]);
            $job_title = $job_stmt->fetchColumn();

            $stmt = $this->pdo->prepare("INSERT INTO notification (notification_ID, user_ID, title, message) VALUES (?, ?, 'Product Ready for Delivery', ?)");
            $stmt->execute([
                $notif_ID,
                $admin_id,
                "The student has completed the product for '$job_title'. Please assign a delivery rider."
            ]);

            return ["success" => "Product marked as ready! Admin has been notified for rider assignment."];

        } else if($action === 'complete_self_delivery') {
            if($delivery['sender_std_ID'] !== $user->user_ID) {
                return ["error" => "Unauthorized!"];
            }

            // Get student info
            $std_stmt = $this->pdo->prepare("SELECT name, email FROM users WHERE user_ID = ?");
            $std_stmt->execute([$delivery['sender_std_ID']]);
            $student = $std_stmt->fetch(PDO::FETCH_ASSOC);

            // Get job provider info
            $job_stmt = $this->pdo->prepare("
                SELECT j.title, u.name, u.email 
                FROM job j 
                JOIN users u ON j.provider_ID = u.user_ID 
                WHERE j.job_ID = ?
            ");
            $job_stmt->execute([$delivery['job_ID']]);
            $job_details = $job_stmt->fetch(PDO::FETCH_ASSOC);

            // Retrieve or generate OTP
            $otp = $delivery['otp'];
            if (empty($otp)) {
                $otp = rand(100000, 999999);
                $stmt = $this->pdo->prepare("UPDATE delivery SET otp = ? WHERE delivery_ID = ?");
                $stmt->execute([$otp, $delivery_ID]);
            }

            // Send bilingual email to student and provider
            require_once __DIR__ . '/../config/mail.php';
            require_once __DIR__ . '/../config/email_templates.php';

            $student_body = productVerificationOtpEmail($student['name'], $otp, $job_details['title']);
            sendEmail($student['email'], "GigConnect - Delivery Verification OTP", $student_body);

            $provider_body = productVerificationOtpEmail($job_details['name'], $otp, $job_details['title']);
            sendEmail($job_details['email'], "GigConnect - Delivery Verification OTP", $provider_body);

            // Set delivery status to picked_up (signifies it is pending verification)
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'picked_up' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);

            return ["success" => "OTP sent to both parties successfully! Please enter the OTP to complete the gig."];

        } else if($action === 'pickup') {
            if($user->role !== 'delivery_staff' && !($delivery['delivery_type'] === 'self' && $delivery['sender_std_ID'] === $user->user_ID)) {
                return ["error" => "Unauthorized!"];
            }
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'picked_up' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);
            return ["success" => "Product picked up successfully!"];

        } else if($action === 'deliver') {
            if($user->role !== 'delivery_staff' && !($delivery['delivery_type'] === 'self' && $delivery['sender_std_ID'] === $user->user_ID)) {
                return ["error" => "Unauthorized!"];
            }
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'delivered' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);
            $stmt = $this->pdo->prepare("UPDATE job SET status = 'completed', completed_time = NOW() WHERE job_ID = ?");
            $stmt->execute([$delivery['job_ID']]);
            return ["success" => "Product delivered successfully!"];

        } else {
            return ["error" => "Invalid action!"];
        }
    }

    public function getDeliveries($user) {
        if ($user->role === 'student') {
            $stmt = $this->pdo->prepare("
                SELECT d.*, j.title as job_title, j.payment as job_payment, j.is_product_based,
                       u.name as delivery_staff_name
                FROM delivery d
                JOIN job j ON d.job_ID = j.job_ID AND j.is_product_based = 1
                LEFT JOIN users u ON d.delivery_person_ID = u.user_ID
                WHERE d.sender_std_ID = ?
                ORDER BY d.delivery_ID DESC
            ");
            $stmt->execute([$user->user_ID]);
            return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];

        } else if ($user->role === 'client') {
            $stmt = $this->pdo->prepare("
                SELECT d.*, j.title as job_title, j.payment as job_payment, j.is_product_based,
                       u1.name as sender_name, u2.name as delivery_staff_name
                FROM delivery d
                JOIN job j ON d.job_ID = j.job_ID AND j.is_product_based = 1
                LEFT JOIN users u1 ON d.sender_std_ID = u1.user_ID
                LEFT JOIN users u2 ON d.delivery_person_ID = u2.user_ID
                WHERE j.provider_ID = ?
                ORDER BY d.delivery_ID DESC
            ");
            $stmt->execute([$user->user_ID]);
            return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];

        } else if ($user->role === 'delivery_staff') {
            $stmt = $this->pdo->prepare("
                SELECT d.*, j.title as job_title, j.payment as job_payment, j.is_product_based,
                       u.name as sender_name
                FROM delivery d
                JOIN job j ON d.job_ID = j.job_ID AND j.is_product_based = 1
                LEFT JOIN users u ON d.sender_std_ID = u.user_ID
                WHERE d.delivery_person_ID = ?
                ORDER BY d.delivery_ID DESC
            ");
            $stmt->execute([$user->user_ID]);
            return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];

        } else if ($user->role === 'admin' || $user->role === 'manager') {
            $stmt = $this->pdo->query("
                SELECT d.*, j.title as job_title, j.payment as job_payment, j.is_product_based,
                       u1.name as sender_name, u2.name as delivery_staff_name
                FROM delivery d
                JOIN job j ON d.job_ID = j.job_ID AND j.is_product_based = 1
                LEFT JOIN users u1 ON d.sender_std_ID = u1.user_ID
                LEFT JOIN users u2 ON d.delivery_person_ID = u2.user_ID
                ORDER BY d.delivery_ID DESC
            ");
            return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } else {
            return ["error" => "Unauthorized role!"];
        }
    }

    public function createDelivery($data, $user) {
        if($user->role !== 'student') {
            return ["error" => "Unauthorized!"];
        }

        $job_ID = $data['job_ID'];
        $delivery_type = $data['delivery_type'];
        $pickup_address = $data['pickup_address'];
        $delivery_address = $data['delivery_address'];
        $distance = $data['distance'] ?? null;

        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'in_progress'");
        $stmt->execute([$job_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$job) {
            return ["error" => "Job not found or not in progress!"];
        }

        $delivery_ID = $this->generateNextID('delivery', 'delivery_ID', 'DEL');

        $otp = rand(100000, 999999);

        $stmt = $this->pdo->prepare("INSERT INTO delivery (delivery_ID, job_ID, sender_std_ID, delivery_type, pickup_address, delivery_address, distance, otp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $delivery_ID,
            $job_ID,
            $user->user_ID,
            $delivery_type,
            $pickup_address,
            $delivery_address,
            $distance,
            $otp
        ]);

        if ($delivery_type === 'platform') {
            // Find admin user_ID
            $notif_stmt = $this->pdo->prepare("SELECT user_ID FROM users WHERE role = 'admin' LIMIT 1");
            $notif_stmt->execute();
            $admin_id = $notif_stmt->fetchColumn() ?: 'ADM001';

            // Generate notification ID
            $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');

            // Insert notification
            $notif_msg = "New delivery request ({$delivery_ID}) for Job ID {$job_ID}. Student requested platform delivery staff. Please assign an available rider.";
            $ins_notif = $this->pdo->prepare("INSERT INTO notification (notification_ID, user_ID, message, type, status) VALUES (?, ?, ?, 'delivery_request', 'unread')");
            $ins_notif->execute([$notif_ID, $admin_id, $notif_msg]);
        }

        // Fetch job provider's phone number to send SMS
        $stmt_phone = $this->pdo->prepare("
            SELECT u.phone 
            FROM job j 
            JOIN job_provider jp ON j.provider_ID = jp.provider_ID 
            JOIN users u ON jp.user_ID = u.user_ID 
            WHERE j.job_ID = ?
        ");
        $stmt_phone->execute([$job_ID]);
        $provider_phone = $stmt_phone->fetchColumn();

        if ($provider_phone) {
            sendSMS($provider_phone, "GigConnect: A delivery (ID: {$delivery_ID}) has been created for your job. Please share this OTP with the delivery staff: " . $otp);
        }

        return [
            "success" => "Delivery created successfully!",
            "delivery_ID" => $delivery_ID,
            "otp" => $otp
        ];
    }

    public function completeJob($data, $user) {
        if ($user->role !== 'student') {
            return ["error" => "Unauthorized! Only students can mark jobs as completed."];
        }

        $application_ID = $data['application_ID'] ?? null;
        $job_ID = $data['job_ID'] ?? null;
        $phone = $data['phone'] ?? null;
        $pickup_address = $data['pickup_address'] ?? null;
        $dropoff_address = $data['dropoff_address'] ?? null;
        $client_phone = $data['client_phone'] ?? null;

        if (!$application_ID || !$job_ID) {
            return ["error" => "Application ID and Job ID are required!"];
        }

        // Fetch application and verify student owns it and status is 'accepted'
        $stmt = $this->pdo->prepare("
            SELECT a.*, j.title as job_title, j.is_product_based, j.provider_ID
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            WHERE a.application_ID = ? AND a.job_ID = ?
        ");
        $stmt->execute([$application_ID, $job_ID]);
        $app = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$app) {
            return ["error" => "Application not found!"];
        }

        // Verify student owns it
        $student_ID = $this->ensureStudentProfile($user->user_ID);
        if ($app['student_ID'] !== $student_ID) {
            return ["error" => "Unauthorized! You do not own this application."];
        }

        // Verify application status is 'accepted'
        if ($app['status'] !== 'accepted') {
            return ["error" => "Only accepted applications can be marked as completed. Current status: " . $app['status']];
        }

        // Update student phone if provided
        if (!empty($phone)) {
            $stmt = $this->pdo->prepare("UPDATE users SET phone = ? WHERE user_ID = ?");
            $stmt->execute([$phone, $user->user_ID]);
        }

        // Update application status to 'completed'
        $stmt = $this->pdo->prepare("UPDATE application SET status = 'completed' WHERE application_ID = ?");
        $stmt->execute([$application_ID]);

        // Update job status to 'completed' and completed_time to NOW()
        $stmt = $this->pdo->prepare("UPDATE job SET status = 'completed', completed_time = NOW() WHERE job_ID = ?");
        $stmt->execute([$job_ID]);

        // If NOT product based, skip OTP generation and delivery records
        if ($app['is_product_based'] != 1) {
            $prov_stmt = $this->pdo->prepare("
                SELECT user_ID 
                FROM job_provider 
                WHERE provider_ID = ?
            ");
            $prov_stmt->execute([$app['provider_ID']]);
            $provider_user_ID = $prov_stmt->fetchColumn() ?: '';

            return [
                "success" => true,
                "is_product_based" => false,
                "message" => "Job marked as completed successfully!",
                "provider_user_ID" => $provider_user_ID
            ];
        }

        // Generate 6-digit OTP
        $otp = rand(100000, 999999);
        $otp_expiry = date('Y-m-d H:i:s', time() + 30 * 60); // 30 minutes
        
        // Fetch student details
        $student_name = $user->name;
        $student_email = $user->email;
        $student_phone = !empty($phone) ? $phone : ($user->phone ?? '');

        // Fetch provider details
        $stmt = $this->pdo->prepare("SELECT name, email, phone FROM users WHERE user_ID = ?");
        $stmt->execute([$app['provider_ID']]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);
        $provider_name = $provider['name'] ?? 'Client';
        $provider_email = $provider['email'] ?? '';
        $provider_phone = $provider['phone'] ?? '';

        // Prepare OTP message
        $otp_message = "GigConnect Job Completion OTP: {$otp}. Use this to confirm job completion for " . $app['job_title'] . ".";

        // Send OTP via SMS
        if (!empty($student_phone)) {
            sendSMS($student_phone, $otp_message);
        }
        if (!empty($provider_phone)) {
            sendSMS($provider_phone, $otp_message);
        }

        // Send OTP via Email
        require_once __DIR__ . '/../config/mail.php';
        require_once __DIR__ . '/../config/email_templates.php';

        $student_body = productVerificationOtpEmail($student_name, $otp, $app['job_title']);
        sendEmail($student_email, "GigConnect - Job Completion OTP", $student_body);

        $provider_body = productVerificationOtpEmail($provider_name, $otp, $app['job_title']);
        sendEmail($provider_email, "GigConnect - Job Completion OTP", $provider_body);

        // Store OTP in delivery table
        $delivery_ID = $this->generateNextID('delivery', 'delivery_ID', 'DEL');
        $delivery_type = ($app['delivery_needed'] == 1) ? 'platform' : 'self';
        
        // Default status
        if ($app['delivery_needed'] == 1) {
            $delivery_status = 'pending_assignment';
        } elseif ($app['delivery_needed'] === '0' || $app['delivery_needed'] === 0) {
            $delivery_status = 'assigned';
        } else {
            // Not product-based
            $delivery_status = 'delivered'; 
        }

        // Calculate distance and delivery fee
        $distance = 0.00;
        $delivery_fee = 0.00;

        if ($app['delivery_needed'] == 1 && !empty($pickup_address) && !empty($dropoff_address)) {
            global $mapbox_token;
            if (!empty($mapbox_token)) {
                $pickup_coords = $this->geocodeAddressHelper($pickup_address, $mapbox_token);
                $dropoff_coords = $this->geocodeAddressHelper($dropoff_address, $mapbox_token);
                if ($pickup_coords && $dropoff_coords) {
                    $distance = $this->getDistanceHelper(
                        $pickup_coords['latitude'], $pickup_coords['longitude'],
                        $dropoff_coords['latitude'], $dropoff_coords['longitude']
                    );
                    $delivery_fee = $distance * 30.00; // 30 LKR per km
                }
            }
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO delivery 
            (delivery_ID, job_ID, sender_std_ID, delivery_type, pickup_address, delivery_address, client_phone, distance, delivery_fee, otp, otp_expiry, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $delivery_ID,
            $job_ID,
            $user->user_ID,
            $delivery_type,
            ($app['delivery_needed'] == 1) ? $pickup_address : null,
            ($app['delivery_needed'] == 1) ? $dropoff_address : null,
            ($app['delivery_needed'] == 1) ? $client_phone : null,
            $distance,
            $delivery_fee,
            $otp,
            $otp_expiry,
            $delivery_status
        ]);

        // Notify admin if delivery needed
        if ($app['delivery_needed'] == 1) {
            $admin_stmt = $this->pdo->query("SELECT user_ID FROM users WHERE role = 'admin' LIMIT 1");
            $admin_id = $admin_stmt->fetchColumn() ?: 'ADM001';
            
            $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');
            $admin_msg = "New delivery request from {$student_name} for job {$app['job_title']}. Please assign delivery staff.";
            
            $notif_stmt = $this->pdo->prepare("
                INSERT INTO notification (notification_ID, user_ID, message, type, status) 
                VALUES (?, ?, ?, 'delivery_request', 'unread')
            ");
            $notif_stmt->execute([$notif_ID, $admin_id, $admin_msg]);
        }

        return [
            "success" => true,
            "message" => "Job marked as completed! OTP sent to you and the client for confirmation.",
            "otp" => $otp
        ];
    }

    public function assignStaff($data, $user) {
        if ($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized! Only admin or manager can assign delivery staff."];
        }

        $delivery_ID = $data['delivery_ID'] ?? null;
        $delivery_staff_ID = $data['delivery_staff_ID'] ?? null;

        if (!$delivery_ID || !$delivery_staff_ID) {
            return ["error" => "Delivery ID and Delivery Staff ID are required!"];
        }

        // Find delivery staff user_ID and phone
        $stmt = $this->pdo->prepare("
            SELECT ds.user_ID, ds.phone, u.name 
            FROM delivery_staff ds
            JOIN users u ON ds.user_ID = u.user_ID
            WHERE ds.delivery_staff_ID = ? OR ds.user_ID = ?
        ");
        $stmt->execute([$delivery_staff_ID, $delivery_staff_ID]);
        $staff = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$staff) {
            return ["error" => "Delivery staff member not found!"];
        }

        $delivery_person_ID = $staff['user_ID'];
        $staff_phone = $staff['phone'];
        $staff_name = $staff['name'];

        // Get delivery details
        $stmt = $this->pdo->prepare("SELECT d.*, j.title as job_title FROM delivery d JOIN job j ON d.job_ID = j.job_ID WHERE d.delivery_ID = ?");
        $stmt->execute([$delivery_ID]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$delivery) {
            return ["error" => "Delivery record not found!"];
        }

        // Update delivery record
        $stmt = $this->pdo->prepare("
            UPDATE delivery 
            SET delivery_person_ID = ?, status = 'assigned' 
            WHERE delivery_ID = ?
        ");
        $stmt->execute([$delivery_person_ID, $delivery_ID]);

        // Fetch student phone and name to notify
        $stmt = $this->pdo->prepare("
            SELECT name, phone, email 
            FROM users 
            WHERE user_ID = ?
        ");
        $stmt->execute([$delivery['sender_std_ID']]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        $student_phone = $student['phone'] ?? '';
        $student_name = $student['name'] ?? '';
        $student_email = $student['email'] ?? '';

        // Fetch provider phone and name to notify
        $stmt = $this->pdo->prepare("
            SELECT u.name, u.phone, u.email 
            FROM users u
            JOIN job_provider jp ON u.user_ID = jp.user_ID
            JOIN job j ON jp.provider_ID = j.provider_ID
            WHERE j.job_ID = ?
        ");
        $stmt->execute([$delivery['job_ID']]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);
        $provider_phone = $provider['phone'] ?? '';
        $provider_name = $provider['name'] ?? '';
        $provider_email = $provider['email'] ?? '';

        // Notify delivery staff via SMS
        $staff_sms = "You have a new delivery assignment. Check your dashboard for details.";
        if (!empty($staff_phone)) {
            sendSMS($staff_phone, $staff_sms);
        }

        // OTP code
        $otp = $delivery['otp'] ?? '';

        // Notify student via SMS & In-app notification
        $student_sms = "Delivery staff {$staff_name} has been assigned for your job '" . $delivery['job_title'] . "'. Your OTP is: " . $otp;
        if (!empty($student_phone)) {
            sendSMS($student_phone, $student_sms);
        }

        // Notify provider via SMS with OTP
        $provider_sms = "Delivery staff {$staff_name} has been assigned for job '" . $delivery['job_title'] . "'. Your OTP is: " . $otp;
        if (!empty($provider_phone)) {
            sendSMS($provider_phone, $provider_sms);
        }

        // Send Email notifications with OTP
        require_once __DIR__ . '/../config/mail.php';
        require_once __DIR__ . '/../config/email_templates.php';

        if (!empty($student_email)) {
            $student_body = productVerificationOtpEmail($student_name, $otp, $delivery['job_title']);
            sendEmail($student_email, "GigConnect - Delivery Assigned & OTP", $student_body);
        }

        if (!empty($provider_email)) {
            $provider_body = productVerificationOtpEmail($provider_name, $otp, $delivery['job_title']);
            sendEmail($provider_email, "GigConnect - Delivery Assigned & OTP", $provider_body);
        }

        // Student In-app Notification
        $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');
        $notif_stmt = $this->pdo->prepare("
            INSERT INTO notification (notification_ID, user_ID, message, type, status) 
            VALUES (?, ?, ?, 'delivery_assigned', 'unread')
        ");
        $notif_stmt->execute([$notif_ID, $delivery['sender_std_ID'], "Delivery staff {$staff_name} has been assigned for your job " . $delivery['job_title']]);

        // Delivery Staff In-app Notification
        $notif_ID_staff = $this->generateNextID('notification', 'notification_ID', 'NOT');
        $notif_stmt_staff = $this->pdo->prepare("
            INSERT INTO notification (notification_ID, user_ID, message, type, status) 
            VALUES (?, ?, ?, 'delivery_assigned', 'unread')
        ");
        $notif_stmt_staff->execute([$notif_ID_staff, $delivery_person_ID, $staff_sms]);

        return ["success" => true, "message" => "Delivery staff assigned successfully!"];
    }

    public function confirmDelivery($data, $user) {
        $delivery_ID = $data['delivery_ID'] ?? null;
        $otp = $data['otp'] ?? null;

        if (!$delivery_ID || !$otp) {
            return ["error" => "Delivery ID and OTP are required!"];
        }

        // Fetch delivery and job details
        $stmt = $this->pdo->prepare("
            SELECT d.*, j.title as job_title, j.provider_ID
            FROM delivery d
            JOIN job j ON d.job_ID = j.job_ID
            WHERE d.delivery_ID = ?
        ");
        $stmt->execute([$delivery_ID]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$delivery) {
            return ["error" => "Delivery not found!"];
        }

        // Authorization check
        if ($user->role === 'delivery_staff') {
            if ($delivery['delivery_person_ID'] !== $user->user_ID) {
                return ["error" => "Unauthorized! You are not assigned to this delivery."];
            }
        } elseif ($user->role === 'student') {
            if ($delivery['sender_std_ID'] !== $user->user_ID) {
                return ["error" => "Unauthorized! You are not the student for this job."];
            }
        } elseif ($user->role === 'job_provider' || $user->role === 'client') {
            $provider_ID = $this->ensureProviderProfile($user->user_ID);
            if ($delivery['provider_ID'] !== $provider_ID) {
                return ["error" => "Unauthorized! You are not the client/provider for this job."];
            }
        } else {
            return ["error" => "Unauthorized role!"];
        }

        // OTP expiration check
        if (!empty($delivery['otp_expiry'])) {
            $expiry = strtotime($delivery['otp_expiry']);
            if (time() > $expiry) {
                return ["error" => "OTP has expired. Please request a new one."];
            }
        }

        // OTP verification
        if (trim($delivery['otp']) !== trim($otp)) {
            return ["error" => "Invalid OTP. Please check with student."];
        }

        // Update delivery status to 'delivered'
        $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'delivered' WHERE delivery_ID = ?");
        $stmt->execute([$delivery_ID]);

        // Update job status to 'delivered'
        $stmt = $this->pdo->prepare("UPDATE job SET status = 'delivered' WHERE job_ID = ?");
        $stmt->execute([$delivery['job_ID']]);

        // Update application status to 'delivered' for this job's applicants
        $stmt = $this->pdo->prepare("UPDATE application SET status = 'delivered' WHERE job_ID = ? AND status = 'completed'");
        $stmt->execute([$delivery['job_ID']]);

        // Fetch student details
        $stmt = $this->pdo->prepare("SELECT name, email, phone FROM users WHERE user_ID = ?");
        $stmt->execute([$delivery['sender_std_ID']]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        $student_phone = $student['phone'] ?? '';
        $student_name = $student['name'] ?? '';
        $student_email = $student['email'] ?? '';

        // Fetch provider details
        $stmt = $this->pdo->prepare("
            SELECT u.name, u.email, u.phone 
            FROM users u
            JOIN job_provider jp ON u.user_ID = jp.user_ID
            WHERE jp.provider_ID = ?
        ");
        $stmt->execute([$delivery['provider_ID']]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);
        $provider_phone = $provider['phone'] ?? '';
        $provider_name = $provider['name'] ?? '';
        $provider_email = $provider['email'] ?? '';

        // Send confirmation via SMS
        $student_sms = "Your product for job '" . $delivery['job_title'] . "' has been delivered successfully!";
        if (!empty($student_phone)) {
            sendSMS($student_phone, $student_sms);
        }

        $provider_sms = "Product delivered for job '" . $delivery['job_title'] . "'. Please process payment.";
        if (!empty($provider_phone)) {
            sendSMS($provider_phone, $provider_sms);
        }

        // Send confirmation via Email
        require_once __DIR__ . '/../config/mail.php';
        $student_mail_body = "
            <h2>Delivery Confirmation</h2>
            <p>Dear {$student_name},</p>
            <p>Your product for <strong>" . htmlspecialchars($delivery['job_title']) . "</strong> has been delivered successfully!</p>
            <p>Thank you for using GigConnect.</p>
        ";
        sendEmail($student_email, "GigConnect - Product Delivered", $student_mail_body);

        $provider_mail_body = "
            <h2>Delivery Confirmation</h2>
            <p>Dear {$provider_name},</p>
            <p>The product for <strong>" . htmlspecialchars($delivery['job_title']) . "</strong> has been delivered successfully!</p>
            <p>Please log in to your dashboard to process the payment and complete the transaction.</p>
        ";
        sendEmail($provider_email, "GigConnect - Product Delivered", $provider_mail_body);

        // Notify Admin in-app
        $admin_stmt = $this->pdo->query("SELECT user_ID FROM users WHERE role = 'admin' LIMIT 1");
        $admin_id = $admin_stmt->fetchColumn() ?: 'ADM001';
        $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');
        $admin_msg = "Product delivered for job '" . $delivery['job_title'] . "' (Delivery ID: {$delivery_ID}).";
        $stmt = $this->pdo->prepare("
            INSERT INTO notification (notification_ID, user_ID, message, type, status) 
            VALUES (?, ?, ?, 'delivery_completed', 'unread')
        ");
        $stmt->execute([$notif_ID, $admin_id, $admin_msg]);

        return ["success" => true, "message" => "Delivery confirmed successfully!"];
    }

    public function getPendingAssignments($user) {
        if ($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized!"];
        }

        $stmt = $this->pdo->prepare("
            SELECT d.*, j.title as job_title, j.payment as job_payment, j.completed_time as date_requested,
                   u.name as student_name, u.phone as student_phone,
                   COALESCE(NULLIF(d.client_phone, ''), u2.phone) as client_phone
            FROM delivery d
            JOIN job j ON d.job_ID = j.job_ID
            JOIN users u ON d.sender_std_ID = u.user_ID
            LEFT JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            LEFT JOIN users u2 ON jp.user_ID = u2.user_ID
            WHERE d.status = 'pending_assignment'
            ORDER BY d.delivery_ID DESC
        ");
        $stmt->execute();
        return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
    }

    public function getMyDeliveries($user) {
        if ($user->role !== 'delivery_staff') {
            return ["error" => "Unauthorized! Only delivery staff can view their assignments."];
        }

        $stmt = $this->pdo->prepare("
            SELECT d.*, j.title as job_title, j.payment as job_payment,
                   u.name as student_name, u.phone as student_phone,
                   COALESCE(NULLIF(d.client_phone, ''), u2.phone) as client_phone
            FROM delivery d
            JOIN job j ON d.job_ID = j.job_ID
            JOIN users u ON d.sender_std_ID = u.user_ID
            LEFT JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            LEFT JOIN users u2 ON jp.user_ID = u2.user_ID
            WHERE d.delivery_person_ID = ?
            ORDER BY d.delivery_ID DESC
        ");
        $stmt->execute([$user->user_ID]);
        return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
    }

    private function geocodeAddressHelper($address, $token) {
        $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" . urlencode($address) . ".json?access_token=" . $token . "&limit=1";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        if (isset($data['features']) && count($data['features']) > 0) {
            $coords = $data['features'][0]['center']; // [longitude, latitude]
            return [
                "longitude" => $coords[0],
                "latitude" => $coords[1]
            ];
        }
        return null;
    }

    private function getDistanceHelper($lat1, $lon1, $lat2, $lon2) {
        $earth_radius = 6371; // Kilometers
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earth_radius * $c;
    }
}
?>
