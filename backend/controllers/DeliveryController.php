<?php
// backend/controllers/DeliveryController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/DeliveryModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class DeliveryController extends BaseController {

    public function verifyOtp($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['delivery_ID']) || !isset($data['otp'])) {
            JsonView::render(["error" => "Delivery ID and OTP are required!"]);
        }
        $model = new DeliveryModel($this->pdo);
        $result = $model->verifyOtp($data, $user);
        JsonView::render($result);
    }

    public function updateDelivery($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['delivery_ID']) || !isset($data['action'])) {
            JsonView::render(["error" => "Delivery ID and Action are required!"]);
        }
        $model = new DeliveryModel($this->pdo);
        $result = $model->updateDelivery($data, $user);
        JsonView::render($result);
    }

    public function getDeliveries($user) {
        $model = new DeliveryModel($this->pdo);
        $result = $model->getDeliveries($user);
        JsonView::render($result);
    }

    public function createDelivery($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['job_ID']) || !isset($data['delivery_type']) || !isset($data['pickup_address']) || !isset($data['delivery_address'])) {
            JsonView::render(["error" => "Missing required fields!"]);
        }
        $model = new DeliveryModel($this->pdo);
        $result = $model->createDelivery($data, $user);
        JsonView::render($result);
    }

    public function completeJob($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        $model = new DeliveryModel($this->pdo);
        $result = $model->completeJob($data, $user);
        JsonView::render($result);
    }

    public function assignStaff($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        $model = new DeliveryModel($this->pdo);
        $result = $model->assignStaff($data, $user);
        JsonView::render($result);
    }

    public function confirmDelivery($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        $model = new DeliveryModel($this->pdo);
        $result = $model->confirmDelivery($data, $user);
        JsonView::render($result);
    }

    public function getPendingAssignments($user) {
        $model = new DeliveryModel($this->pdo);
        $result = $model->getPendingAssignments($user);
        JsonView::render($result);
    }

    public function getMyDeliveries($user) {
        $model = new DeliveryModel($this->pdo);
        $result = $model->getMyDeliveries($user);
        JsonView::render($result);
    }
}
?>
