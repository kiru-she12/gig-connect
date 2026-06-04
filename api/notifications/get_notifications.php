<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// get notifications for logged in user
$stmt = $pdo->prepare("
    SELECT notification_ID, message, type, status, created_at 
    FROM notification 
    WHERE user_ID = ?
    ORDER BY created_at DESC
");
$stmt->execute([$user->user_ID]);
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

if(!$notifications) {
    echo json_encode(["message" => "No notifications found!"]);
    exit();
}

// mark all as read
$stmt = $pdo->prepare("UPDATE notification SET status = 'read' WHERE user_ID = ?");
$stmt->execute([$user->user_ID]);

echo json_encode([
    "success" => true,
    "notifications" => $notifications
]);
?>