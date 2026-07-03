<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';
require '../../vendor/autoload.php';

require_once '../../controllers/AdminController.php';

$user = authenticate();
$adminController = new AdminController($pdo);
$adminController->disableUser($user);
?>