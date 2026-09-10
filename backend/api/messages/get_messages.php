<?php
// backend/api/messages/get_messages.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    $job_ID = $_GET['conversation_id'] ?? $_GET['job_id'] ?? null;
    $partner_user_ID = $_GET['partner_user_id'] ?? $_GET['partner_id'] ?? null;

    if (!$job_ID) {
        echo json_encode(["error" => "Missing conversation_id/job_id"]);
        exit;
    }

    if ($user->role === 'admin' || $user->role === 'manager') {
        $stmt = $pdo->prepare("
            SELECT c.*, u1.name as sender_name, u2.name as receiver_name 
            FROM communication c
            JOIN users u1 ON c.sender_ID = u1.user_ID
            JOIN users u2 ON c.receiver_ID = u2.user_ID
            WHERE c.job_ID = ?
            ORDER BY COALESCE(c.created_at, c.timestamp) ASC
        ");
        $stmt->execute([$job_ID]);
    } else {
        // Automatically mark received messages as read
        $markStmt = $pdo->prepare("
            UPDATE communication 
            SET is_read = 1 
            WHERE job_ID = ? AND receiver_ID = ? AND is_read = 0
        ");
        $markStmt->execute([$job_ID, $user->user_ID]);

        $stmt = $pdo->prepare("
            SELECT c.*, u1.name as sender_name, u2.name as receiver_name 
            FROM communication c
            JOIN users u1 ON c.sender_ID = u1.user_ID
            JOIN users u2 ON c.receiver_ID = u2.user_ID
            WHERE c.job_ID = ? 
              AND (c.sender_ID = ? OR c.receiver_ID = ?)
              AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
            ORDER BY COALESCE(c.created_at, c.timestamp) ASC
        ");
        $stmt->execute([$job_ID, $user->user_ID, $user->user_ID]);
    }

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get application status for the job conversation
    $appStmt = $pdo->prepare("
        SELECT status FROM application WHERE job_ID = ? LIMIT 1
    ");
    $appStmt->execute([$job_ID]);
    $appRow = $appStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "application_status" => $appRow['status'] ?? 'shortlisted',
        "messages" => $messages
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
