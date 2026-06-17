<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include '../../config/db.php';
include '../../middleware/auth.php';

try {
    $user = authenticate();
    $data = json_decode(file_get_contents("php://input"), true);

    $job_ID = $data['conversation_id'] ?? null;
    $receiver_ID = $data['receiver_id'] ?? null;
    $content = $data['content'] ?? null;

    if (!$job_ID || !$receiver_ID || !$content) {
        echo json_encode(["error" => "Missing required fields"]);
        exit;
    }

    // Verify that conversation is not terminated
    $stmt = $pdo->prepare("SELECT status FROM communication WHERE job_ID = ? AND status = 'terminated' LIMIT 1");
    $stmt->execute([$job_ID]);
    if ($stmt->fetch()) {
        echo json_encode(["error" => "This conversation has been terminated by administrator and is closed."]);
        exit;
    }

    // Check if there is an accepted/shortlisted match between student and job provider
    $stmt = $pdo->prepare("
        SELECT a.application_ID, a.status 
        FROM application a
        JOIN student s ON a.student_ID = s.student_ID
        JOIN job j ON a.job_ID = j.job_ID
        JOIN job_provider jp ON j.provider_ID = jp.provider_ID
        WHERE a.job_ID = ? 
          AND (s.user_ID = ? OR jp.user_ID = ?)
          AND (s.user_ID = ? OR jp.user_ID = ?)
          AND a.status IN ('accepted', 'shortlisted')
    ");
    $stmt->execute([$job_ID, $user->user_ID, $user->user_ID, $receiver_ID, $receiver_ID]);
    $match = $stmt->fetch();

    if (!$match) {
        echo json_encode(["error" => "You can only message after a job match is established (Shortlisted or Accepted)."]);
        exit;
    }

    // Check for terms violations
    $flagged = 0;
    $flagged_reason = null;
    $lower_content = strtolower($content);

    $violating_words = ['whatsapp', 'viber', 'telegram', 'direct pay', 'bank transfer', 'bank account', 'phone number', 'contact me', 'call me', 'mobile number', 'payout outside', 'offplatform', 'off-platform'];
    foreach ($violating_words as $word) {
        if (strpos($lower_content, $word) !== false) {
            $flagged = 1;
            $flagged_reason = "System Flag: Detected potential off-platform payment/communication keywords ('$word').";
            break;
        }
    }

    // Also detect email or phone number patterns
    if (preg_match('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/i', $content) || preg_match('/\b\d{9,11}\b/', $content)) {
        $flagged = 1;
        $flagged_reason = "System Flag: Detected email address or phone number pattern.";
    }

    // Generate msg_ID
    $msg_ID = 'MSG' . uniqid();

    // Insert message
    $stmt = $pdo->prepare("
        INSERT INTO communication (msg_ID, sender_ID, receiver_ID, content, job_ID, flagged, flagged_reason) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
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
            "flagged" => $flagged,
            "flagged_reason" => $flagged_reason,
            "timestamp" => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
