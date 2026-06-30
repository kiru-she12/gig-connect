<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../config/mail.php';
include '../../config/email_templates.php';
include '../../config/sms.php';

require_once '../../controllers/AuthController.php';

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    require_once '../../views/JsonView.php';
    JsonView::render(["error" => "Invalid input data!"]);
}

$authController = new AuthController($pdo);
$authController->register($data);
?>