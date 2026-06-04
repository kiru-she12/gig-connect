<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only admin and manager can send notifications
if($user->role !== 'admin' && $user->role !== 'manager') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$user_ID = $data['user_ID'];
$message = $data['message'];
$type = $data['type'] ?? 'general';

// check if user exists
$stmt = $pdo->prepare("SELECT * FROM users WHERE user_ID = ?");
$stmt->execute([$user_ID]);
$target_user = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$target_user) {
    echo json_encode(["error" => "User not found!"]);
    exit();
}

// generate notification ID
$stmt = $pdo->query("SELECT COUNT(*) FROM notification");
$count = $stmt->fetchColumn();
$notification_ID = 'NOT' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

// insert notification
$stmt = $pdo->prepare("INSERT INTO notification (notification_ID, user_ID, message, type) VALUES (?, ?, ?, ?)");
$stmt->execute([$notification_ID, $user_ID, $message, $type]);

echo json_encode([
    "success" => "Notification sent successfully!",
    "notification_ID" => $notification_ID
]);
?>