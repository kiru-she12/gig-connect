<?php
// backend/api/messages/ban_user.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    if ($user->role !== 'admin') {
        echo json_encode(["error" => "Unauthorized. Admin access required."]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $target_user_id = $data['user_id'] ?? null;

    if (!$target_user_id) {
        echo json_encode(["error" => "Missing target user_id"]);
        exit;
    }

    // Update status in users table if status column exists
    $stmt = $pdo->prepare("UPDATE users SET status = 'banned' WHERE user_ID = ?");
    $stmt->execute([$target_user_id]);

    echo json_encode(["success" => true, "message" => "User account banned successfully."]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
