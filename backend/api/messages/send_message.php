<?php
// backend/api/messages/send_message.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    $data = json_decode(file_get_contents("php://input"), true);

    $job_ID = $data['conversation_id'] ?? $data['job_id'] ?? null;
    $receiver_ID = $data['receiver_id'] ?? null;
    $content = isset($data['content']) ? trim($data['content']) : null;

    if (!$job_ID || !$receiver_ID || !$content) {
        echo json_encode(["error" => "Missing required fields"]);
        exit;
    }

    if (mb_strlen($content) > 1000) {
        echo json_encode(["error" => "Message cannot exceed 1000 characters."]);
        exit;
    }

    // Block external links, URLs, phone numbers, emails, and social handles
    $lower_content = strtolower($content);

    // 1. External URLs & links
    if (preg_match('/(https?:\/\/|www\.|[a-z0-9\-]+\.(com|org|net|io|co|me|dev|app|info|xyz))/i', $content)) {
        echo json_encode(["error" => "External links are not allowed."]);
        exit;
    }

    // 2. Email addresses
    if (preg_match('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/i', $content)) {
        echo json_encode(["error" => "External links and contact info are not allowed."]);
        exit;
    }

    // 3. Phone numbers & blocked keywords
    $blocked_keywords = ['whatsapp', 'telegram', 'discord', 'viber', 'direct pay', 'bank transfer', 'payout outside', 'offplatform', 'off-platform'];
    foreach ($blocked_keywords as $keyword) {
        if (strpos($lower_content, $keyword) !== false) {
            echo json_encode(["error" => "External contact methods ($keyword) are not allowed."]);
            exit;
        }
    }

    if (preg_match('/\b\d{9,12}\b/', $content)) {
        echo json_encode(["error" => "Phone numbers are not allowed for security reasons."]);
        exit;
    }

    // Check if conversation is terminated by Admin
    $stmt = $pdo->prepare("SELECT status FROM communication WHERE job_ID = ? AND status = 'terminated' LIMIT 1");
    $stmt->execute([$job_ID]);
    if ($stmt->fetch()) {
        echo json_encode(["error" => "This conversation has been terminated by an administrator and is closed."]);
        exit;
    }

    // Verify application status between student and job provider
    $stmt = $pdo->prepare("
        SELECT a.application_ID, a.status as app_status 
        FROM application a
        JOIN student s ON a.student_ID = s.student_ID
        JOIN job j ON a.job_ID = j.job_ID
        JOIN job_provider jp ON j.provider_ID = jp.provider_ID
        WHERE a.job_ID = ? 
          AND (s.user_ID = ? OR jp.user_ID = ?)
          AND (s.user_ID = ? OR jp.user_ID = ?)
        LIMIT 1
    ");
    $stmt->execute([$job_ID, $user->user_ID, $user->user_ID, $receiver_ID, $receiver_ID]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        echo json_encode(["error" => "No valid application match found for this conversation."]);
        exit;
    }

    $appStatus = strtolower($application['app_status']);

    if ($appStatus === 'applied') {
        echo json_encode(["error" => "You can message after being shortlisted."]);
        exit;
    }

    if ($appStatus === 'delivered' || $appStatus === 'review_submitted') {
        echo json_encode(["error" => "Conversation archived. Messaging is locked after delivery."]);
        exit;
    }

    if (!in_array($appStatus, ['shortlisted', 'accepted', 'completed'])) {
        echo json_encode(["error" => "Messaging is not allowed for the current application status."]);
        exit;
    }

    // System Flagging for subtle keywords (logging for admin)
    $flagged = 0;
    $flagged_reason = null;

    // Generate unique msg_ID
    $msg_ID = 'MSG' . uniqid();

    // Insert message
    $stmt = $pdo->prepare("
        INSERT INTO communication (msg_ID, sender_ID, receiver_ID, content, job_ID, is_read, flagged, flagged_reason, created_at) 
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())
    ");
    $stmt->execute([$msg_ID, $user->user_ID, $receiver_ID, $content, $job_ID, $flagged, $flagged_reason]);

    echo json_encode([
        "success" => true,
        "message" => [
            "msg_ID" => $msg_ID,
            "sender_ID" => $user->user_ID,
            "receiver_ID" => $receiver_ID,
            "content" => $content,
            "job_ID" => $job_ID,
            "created_at" => date('Y-m-d H:i:s'),
            "is_read" => 0
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
