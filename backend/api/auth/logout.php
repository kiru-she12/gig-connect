<?php
require_once __DIR__ . '/../../config/cors.php';
include '../../config/db.php';
header("Content-Type: application/json");

require_once '../../controllers/AuthController.php';

$authController = new AuthController($pdo);
$authController->logout();
?>
