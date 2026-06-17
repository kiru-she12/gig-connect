<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include '../../config/db.php';
include '../../middleware/auth.php';

try {
    $user = authenticate();
    $conversation_id = $_GET['conversation_id'] ?? null;

    if (!$conversation_id) {
        echo json_encode(["error" => "conversation_id is required!"]);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT c.*, u1.name as sender_name, u2.name as receiver_name 
        FROM communication c
        JOIN users u1 ON c.sender_ID = u1.user_ID
        JOIN users u2 ON c.receiver_ID = u2.user_ID
        WHERE c.job_ID = ? AND (c.sender_ID = ? OR c.receiver_ID = ?)
        ORDER BY c.timestamp ASC
    ");
    $stmt->execute([$conversation_id, $user->user_ID, $user->user_ID]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "messages" => $messages
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
