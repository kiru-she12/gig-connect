<?php
require_once __DIR__ . '/../../config/cors.php';
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../vendor/autoload.php';

require_once __DIR__ . '/../../controllers/AdminController.php';

$user = authenticate();
$adminController = new AdminController($pdo);
$adminController->addStaff($user);
?>