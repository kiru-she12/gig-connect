<?php
// backend/api/messages/terminate_conversation.php
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
    $job_ID = $data['conversation_id'] ?? $data['job_id'] ?? null;

    if (!$job_ID) {
        echo json_encode(["error" => "Missing conversation_id/job_id"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE communication SET status = 'terminated' WHERE job_ID = ?");
    $stmt->execute([$job_ID]);

    echo json_encode(["success" => true, "message" => "Conversation locked and terminated successfully."]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
