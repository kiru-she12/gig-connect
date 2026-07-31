<?php
// backend/controllers/MapController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/MapModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class MapController extends BaseController {
    public function process($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        $mapModel = new MapModel($this->pdo);
        $result = $mapModel->process($data, $user);
        JsonView::render($result);
    }
}
?>
