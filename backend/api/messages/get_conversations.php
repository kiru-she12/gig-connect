<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
include '../../config/db.php';
include '../../middleware/auth.php';

try {
    $user = authenticate();
    
    if ($user->role === 'student') {
        $stmt = $pdo->prepare("
            SELECT DISTINCT a.job_ID as conversation_id, j.title as job_title,
                   u.user_ID as partner_user_ID, u.name as partner_name, u.role as partner_role,
                   (SELECT content FROM communication WHERE job_ID = a.job_ID AND (sender_ID = ? OR receiver_ID = ?) ORDER BY timestamp DESC LIMIT 1) as last_message,
                   (SELECT timestamp FROM communication WHERE job_ID = a.job_ID AND (sender_ID = ? OR receiver_ID = ?) ORDER BY timestamp DESC LIMIT 1) as last_message_time
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            JOIN users u ON jp.user_ID = u.user_ID
            JOIN student s ON a.student_ID = s.student_ID
            WHERE s.user_ID = ? AND a.status IN ('accepted', 'shortlisted')
        ");
        $stmt->execute([$user->user_ID, $user->user_ID, $user->user_ID, $user->user_ID, $user->user_ID]);
    } else {
        $stmt = $pdo->prepare("
            SELECT DISTINCT a.job_ID as conversation_id, j.title as job_title,
                   u.user_ID as partner_user_ID, u.name as partner_name, u.role as partner_role,
                   (SELECT content FROM communication WHERE job_ID = a.job_ID AND (sender_ID = ? OR receiver_ID = ?) ORDER BY timestamp DESC LIMIT 1) as last_message,
                   (SELECT timestamp FROM communication WHERE job_ID = a.job_ID AND (sender_ID = ? OR receiver_ID = ?) ORDER BY timestamp DESC LIMIT 1) as last_message_time
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            JOIN student s ON a.student_ID = s.student_ID
            JOIN users u ON s.user_ID = u.user_ID
            WHERE jp.user_ID = ? AND a.status IN ('accepted', 'shortlisted')
        ");
        $stmt->execute([$user->user_ID, $user->user_ID, $user->user_ID, $user->user_ID, $user->user_ID]);
    }
    
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "conversations" => $conversations
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
