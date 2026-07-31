<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../vendor/autoload.php';

require_once __DIR__ . '/../../controllers/AuthController.php';

$authController = new AuthController($pdo);
$authController->register();
?>