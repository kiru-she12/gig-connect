<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only admin can disable users
if($user->role !== 'admin') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$user_ID = $data['user_ID'];
$action = $data['action']; // 'disable' or 'enable'

// check if user exists
$stmt = $pdo->prepare("SELECT * FROM users WHERE user_ID = ?");
$stmt->execute([$user_ID]);
$targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$targetUser) {
    echo json_encode(["error" => "User not found!"]);
    exit();
}

// admin cannot disable themselves
if($user_ID === $user->user_ID) {
    echo json_encode(["error" => "You cannot disable yourself!"]);
    exit();
}

if($action === 'disable') {
    $stmt = $pdo->prepare("UPDATE users SET status = 'banned' WHERE user_ID = ?");
    $stmt->execute([$user_ID]);
    echo json_encode(["success" => "User disabled successfully!"]);

} else if($action === 'enable') {
    $stmt = $pdo->prepare("UPDATE users SET status = 'active' WHERE user_ID = ?");
    $stmt->execute([$user_ID]);
    echo json_encode(["success" => "User enabled successfully!"]);

} else if($action === 'approve') {
    $stmt = $pdo->prepare("UPDATE users SET status = 'active' WHERE user_ID = ?");
    $stmt->execute([$user_ID]);

    // send approval email
    include '../../config/mail.php';
    include '../../config/email_templates.php';
    $approval_body = approvalEmail($target_user['name'], $target_user['role']);
    sendEmail($target_user['email'], "GigConnect - Account Approved!", $approval_body);

    echo json_encode(["success" => "User approved successfully!"]);

} else {
    echo json_encode(["error" => "Invalid action!"]);
}
?>