<?php
// backend/api/messages/flag_message.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    if ($user->role !== 'admin' && $user->role !== 'manager') {
        echo json_encode(["error" => "Unauthorized. Admin or Manager access required."]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $msg_ID = $data['msg_id'] ?? $data['msg_ID'] ?? null;
    $job_ID = $data['conversation_id'] ?? $data['job_id'] ?? null;
    $action = $data['action'] ?? 'flag'; // 'flag' or 'unflag'
    $reason = $data['reason'] ?? 'Flagged by Administrator for inspection';

    if ($action === 'unflag') {
        if ($msg_ID) {
            $stmt = $pdo->prepare("UPDATE communication SET flagged = 0, flagged_reason = NULL WHERE msg_ID = ?");
            $stmt->execute([$msg_ID]);
        } else if ($job_ID) {
            $stmt = $pdo->prepare("UPDATE communication SET flagged = 0, flagged_reason = NULL WHERE job_ID = ?");
            $stmt->execute([$job_ID]);
        }
        echo json_encode(["success" => true, "message" => "Unflagged successfully"]);
    } else {
        if ($msg_ID) {
            $stmt = $pdo->prepare("UPDATE communication SET flagged = 1, flagged_reason = ? WHERE msg_ID = ?");
            $stmt->execute([$reason, $msg_ID]);
        } else if ($job_ID) {
            $stmt = $pdo->prepare("UPDATE communication SET flagged = 1, flagged_reason = ? WHERE job_ID = ?");
            $stmt->execute([$reason, $job_ID]);
        }
        echo json_encode(["success" => true, "message" => "Flagged successfully"]);
    }

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
