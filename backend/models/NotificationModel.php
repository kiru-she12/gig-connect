<?php
// backend/models/NotificationModel.php
require_once __DIR__ . '/BaseModel.php';

class NotificationModel extends BaseModel {

    public function sendNotification($data, $user) {
        if($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized!"];
        }

        $user_ID = $data['user_ID'];
        $message = $data['message'];
        $type = $data['type'] ?? 'general';

        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE user_ID = ?");
        $stmt->execute([$user_ID]);
        $target_user = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$target_user) {
            return ["error" => "User not found!"];
        }

        $notification_ID = $this->generateNextID('notification', 'notification_ID', 'NOT');

        $stmt = $this->pdo->prepare("INSERT INTO notification (notification_ID, user_ID, message, type) VALUES (?, ?, ?, ?)");
        $stmt->execute([$notification_ID, $user_ID, $message, $type]);

        return [
            "success" => "Notification sent successfully!",
            "notification_ID" => $notification_ID
        ];
    }

    public function getNotifications($user) {
        $stmt = $this->pdo->prepare("
            SELECT notification_ID, message, type, status, created_at
            FROM notification
            WHERE user_ID = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user->user_ID]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if(!$notifications) {
            return ["message" => "No notifications found!"];
        }

        $stmt = $this->pdo->prepare("UPDATE notification SET status = 'read' WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);

        return [
            "success" => true,
            "notifications" => $notifications
        ];
    }
}
?>
