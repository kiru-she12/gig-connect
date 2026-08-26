<?php
// backend/api/messages/get_unread_count.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    $stmt = $pdo->prepare("SELECT COUNT(*) as unread_count FROM communication WHERE receiver_ID = ? AND is_read = 0");
    $stmt->execute([$user->user_ID]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "unread_count" => (int)($res['unread_count'] ?? 0)
    ]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
