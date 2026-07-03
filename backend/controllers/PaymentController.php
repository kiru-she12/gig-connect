<?php
// backend/controllers/PaymentController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/PaymentModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class PaymentController extends BaseController {

    public function confirm($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['payment_ID'])) {
            JsonView::render(["error" => "Payment ID is required."]);
        }
        $model = new PaymentModel($this->pdo);
        $result = $model->confirm($data, $user);
        JsonView::render($result);
    }

    public function createCommission($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['job_ID'])) {
            JsonView::render(["error" => "Job ID is required."]);
        }
        $model = new PaymentModel($this->pdo);
        $result = $model->createCommission($data, $user);
        JsonView::render($result);
    }

    public function createBoost($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['job_ID'])) {
            JsonView::render(["error" => "Job ID is required."]);
        }
        $model = new PaymentModel($this->pdo);
        $result = $model->createBoost($data, $user);
        JsonView::render($result);
    }

    public function getPayments($user) {
        $filters = [
            'payment_type' => $_GET['payment_type'] ?? null,
            'status' => $_GET['status'] ?? null
        ];
        $model = new PaymentModel($this->pdo);
        $result = $model->getPayments($filters, $user);
        JsonView::render($result);
    }
}
?>
