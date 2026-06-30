<?php
// backend/controllers/JobController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/JobModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class JobController extends BaseController {
    public function postJob($data, $user) {
        $jobModel = new JobModel($this->pdo);
        $result = $jobModel->postJob($data, $user);
        JsonView::render($result);
    }
}
?>
