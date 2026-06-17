<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include '../../config/db.php';
include '../../middleware/auth.php';

class Application {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function applyJob($data, $user) {
        // Only students can apply
        if ($user->role !== 'student') {
            return ["error" => "Only students can apply for jobs!"];
        }

        $job_ID           = $data['job_ID'] ?? null;
        $delivery_preference = $data['delivery_preference'] ?? null; // 'self' | 'platform' | null
        $pickup_address   = trim($data['pickup_address'] ?? '');
        $delivery_address = trim($data['delivery_address'] ?? '');

        if (!$job_ID) {
            return ["error" => "Job ID is required!"];
        }

        // Check if job exists and is active
        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'active'");
        $stmt->execute([$job_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            return ["error" => "Job not found or not active!"];
        }

        // Validate delivery choice for product-based jobs
        if ($job['is_product_based'] == 1) {
            if (!$delivery_preference || !in_array($delivery_preference, ['self', 'platform'])) {
                return ["error" => "This is a product-based job. Please choose a delivery method (self or platform)."];
            }
            if (empty($pickup_address) || empty($delivery_address)) {
                return ["error" => "Please provide both pickup and delivery addresses for product-based jobs."];
            }
        }

        // Get student_ID
        $stmt = $this->pdo->prepare("SELECT student_ID FROM student WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            return ["error" => "Student profile not found!"];
        }
        $student_ID = $student['student_ID'];

        // Check if already applied
        $stmt = $this->pdo->prepare("SELECT * FROM application WHERE job_ID = ? AND student_ID = ?");
        $stmt->execute([$job_ID, $student_ID]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            return ["error" => "You already applied for this job!"];
        }

        // Generate application ID
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM application");
        $count = $stmt->fetchColumn();
        $application_ID = 'APP' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        // Insert application (with delivery info if product-based)
        $stmt = $this->pdo->prepare(
            "INSERT INTO application (application_ID, job_ID, student_ID, delivery_preference, pickup_address, delivery_address) VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $application_ID,
            $job_ID,
            $student_ID,
            $delivery_preference ?: null,
            $delivery_preference ? $pickup_address : null,
            $delivery_preference ? $delivery_address : null
        ]);

        // If product-based, create a pending delivery record immediately
        $delivery_ID = null;
        if ($job['is_product_based'] == 1 && $delivery_preference) {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM delivery");
            $del_count = $stmt->fetchColumn();
            $delivery_ID = 'DEL' . str_pad($del_count + 1, 3, '0', STR_PAD_LEFT);
            $otp = rand(100000, 999999);

            $stmt = $this->pdo->prepare(
                "INSERT INTO delivery (delivery_ID, job_ID, sender_std_ID, delivery_type, pickup_address, delivery_address, otp, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')"
            );
            $stmt->execute([
                $delivery_ID,
                $job_ID,
                $student_ID,
                $delivery_preference,
                $pickup_address,
                $delivery_address,
                $otp
            ]);

            // Notify admin if platform delivery requested
            if ($delivery_preference === 'platform') {
                $notif_stmt = $this->pdo->prepare("SELECT user_ID FROM users WHERE role = 'admin' LIMIT 1");
                $notif_stmt->execute();
                $admin_id = $notif_stmt->fetchColumn() ?: 'ADM001';

                $notif_count = $this->pdo->query("SELECT COUNT(*) FROM notification")->fetchColumn();
                $notif_ID = 'NOT' . str_pad($notif_count + 1, 3, '0', STR_PAD_LEFT);
                $notif_msg = "New platform delivery request (ID: {$delivery_ID}) for Job {$job_ID}. Please assign a rider when the job is accepted.";
                $ins = $this->pdo->prepare("INSERT INTO notification (notification_ID, user_ID, message, type, status) VALUES (?, ?, ?, 'delivery_request', 'unread')");
                $ins->execute([$notif_ID, $admin_id, $notif_msg]);
            }
        }

        $response = [
            "success"        => "Applied successfully!",
            "application_ID" => $application_ID,
            "is_product_based" => (bool)$job['is_product_based']
        ];
        if ($delivery_ID) {
            $response["delivery_ID"] = $delivery_ID;
        }
        return $response;
    }
}

// Run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$application = new Application($pdo);
$result = $application->applyJob($data, $user);
echo json_encode($result);
?>