<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../vendor/autoload.php';

require_once __DIR__ . '/../../controllers/DeliveryController.php';

$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

if ($user->role !== 'student') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized! Only students can confirm self-delivery."]);
    exit;
}

$controller = new DeliveryController($pdo);
$controller->confirmSelfDelivery($user);
?>
