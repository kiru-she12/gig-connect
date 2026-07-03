<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
require '../../vendor/autoload.php';

require_once '../../controllers/AuthController.php';

$authController = new AuthController($pdo);
$authController->logout();
?>
