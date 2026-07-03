<?php
// backend/controllers/ProfileController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ProfileModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class ProfileController extends BaseController {

    public function updateProfile($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            JsonView::render(["error" => "Invalid payload!"]);
        }
        $model = new ProfileModel($this->pdo);
        $result = $model->updateProfile($data, $user);
        JsonView::render($result);
    }

    public function getProfile($user) {
        $model = new ProfileModel($this->pdo);
        $result = $model->getProfile($user);
        JsonView::render($result);
    }

    public function changePassword($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            JsonView::render(["error" => "Invalid payload!"]);
        }
        $model = new ProfileModel($this->pdo);
        $result = $model->changePassword($data, $user);
        JsonView::render($result);
    }
}
?>
