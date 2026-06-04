<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only students can create delivery
if($user->role !== 'student') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$job_ID = $data['job_ID'];
$delivery_type = $data['delivery_type']; // 'self' or 'platform'
$pickup_address = $data['pickup_address'];
$delivery_address = $data['delivery_address'];
$distance = $data['distance'] ?? null;

// check if job exists and is in progress
$stmt = $pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'in_progress'");
$stmt->execute([$job_ID]);
$job = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$job) {
    echo json_encode(["error" => "Job not found or not in progress!"]);
    exit();
}

// generate delivery ID
$stmt = $pdo->query("SELECT COUNT(*) FROM delivery");
$count = $stmt->fetchColumn();
$delivery_ID = 'DEL' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

// generate OTP
$otp = rand(100000, 999999);

// insert delivery
$stmt = $pdo->prepare("INSERT INTO delivery (delivery_ID, job_ID, sender_std_ID, delivery_type, pickup_address, delivery_address, distance, otp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
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

echo json_encode([
    "success" => "Delivery created successfully!",
    "delivery_ID" => $delivery_ID,
    "otp" => $otp
]);
?>