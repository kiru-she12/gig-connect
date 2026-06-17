<?php
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include '../../config/db.php';
include '../../middleware/auth.php';

class Delivery {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function verifyOtp($data, $user) {
        $delivery_ID = $data['delivery_ID'];
        $otp = $data['otp'];

        $stmt = $this->pdo->prepare("SELECT * FROM delivery WHERE delivery_ID = ?");
        $stmt->execute([$delivery_ID]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$delivery) {
            return ["error" => "Delivery not found!"];
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
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$delivery = new Delivery($pdo);
$result = $delivery->verifyOtp($data, $user);
echo json_encode($result);
?>