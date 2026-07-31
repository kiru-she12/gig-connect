<?php
// backend/controllers/AdminController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/AdminModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class AdminController extends BaseController {

    public function getUsers($user) {
        $adminModel = new AdminModel($this->pdo);
        $result = $adminModel->getUsers($_GET, $user);
        JsonView::render($result);
    }

    public function exportReport($user) {
        $type = $_GET['type'] ?? 'jobs';
        $adminModel = new AdminModel($this->pdo);
        $result = $adminModel->export($user, $type);
        JsonView::render($result);
    }

    public function disableUser($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['user_ID']) || !isset($data['action'])) {
            JsonView::render(["error" => "User ID and Action are required!"]);
        }
        $adminModel = new AdminModel($this->pdo);
        $result = $adminModel->manageUser($data, $user);
        JsonView::render($result);
    }

    public function approveJob($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['job_ID'])) {
            JsonView::render(["error" => "Job ID is required!"]);
        }
        $adminModel = new AdminModel($this->pdo);
        $result = $adminModel->approveJob($data, $user);
        JsonView::render($result);
    }

    public function handleComplaints($user) {
        $method = $_SERVER['REQUEST_METHOD'];
        $adminModel = new AdminModel($this->pdo);

        if ($method === 'GET') {
            if ($user->role !== 'admin' && $user->role !== 'manager') {
                JsonView::render(["error" => "Unauthorized!"]);
                return;
            }
            $result = $adminModel->getComplaints();
            JsonView::render($result);
            return;
        } else if ($method === 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!$data) {
                $data = $_POST;
            }

            $action = $data['action'] ?? 'create';
            if ($action === 'create' || !isset($data['status'])) {
                $result = $adminModel->createComplaint($data);
                JsonView::render($result);
                return;
            }

            $userRole = $user->role ?? $user->data->role ?? null;
            if ($userRole !== 'admin' && $userRole !== 'manager') {
                JsonView::render(["error" => "Unauthorized to update complaint status."]);
                return;
            }
            $result = $adminModel->updateComplaintStatus($data);
            JsonView::render($result);
            return;
        } else {
            JsonView::render(["error" => "Method not allowed"]);
            return;
        }
    }

    public function addStaff($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['role'])) {
            JsonView::render(["error" => "Missing required fields!"]);
        }
        $adminModel = new AdminModel($this->pdo);
        $result = $adminModel->addStaff($data, $user);
        JsonView::render($result);
    }

    public function getAnalytics($user) {
        $adminModel = new AdminModel($this->pdo);
        $result = $adminModel->getAnalytics($user);
        JsonView::render($result);
    }
}
?>
