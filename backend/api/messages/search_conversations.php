<?php
// backend/api/messages/search_conversations.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    $query = isset($_GET['q']) ? trim($_GET['q']) : (isset($_GET['query']) ? trim($_GET['query']) : '');

    $_GET['search'] = $query;
    require __DIR__ . '/get_conversations.php';
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
