<?php
// backend/controllers/JobController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/JobModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class JobController extends BaseController {

    private function getOptionalUser() {
        $headers = getallheaders();
        $token = null;

        if (isset($_COOKIE['token']) && $_COOKIE['token'] !== '') {
            $token = $_COOKIE['token'];
        } elseif (isset($headers['Authorization']) && stripos($headers['Authorization'], 'Bearer ') === 0) {
            $extracted = trim(substr($headers['Authorization'], 7));
            if ($extracted !== '' && $extracted !== 'null' && $extracted !== 'undefined') {
                $token = $extracted;
            }
        }

        if (!$token) {
            return null;
        }

        $key = $_ENV['JWT_SECRET'] ?? '';
        try {
            return \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
        } catch (Exception $e) {
            return null;
        }
    }

    public function postJob($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['title']) || !isset($data['description']) || !isset($data['skills']) || !isset($data['payment']) || !isset($data['job_type']) || !isset($data['deadline'])) {
            JsonView::render(["error" => "Missing required fields!"]);
        }

        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->postJob($data, $user);
        JsonView::render($result);
    }

    public function getRecommendations($user) {
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->getRecommendations($data, $user);
        JsonView::render($result);
    }

    public function updateApplicant($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['application_ID']) || !isset($data['action'])) {
            JsonView::render(["error" => "Application ID and action are required!"]);
        }
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->updateApplicant($data, $user);
        JsonView::render($result);
    }

    public function updatePaymentStatus($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            JsonView::render(["error" => "Invalid payload!"]);
        }
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->updatePaymentStatus($data, $user);
        JsonView::render($result);
    }

    public function getMyApplications($user) {
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->getMyApplications($user);
        JsonView::render($result);
    }

    public function getJobs() {
        $filters = [
            'category' => $_GET['category'] ?? null,
            'job_type' => $_GET['job_type'] ?? null,
            'min_payment' => $_GET['min_payment'] ?? null,
            'max_payment' => $_GET['max_payment'] ?? null,
            'skills' => $_GET['skills'] ?? null,
            'all' => $_GET['all'] ?? null,
            'status' => $_GET['status'] ?? null
        ];

        $currentUser = $this->getOptionalUser();
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->getJobs($filters, $currentUser);
        JsonView::render($result);
    }

    public function getApplicants($user) {
        $job_ID = $_GET['job_ID'] ?? null;
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->getApplicants($job_ID, $user);
        JsonView::render($result);
    }

    public function applyJob($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            JsonView::render(["error" => "Invalid payload!"]);
        }
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->applyJob($data, $user);
        JsonView::render($result);
    }
}
?>
