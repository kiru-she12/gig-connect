<?php
// backend/api/messages/warn_user.php
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
    $warning_text = $data['warning'] ?? $data['message'] ?? 'Admin Warning: Please adhere to platform messaging guidelines.';

    if (!$target_user_id) {
        echo json_encode(["error" => "Missing target user_id"]);
        exit;
    }

    // Insert warning notification
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_ID, title, message, is_read, created_at) 
        VALUES (?, 'System Warning from Admin', ?, 0, NOW())
    ");
    $stmt->execute([$target_user_id, $warning_text]);

    echo json_encode(["success" => true, "message" => "Warning issued to user successfully."]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
