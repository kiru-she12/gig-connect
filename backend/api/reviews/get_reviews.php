<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../vendor/autoload.php';

require_once __DIR__ . '/../../controllers/ReviewController.php';

$controller = new ReviewController($pdo);
$controller->getReviews();
?>