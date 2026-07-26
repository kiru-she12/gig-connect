<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../vendor/autoload.php';

require_once __DIR__ . '/../../controllers/JobController.php';

$jobController = new JobController($pdo);
$jobController->getJobs();
?>