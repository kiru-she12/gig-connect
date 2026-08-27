<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../vendor/autoload.php';

require_once __DIR__ . '/../../controllers/DeliveryController.php';

$user = authenticate();
$controller = new DeliveryController($pdo);
$controller->completeJob($user);
?>
