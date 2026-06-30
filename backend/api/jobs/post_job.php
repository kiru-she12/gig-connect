<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

require_once '../../controllers/JobController.php';

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);

$jobController = new JobController($pdo);
$jobController->postJob($data, $user);
?>