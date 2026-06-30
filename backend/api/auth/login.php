<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
require '../../vendor/autoload.php';

require_once '../../controllers/AuthController.php';

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['email']) || !isset($data['password'])) {
    require_once '../../views/JsonView.php';
    JsonView::render(["error" => "Invalid email or password input data!"]);
}

$authController = new AuthController($pdo);
$authController->login($data);
?>