<?php
require_once __DIR__ . '/../../config/cors.php';
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Content-Type: application/json");
include '../../config/db.php';
include '../../middleware/auth.php';
include '../../config/sms.php';

class Delivery {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
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

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM delivery");
        $count = $stmt->fetchColumn();
        $delivery_ID = 'DEL' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

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
            $notif_count = $this->pdo->query("SELECT COUNT(*) FROM notification")->fetchColumn();
            $notif_ID = 'NOT' . str_pad($notif_count + 1, 3, '0', STR_PAD_LEFT);

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
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$delivery = new Delivery($pdo);
$result = $delivery->createDelivery($data, $user);
echo json_encode($result);
?>