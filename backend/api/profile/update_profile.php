<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';
require '../../vendor/autoload.php';

require_once '../../controllers/ProfileController.php';

$user = authenticate();
$controller = new ProfileController($pdo);
$controller->updateProfile($user);
?>