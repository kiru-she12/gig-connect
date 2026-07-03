<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
require '../../vendor/autoload.php';

require_once '../../controllers/JobController.php';

$jobController = new JobController($pdo);
$jobController->getJobs();
?>