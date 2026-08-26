<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

try {
    require_once __DIR__ . '/../../config/db.php';
    require_once __DIR__ . '/../../middleware/auth.php';
    require_once __DIR__ . '/../../vendor/autoload.php';
    require_once __DIR__ . '/../../controllers/AdminController.php';

    $user = authenticate();
    $adminController = new AdminController($pdo);
    $adminController->handleComplaints($user);
} catch (Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
