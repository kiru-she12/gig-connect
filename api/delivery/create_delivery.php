<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

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