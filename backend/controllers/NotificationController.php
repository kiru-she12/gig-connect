<?php
// backend/controllers/NotificationController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/NotificationModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class NotificationController extends BaseController {

    public function sendNotification($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['user_ID']) || !isset($data['message'])) {
            JsonView::render(["error" => "User ID and Message are required!"]);
        }
        $model = new NotificationModel($this->pdo);
        $result = $model->sendNotification($data, $user);
        JsonView::render($result);
    }

    public function getNotifications($user) {
        $model = new NotificationModel($this->pdo);
        $result = $model->getNotifications($user);
        JsonView::render($result);
    }

    public function markAllRead($user) {
        $model = new NotificationModel($this->pdo);
        $result = $model->markAllAsRead($user);
        JsonView::render($result);
    }

    public function markRead($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        $notification_ID = $data['notification_ID'] ?? $data['id'] ?? null;
        $model = new NotificationModel($this->pdo);
        if ($notification_ID) {
            $result = $model->markAsRead($notification_ID, $user);
        } else {
            $result = $model->markAllAsRead($user);
        }
        JsonView::render($result);
    }
}
?>
