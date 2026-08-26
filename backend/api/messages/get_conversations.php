<?php
// backend/api/messages/get_conversations.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    if ($user->role === 'student') {
        $sql = "
            SELECT DISTINCT 
                a.job_ID as conversation_id, 
                a.job_ID,
                j.title as job_title,
                a.status as application_status,
                u.user_ID as partner_user_ID, 
                u.name as partner_name, 
                u.role as partner_role,
                (SELECT content FROM communication WHERE job_ID = a.job_ID AND (sender_ID = u.user_ID OR receiver_ID = u.user_ID) ORDER BY created_at DESC, timestamp DESC LIMIT 1) as last_message,
                (SELECT COALESCE(created_at, timestamp) FROM communication WHERE job_ID = a.job_ID AND (sender_ID = u.user_ID OR receiver_ID = u.user_ID) ORDER BY created_at DESC, timestamp DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM communication WHERE job_ID = a.job_ID AND receiver_ID = ? AND sender_ID = u.user_ID AND is_read = 0) as unread_count
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            JOIN users u ON jp.user_ID = u.user_ID
            JOIN student s ON a.student_ID = s.student_ID
            WHERE s.user_ID = ? AND a.status IN ('shortlisted', 'accepted', 'completed', 'delivered', 'review_submitted')
        ";
        $params = [$user->user_ID, $user->user_ID];

        if ($search !== '') {
            $sql .= " AND (u.name LIKE ? OR j.title LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= " ORDER BY last_message_time DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } else if ($user->role === 'job_provider' || $user->role === 'client') {
        $sql = "
            SELECT DISTINCT 
                a.job_ID as conversation_id, 
                a.job_ID,
                j.title as job_title,
                a.status as application_status,
                u.user_ID as partner_user_ID, 
                u.name as partner_name, 
                u.role as partner_role,
                (SELECT content FROM communication WHERE job_ID = a.job_ID AND (sender_ID = u.user_ID OR receiver_ID = u.user_ID) ORDER BY created_at DESC, timestamp DESC LIMIT 1) as last_message,
                (SELECT COALESCE(created_at, timestamp) FROM communication WHERE job_ID = a.job_ID AND (sender_ID = u.user_ID OR receiver_ID = u.user_ID) ORDER BY created_at DESC, timestamp DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM communication WHERE job_ID = a.job_ID AND receiver_ID = ? AND sender_ID = u.user_ID AND is_read = 0) as unread_count
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            JOIN student s ON a.student_ID = s.student_ID
            JOIN users u ON s.user_ID = u.user_ID
            WHERE jp.user_ID = ? AND a.status IN ('shortlisted', 'accepted', 'completed', 'delivered', 'review_submitted')
        ";
        $params = [$user->user_ID, $user->user_ID];

        if ($search !== '') {
            $sql .= " AND (u.name LIKE ? OR j.title LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= " ORDER BY last_message_time DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } else if ($user->role === 'admin') {
        // Admin gets all active conversations
        $sql = "
            SELECT DISTINCT 
                c.job_ID as conversation_id,
                c.job_ID,
                j.title as job_title,
                'accepted' as application_status,
                u1.user_ID as sender_ID,
                u1.name as sender_name,
                u2.user_ID as receiver_ID,
                u2.name as receiver_name,
                (SELECT content FROM communication WHERE job_ID = c.job_ID ORDER BY created_at DESC, timestamp DESC LIMIT 1) as last_message,
                (SELECT COALESCE(created_at, timestamp) FROM communication WHERE job_ID = c.job_ID ORDER BY created_at DESC, timestamp DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM communication WHERE job_ID = c.job_ID AND flagged = 1) as flagged_count
            FROM communication c
            LEFT JOIN job j ON c.job_ID = j.job_ID
            JOIN users u1 ON c.sender_ID = u1.user_ID
            JOIN users u2 ON c.receiver_ID = u2.user_ID
        ";
        $params = [];
        if ($search !== '') {
            $sql .= " WHERE u1.name LIKE ? OR u2.name LIKE ? OR j.title LIKE ?";
            $params = ["%$search%", "%$search%", "%$search%"];
        }
        $sql .= " ORDER BY last_message_time DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $conversations = [];
    }

    echo json_encode([
        "success" => true,
        "conversations" => $conversations
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
