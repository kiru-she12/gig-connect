<?php
// backend/api/messages/mark_as_read.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    $data = json_decode(file_get_contents("php://input"), true);
    $job_ID = $data['conversation_id'] ?? $data['job_id'] ?? null;

    if ($job_ID) {
        $stmt = $pdo->prepare("UPDATE communication SET is_read = 1 WHERE job_ID = ? AND receiver_ID = ?");
        $stmt->execute([$job_ID, $user->user_ID]);
    }

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
