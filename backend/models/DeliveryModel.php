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

        $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'confirmed' WHERE delivery_ID = ?");
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

        $stmt = $this->pdo->prepare("
            SELECT d.*, j.title as job_title 
            FROM delivery d 
            JOIN job j ON d.job_ID = j.job_ID 
            WHERE d.delivery_ID = ?
        ");
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

            // Notify delivery staff rider
            $stmt_staff = $this->pdo->prepare("SELECT u.user_ID FROM delivery_staff ds JOIN users u ON ds.user_ID = u.user_ID WHERE ds.staff_ID = ?");
            $stmt_staff->execute([$delivery_person_ID]);
            $staff_user_id = $stmt_staff->fetchColumn();

            if ($staff_user_id) {
                require_once __DIR__ . '/NotificationModel.php';
                NotificationModel::create(
                    $this->pdo,
                    $staff_user_id,
                    "New Delivery Task Assigned 🚚",
                    "You have been assigned a new package delivery task (ID: $delivery_ID).",
                    "delivery_assigned",
                    "/dashboard/delivery/management"
                );
            }

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

            $phone = trim($phone);
            if (!preg_match('/^0\d{9}$/', $phone)) {
                return ["error" => "Phone number must be exactly 10 digits (e.g., 0712345678)!"];
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
            
            require_once __DIR__ . '/NotificationModel.php';

            // Create admin notification
            $admin_stmt = $this->pdo->query("SELECT user_ID FROM users WHERE role = 'admin' LIMIT 1");
            $admin_id = $admin_stmt->fetchColumn() ?: 'ADM001';

            $job_stmt = $this->pdo->prepare("SELECT title, provider_ID FROM job WHERE job_ID = ?");
            $job_stmt->execute([$delivery['job_ID']]);
            $job_info = $job_stmt->fetch(PDO::FETCH_ASSOC);
            $job_title = $job_info['title'] ?? 'Job';

            NotificationModel::create(
                $this->pdo,
                $admin_id,
                "Product Ready for Delivery 📦",
                "The student has completed the product for '$job_title'. Please assign a delivery rider.",
                "product_ready"
            );

            // Create notification for Job Provider
            $stmt_cli = $this->pdo->prepare("SELECT u.user_ID FROM job_provider jp JOIN users u ON jp.user_ID = u.user_ID WHERE jp.provider_ID = ?");
            $stmt_cli->execute([$job_info['provider_ID'] ?? '']);
            $client_user_id = $stmt_cli->fetchColumn();

            if ($client_user_id) {
                NotificationModel::create(
                    $this->pdo,
                    $client_user_id,
                    "Product Completed & Ready 📦",
                    "The student has finished work for '$job_title' and registered pickup details.",
                    "product_ready",
                    "/dashboard/client/home"
                );
            }

            return ["success" => "Product marked as ready! Admin and job provider have been notified for rider assignment."];

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

        } else if($action === 'accept') {
            if($user->role !== 'delivery_staff') {
                return ["error" => "Unauthorized! Only delivery staff can accept assignments."];
            }

            if($delivery['status'] !== 'pending_acceptance') {
                return ["error" => "Delivery is not in pending acceptance status!"];
            }

            if($delivery['delivery_person_ID'] !== $user->user_ID) {
                return ["error" => "Unauthorized! You are not the assigned delivery rider for this request."];
            }

            // Update delivery status to 'assigned'
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'assigned' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);

            // Update delivery staff status to 'busy'
            $stmt = $this->pdo->prepare("UPDATE delivery_staff SET status = 'busy' WHERE user_ID = ?");
            $stmt->execute([$user->user_ID]);

            // Fetch student/sender details
            $stmt = $this->pdo->prepare("SELECT name, phone, email FROM users WHERE user_ID = ?");
            $stmt->execute([$delivery['sender_std_ID']]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            $student_name = $student['name'] ?? '';
            $student_phone = $student['phone'] ?? '';
            $student_email = $student['email'] ?? '';

            // Fetch provider details
            $stmt = $this->pdo->prepare("
                SELECT u.name, u.phone, u.email 
                FROM users u
                JOIN job_provider jp ON u.user_ID = jp.user_ID
                JOIN job j ON jp.provider_ID = j.provider_ID
                WHERE j.job_ID = ?
            ");
            $stmt->execute([$delivery['job_ID']]);
            $provider = $stmt->fetch(PDO::FETCH_ASSOC);
            $provider_name = $provider['name'] ?? '';
            $provider_phone = $provider['phone'] ?? '';
            $provider_email = $provider['email'] ?? '';

            // Fetch delivery rider details
            $stmt = $this->pdo->prepare("SELECT u.name, u.phone FROM users u WHERE u.user_ID = ?");
            $stmt->execute([$user->user_ID]);
            $rider = $stmt->fetch(PDO::FETCH_ASSOC);
            $rider_name = $rider['name'] ?? '';
            $rider_phone = $rider['phone'] ?? '';

            $otp = $delivery['otp'];

            // Send OTP via SMS
            // 1. Student with delivery staff phone number
            if (!empty($student_phone)) {
                sendSMS($student_phone, "GigConnect: Delivery rider {$rider_name} ({$rider_phone}) has accepted your delivery. Share this OTP when they arrive: {$otp}");
            }
            // 2. Job provider with delivery staff phone number
            if (!empty($provider_phone)) {
                sendSMS($provider_phone, "GigConnect: Delivery rider {$rider_name} ({$rider_phone}) has accepted the delivery. Share this OTP: {$otp}");
            }
            // 3. Delivery staff
            if (!empty($rider_phone)) {
                sendSMS($rider_phone, "GigConnect: You have accepted delivery {$delivery_ID}. Contact: {$student_name} ({$student_phone}). Confirm delivery with OTP: {$otp}");
            }

            // Send OTP via Email
            require_once __DIR__ . '/../config/mail.php';
            require_once __DIR__ . '/../config/email_templates.php';

            if (!empty($student_email)) {
                $student_body = productVerificationOtpEmail($student_name, $otp, $delivery['job_title'] ?? 'your job', $rider_name, $rider_phone);
                sendEmail($student_email, "GigConnect - Delivery Accepted & OTP", $student_body);
            }
            if (!empty($provider_email)) {
                $provider_body = productVerificationOtpEmail($provider_name, $otp, $delivery['job_title'] ?? 'your job', $rider_name, $rider_phone);
                sendEmail($provider_email, "GigConnect - Delivery Accepted & OTP", $provider_body);
            }

            return ["success" => "Delivery request accepted successfully! Status set to busy and OTPs sent."];

        } else if($action === 'pickup') {
            if($user->role !== 'delivery_staff' && !($delivery['delivery_type'] === 'self' && $delivery['sender_std_ID'] === $user->user_ID)) {
                return ["error" => "Unauthorized!"];
            }
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'picked_up' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);
            return ["success" => "Product picked up successfully! Status set to picked up."];

        } else if($action === 'start_transit') {
            if($user->role !== 'delivery_staff' && !($delivery['delivery_type'] === 'self' && $delivery['sender_std_ID'] === $user->user_ID)) {
                return ["error" => "Unauthorized!"];
            }
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'in_transit' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);
            return ["success" => "Package is now in transit!"];

        } else if($action === 'deliver') {
            if($user->role !== 'delivery_staff' && !($delivery['delivery_type'] === 'self' && $delivery['sender_std_ID'] === $user->user_ID)) {
                return ["error" => "Unauthorized!"];
            }
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'delivered' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);
            return ["success" => "Arrived at client location! Status set to delivered. Please verify OTP to confirm delivery."];

        } else if($action === 'decline') {
            if($user->role !== 'delivery_staff') {
                return ["error" => "Unauthorized! Only delivery staff can decline requests."];
            }

            // Find next available delivery staff excluding current user
            $stmt = $this->pdo->prepare("
                SELECT u.user_ID, u.name, u.phone, ds.latitude, ds.longitude 
                FROM users u 
                JOIN delivery_staff ds ON u.user_ID = ds.user_ID 
                WHERE u.role = 'delivery_staff' 
                  AND u.status = 'active' 
                  AND (ds.status = 'available' OR ds.status IS NULL OR ds.status = '' OR ds.status = 'active')
                  AND u.user_ID != ?
            ");
            $stmt->execute([$user->user_ID]);
            $available_staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($available_staff)) {
                $next_rider = $available_staff[0]; // Next available rider
                $stmt = $this->pdo->prepare("UPDATE delivery SET delivery_person_ID = ?, status = 'pending_acceptance' WHERE delivery_ID = ?");
                $stmt->execute([$next_rider['user_ID'], $delivery_ID]);

                // Create in-app notification for the new rider
                $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');
                $notif_stmt = $this->pdo->prepare("
                    INSERT INTO notification (notification_ID, user_ID, message, type, status) 
                    VALUES (?, ?, ?, 'delivery_assigned', 'unread')
                ");
                $notif_stmt->execute([$notif_ID, $next_rider['user_ID'], "New campus delivery request. Please check your dashboard to accept or decline."]);

                return ["success" => "Delivery request declined. System automatically re-routed request to rider: " . $next_rider['name']];
            } else {
                // Reset delivery status to pending_assignment
                $stmt = $this->pdo->prepare("UPDATE delivery SET delivery_person_ID = NULL, status = 'pending_assignment' WHERE delivery_ID = ?");
                $stmt->execute([$delivery_ID]);
                return ["success" => "Delivery request declined. Awaiting new available campus riders."];
            }

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

        // Validate required fields for product-based jobs
        if ($app['is_product_based'] == 1) {
            if (empty($phone) || empty($pickup_address) || empty($dropoff_address)) {
                return ["error" => "Your Phone Number, Pickup Address, and Drop-off Address are required!"];
            }
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

        // Generate 6-digit OTP (Valid for 24 hours to accommodate long distance deliveries)
        $otp = rand(100000, 999999);
        $otp_expiry = date('Y-m-d H:i:s', time() + 24 * 3600); // 24 hours
        
        // Fetch student details
        $stmt = $this->pdo->prepare("SELECT name, email, phone FROM users WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        $student_name = $student['name'] ?? $user->name;
        $student_email = $student['email'] ?? '';
        $student_phone = !empty($phone) ? $phone : ($student['phone'] ?? '');

        // Fetch provider details
        $stmt = $this->pdo->prepare("
            SELECT u.name, u.email, u.phone 
            FROM users u
            JOIN job_provider jp ON u.user_ID = jp.user_ID
            WHERE jp.provider_ID = ?
        ");
        $stmt->execute([$app['provider_ID']]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);
        $provider_name = $provider['name'] ?? 'Client';
        $provider_email = $provider['email'] ?? '';
        $provider_phone = $provider['phone'] ?? '';

        // Prepare OTP message
        $otp_message = "GigConnect Job Completion OTP: {$otp}. Use this to confirm job completion for " . $app['job_title'] . ".";

        $provider_otp_message = $otp_message;
        if ($app['is_product_based'] == 1 && ($app['delivery_needed'] === '0' || $app['delivery_needed'] === 0 || $app['delivery_needed'] == 0)) {
            $provider_otp_message = "GigConnect Job Completion OTP: {$otp} for job '" . $app['job_title'] . "'. Student {$student_name} will self-deliver it. Contact student at: {$student_phone}.";
        }

        // Store OTP in delivery table
        $delivery_ID = $this->generateNextID('delivery', 'delivery_ID', 'DEL');
        $delivery_type = ($app['delivery_needed'] == 1) ? 'platform' : 'self';
        
        // Default status
        $delivery_person_ID = null;
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
        $pickup_coords = null;

        if ($app['delivery_needed'] == 1 && !empty($pickup_address) && !empty($dropoff_address)) {
            global $mapbox_token;
            if (!empty($mapbox_token)) {
                $pickup_coords = $this->geocodeAddressHelper($pickup_address, $mapbox_token);
                $dropoff_coords = $this->geocodeAddressHelper($dropoff_address, $mapbox_token);
                if ($pickup_coords && $dropoff_coords) {
                    // Try to get road distance via Mapbox Directions API
                    $road_dist = $this->getMapboxRoadDistance(
                        $pickup_coords['latitude'], $pickup_coords['longitude'],
                        $dropoff_coords['latitude'], $dropoff_coords['longitude'],
                        $mapbox_token
                    );

                    if ($road_dist !== null) {
                        $distance = $road_dist;
                    } else {
                        // Fallback to straight line Haversine distance
                        $distance = $this->getDistanceHelper(
                            $pickup_coords['latitude'], $pickup_coords['longitude'],
                            $dropoff_coords['latitude'], $dropoff_coords['longitude']
                        );
                    }
                    $delivery_fee = $distance * 30.00; // 30 LKR per km
                }
            }
        }

        // Find nearest available delivery staff
        $nearest_rider = null;
        if ($app['delivery_needed'] == 1) {
            global $mapbox_token;
            $riders_stmt = $this->pdo->query("
                SELECT ds.user_ID, ds.latitude, ds.longitude, ds.location, u.phone, u.name
                FROM delivery_staff ds
                JOIN users u ON ds.user_ID = u.user_ID
                WHERE ds.status = 'available' OR ds.status = 'active' OR ds.status = 'Active' OR ds.status IS NULL OR ds.status = ''
            ");
            $available_riders = $riders_stmt->fetchAll(PDO::FETCH_ASSOC);

            // Filter out riders with missing coordinates and geocode them if possible
            $valid_riders = [];
            foreach ($available_riders as $rider) {
                $r_lat = $rider['latitude'];
                $r_lng = $rider['longitude'];

                // Geocode rider location if lat/lng is missing
                if ((empty($r_lat) || empty($r_lng)) && !empty($rider['location']) && !empty($mapbox_token)) {
                    $rider_coords = $this->geocodeAddressHelper($rider['location'], $mapbox_token);
                    if ($rider_coords) {
                        $r_lat = $rider_coords['latitude'];
                        $r_lng = $rider_coords['longitude'];
                        
                        // Save coordinates to avoid geocoding again
                        $up_stmt = $this->pdo->prepare("UPDATE delivery_staff SET latitude = ?, longitude = ? WHERE user_ID = ?");
                        $up_stmt->execute([$r_lat, $r_lng, $rider['user_ID']]);
                    }
                }

                if (!empty($r_lat) && !empty($r_lng)) {
                    $rider['latitude'] = $r_lat;
                    $rider['longitude'] = $r_lng;
                    $valid_riders[] = $rider;
                }
            }

            $riders_with_distance = [];

            if ($pickup_coords && !empty($valid_riders)) {
                // Try Mapbox Matrix API for accurate routing distance to nearest available riders
                $matrix_distances = $this->getMapboxMatrixDistances(
                    $pickup_coords['latitude'], $pickup_coords['longitude'],
                    $valid_riders,
                    $mapbox_token
                );

                foreach ($valid_riders as $index => $rider) {
                    $dist = null;
                    if ($matrix_distances !== null && isset($matrix_distances[$index]) && $matrix_distances[$index] !== null) {
                        $dist = $matrix_distances[$index];
                    } else {
                        // Fallback: Haversine distance
                        $dist = $this->getDistanceHelper(
                            $pickup_coords['latitude'], $pickup_coords['longitude'],
                            $rider['latitude'], $rider['longitude']
                        );
                    }
                    if ($dist !== null) {
                        $rider['distance_to_pickup'] = $dist;
                        $riders_with_distance[] = $rider;
                    }
                }
            }

            $riders_within_10km = [];
            foreach ($riders_with_distance as $rider) {
                if ($rider['distance_to_pickup'] <= 10.0) {
                    $riders_within_10km[] = $rider;
                }
            }

            $nearest_rider = null;
            $min_distance = INF;

            if (!empty($riders_within_10km)) {
                // Assign nearest within 10km
                foreach ($riders_within_10km as $rider) {
                    if ($rider['distance_to_pickup'] < $min_distance) {
                        $min_distance = $rider['distance_to_pickup'];
                        $nearest_rider = $rider;
                    }
                }
            } else if (!empty($riders_with_distance)) {
                // Fallback to nearest overall
                foreach ($riders_with_distance as $rider) {
                    if ($rider['distance_to_pickup'] < $min_distance) {
                        $min_distance = $rider['distance_to_pickup'];
                        $nearest_rider = $rider;
                    }
                }
            }

            // Ultimate fallback: if coordinates/Mapbox distance checks return no rider, assign the first available rider in the database!
            if (!$nearest_rider && !empty($available_riders)) {
                $nearest_rider = $available_riders[0];
            }

            if ($nearest_rider) {
                $delivery_person_ID = $nearest_rider['user_ID'];
                $delivery_status = 'assigned'; // Auto-assigned directly

                // Update delivery staff status to busy
                $up_status_stmt = $this->pdo->prepare("UPDATE delivery_staff SET status = 'busy' WHERE user_ID = ?");
                $up_status_stmt->execute([$delivery_person_ID]);
            } else {
                $delivery_status = 'pending_assignment';
            }
        }

        // Insert delivery record
        $stmt = $this->pdo->prepare("
            INSERT INTO delivery 
            (delivery_ID, job_ID, sender_std_ID, delivery_person_ID, delivery_type, pickup_address, delivery_address, client_phone, distance, delivery_fee, otp, otp_expiry, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $delivery_ID,
            $job_ID,
            $user->user_ID,
            $delivery_person_ID,
            $delivery_type,
            $pickup_address,
            $dropoff_address,
            $client_phone,
            $distance,
            $delivery_fee,
            $otp,
            $otp_expiry,
            $delivery_status
        ]);

        $is_platform_delivery = ($app['is_product_based'] == 1 && $app['delivery_needed'] == 1);

        // Prepare notifications and send SMS / Emails
        if ($is_platform_delivery) {
            if ($nearest_rider) {
                // SMS notifications
                $student_sms = "GigConnect: Your delivery has been assigned to rider {$nearest_rider['name']} ({$nearest_rider['phone']}). Share this OTP when they arrive: {$otp}";
                $provider_sms = "GigConnect: Delivery rider {$nearest_rider['name']} ({$nearest_rider['phone']}) is bringing your package. Share this OTP: {$otp}";
                $rider_sms = "GigConnect: You are assigned to delivery {$delivery_ID}. Pickup address: {$pickup_address}, Dropoff: {$dropoff_address}. Contact student: {$student_name} ({$student_phone}). Confirm delivery with OTP: {$otp}";

                if (!empty($student_phone)) {
                    sendSMS($student_phone, $student_sms);
                }
                if (!empty($provider_phone)) {
                    sendSMS($provider_phone, $provider_sms);
                }
                if (!empty($nearest_rider['phone'])) {
                    sendSMS($nearest_rider['phone'], $rider_sms);
                }

                // Email notifications
                require_once __DIR__ . '/../config/mail.php';
                require_once __DIR__ . '/../config/email_templates.php';

                if (!empty($student_email)) {
                    $student_body = productVerificationOtpEmail($student_name, $otp, $app['job_title'], $nearest_rider['name'], $nearest_rider['phone']);
                    sendEmail($student_email, "GigConnect - Delivery Assigned & OTP", $student_body);
                }
                if (!empty($provider_email)) {
                    $provider_body = productVerificationOtpEmail($provider_name, $otp, $app['job_title'], $nearest_rider['name'], $nearest_rider['phone']);
                    sendEmail($provider_email, "GigConnect - Delivery Assigned & OTP", $provider_body);
                }

                // In-app notifications
                $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');
                $notif_stmt = $this->pdo->prepare("
                    INSERT INTO notification (notification_ID, user_ID, message, type, status) 
                    VALUES (?, ?, ?, 'delivery_assigned', 'unread')
                ");
                $notif_stmt->execute([$notif_ID, $user->user_ID, "Delivery staff {$nearest_rider['name']} has been assigned for your job " . $app['job_title']]);

                $notif_ID_staff = $this->generateNextID('notification', 'notification_ID', 'NOT');
                $notif_stmt_staff = $this->pdo->prepare("
                    INSERT INTO notification (notification_ID, user_ID, message, type, status) 
                    VALUES (?, ?, ?, 'delivery_assigned', 'unread')
                ");
                $notif_stmt_staff->execute([$notif_ID_staff, $delivery_person_ID, "New delivery request assigned. Check your dashboard for details."]);
            } else {
                // Platform delivery requested but no rider available
                $student_sms = "GigConnect: No available delivery staff found at the moment for job '" . $app['job_title'] . "'. We are searching for a rider. Your OTP is: {$otp}";
                $provider_sms = "GigConnect: A delivery (ID: {$delivery_ID}) has been created for your job '" . $app['job_title'] . "', awaiting rider assignment. Share this OTP: {$otp}";

                if (!empty($student_phone)) {
                    sendSMS($student_phone, $student_sms);
                }
                if (!empty($provider_phone)) {
                    sendSMS($provider_phone, $provider_sms);
                }

                // Email notifications
                require_once __DIR__ . '/../config/mail.php';
                require_once __DIR__ . '/../config/email_templates.php';

                if (!empty($student_email)) {
                    $student_body = productVerificationOtpEmail($student_name, $otp, $app['job_title']);
                    sendEmail($student_email, "GigConnect - Job Completion OTP", $student_body);
                }
                if (!empty($provider_email)) {
                    $provider_body = productVerificationOtpEmail($provider_name, $otp, $app['job_title']);
                    sendEmail($provider_email, "GigConnect - Job Completion OTP", $provider_body);
                }

                // In-app notifications
                $notif_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');
                $student_msg = "No available delivery riders were found at the moment for your job completion request of '" . $app['job_title'] . "'. Please wait or try self-delivery.";
                $notif_stmt = $this->pdo->prepare("
                    INSERT INTO notification (notification_ID, user_ID, message, type, status) 
                    VALUES (?, ?, ?, 'delivery_unavailable', 'unread')
                ");
                $notif_stmt->execute([$notif_ID, $user->user_ID, $student_msg]);
            }
        } else {
            // Self delivery
            if (!empty($student_phone)) {
                sendSMS($student_phone, $otp_message);
            }
            if (!empty($provider_phone)) {
                sendSMS($provider_phone, $provider_otp_message);
            }

            // Email notifications
            require_once __DIR__ . '/../config/mail.php';
            require_once __DIR__ . '/../config/email_templates.php';

            if (!empty($student_email)) {
                $student_body = productVerificationOtpEmail($student_name, $otp, $app['job_title']);
                sendEmail($student_email, "GigConnect - Job Completion OTP", $student_body);
            }
            if (!empty($provider_email)) {
                $provider_body = productVerificationOtpEmail($provider_name, $otp, $app['job_title']);
                if ($app['is_product_based'] == 1) {
                    $search_str = "<p><strong>" . htmlspecialchars($app['job_title']) . "</strong> Please enter this OTP on your dashboard to verify completion. If you did not request this, please ignore.</p>";
                    $replace_str = "<p><strong>" . htmlspecialchars($app['job_title']) . "</strong> Please enter this OTP on your dashboard to verify completion. Student <strong>{$student_name}</strong> will deliver the product. Contact student at: <strong>{$student_phone}</strong>.</p>";
                    $provider_body = str_replace($search_str, $replace_str, $provider_body);
                }
                sendEmail($provider_email, "GigConnect - Job Completion OTP", $provider_body);
            }
        }

        return [
            "success" => true,
            "message" => "Job marked as completed! OTP will be sent once the delivery staff accepts the assignment.",
            "otp" => $otp,
            "delivery_ID" => $delivery_ID
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
            SET delivery_person_ID = ?, status = 'pending_acceptance' 
            WHERE delivery_ID = ?
        ");
        $stmt->execute([$delivery_person_ID, $delivery_ID]);

        // Notify delivery staff via SMS
        $staff_sms = "You have a new delivery assignment. Check your dashboard for details.";
        if (!empty($staff_phone)) {
            sendSMS($staff_phone, $staff_sms);
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

        // OTP expiration check (Allowed if active delivery is in progress or within 24 hours)
        $active_statuses = ['assigned', 'picked_up', 'in_transit', 'delivered'];
        if (!empty($delivery['otp_expiry']) && !in_array(strtolower($delivery['status'] ?? ''), $active_statuses)) {
            $expiry = strtotime($delivery['otp_expiry']);
            if (time() > $expiry) {
                return ["error" => "OTP has expired. Please request a new one."];
            }
        }

        // OTP verification
        if (trim($delivery['otp']) !== trim($otp)) {
            return ["error" => "Invalid OTP. Please check with student."];
        }

        // Update delivery status to 'confirmed'
        $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'confirmed' WHERE delivery_ID = ?");
        $stmt->execute([$delivery_ID]);

        // Update delivery staff status back to 'available'
        if (!empty($delivery['delivery_person_ID'])) {
            $stmt = $this->pdo->prepare("UPDATE delivery_staff SET status = 'available' WHERE user_ID = ?");
            $stmt->execute([$delivery['delivery_person_ID']]);
        }

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
                   u2.name as client_name,
                   COALESCE(NULLIF(d.client_phone, ''), u2.phone) as client_phone,
                   u3.name as delivery_staff_name, u3.phone as delivery_staff_phone,
                   ds.vehicle_type as delivery_staff_vehicle
            FROM delivery d
            JOIN job j ON d.job_ID = j.job_ID
            JOIN users u ON d.sender_std_ID = u.user_ID
            LEFT JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            LEFT JOIN users u2 ON jp.user_ID = u2.user_ID
            LEFT JOIN users u3 ON d.delivery_person_ID = u3.user_ID
            LEFT JOIN delivery_staff ds ON u3.user_ID = ds.user_ID
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
            SELECT d.*, j.title as job_title, j.payment as job_payment, j.completed_time,
                   u.name as student_name, u.phone as student_phone,
                   u2.name as client_name,
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

    private function getMapboxRoadDistance($lat1, $lon1, $lat2, $lon2, $token) {
        $url = "https://api.mapbox.com/directions/v5/mapbox/driving/" . 
               $lon1 . "," . $lat1 . ";" . $lon2 . "," . $lat2 . 
               "?access_token=" . urlencode($token) . "&overview=false";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['routes'][0]['distance'])) {
                // convert meters to kilometers
                return $data['routes'][0]['distance'] / 1000.0;
            }
        }
        return null;
    }

    private function getMapboxMatrixDistances($source_lat, $source_lon, $destinations, $token) {
        if (empty($destinations)) {
            return [];
        }

        $coords = [$source_lon . "," . $source_lat];
        foreach ($destinations as $dest) {
            $coords[] = $dest['longitude'] . "," . $dest['latitude'];
        }

        $coords_str = implode(";", $coords);
        
        $dest_indices = [];
        for ($i = 1; $i <= count($destinations); $i++) {
            $dest_indices[] = $i;
        }
        $dest_indices_str = implode(",", $dest_indices);

        $url = "https://api.mapbox.com/directions-matrix/v1/mapbox/driving/" . 
               $coords_str . 
               "?sources=0&destinations=" . $dest_indices_str . 
               "&annotations=distance&access_token=" . urlencode($token);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['code']) && $data['code'] === 'Ok' && isset($data['distances'][0])) {
                $results = [];
                foreach ($data['distances'][0] as $index => $dist_meters) {
                    if ($dist_meters !== null) {
                        $results[$index] = $dist_meters / 1000.0; // convert to km
                    } else {
                        $results[$index] = null;
                    }
                }
                return $results;
            }
        }
        return null;
    }
}
?>
