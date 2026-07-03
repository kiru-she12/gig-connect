<?php
require_once __DIR__ . '/../../config/cors.php';
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';
require '../../vendor/autoload.php';

require_once '../../controllers/PaymentController.php';

$user = authenticate();
$controller = new PaymentController($pdo);
$controller->createCommission($user);
?>
