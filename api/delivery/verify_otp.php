<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

$data = json_decode(file_get_contents("php://input"), true);

$delivery_ID = $data['delivery_ID'];
$otp = $data['otp'];

// check if delivery exists
$stmt = $pdo->prepare("SELECT * FROM delivery WHERE delivery_ID = ?");
$stmt->execute([$delivery_ID]);
$delivery = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$delivery) {
    echo json_encode(["error" => "Delivery not found!"]);
    exit();
}

// verify otp
if($delivery['otp'] != $otp) {
    echo json_encode(["error" => "Invalid OTP!"]);
    exit();
}

// update delivery status to delivered
$stmt = $pdo->prepare("UPDATE delivery SET status = 'delivered' WHERE delivery_ID = ?");
$stmt->execute([$delivery_ID]);

// update job status to completed
$stmt = $pdo->prepare("UPDATE job SET status = 'completed', completed_time = NOW() WHERE job_ID = ?");
$stmt->execute([$delivery['job_ID']]);

echo json_encode([
    "success" => "OTP verified! Delivery completed successfully!",
    "delivery_ID" => $delivery_ID
]);
?>