<?php
// backend/controllers/ReviewController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ReviewModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class ReviewController extends BaseController {

    public function submitReview($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['job_ID']) || !isset($data['given_to']) || !isset($data['score'])) {
            JsonView::render(["error" => "Job ID, Target User, and Rating Score are required!"]);
        }
        $model = new ReviewModel($this->pdo);
        $result = $model->submitReview($data, $user);
        JsonView::render($result);
    }

    public function getReviews() {
        $user_ID = $_GET['user_ID'] ?? null;
        $type = $_GET['type'] ?? 'received';

        $model = new ReviewModel($this->pdo);
        $result = $model->getReviews($user_ID, $type);
        JsonView::render($result);
    }
}
?>
