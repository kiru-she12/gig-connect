<?php
// backend/models/NotificationModel.php
require_once __DIR__ . '/BaseModel.php';

class NotificationModel extends BaseModel {

    public static function create($pdo, $user_ID, $title, $message, $type = 'general', $target_url = null) {
        try {
            $prefix = 'NOT';
            $stmt = $pdo->query("SELECT notification_ID FROM notification WHERE notification_ID LIKE '$prefix%' ORDER BY CAST(SUBSTRING(notification_ID, 4) AS UNSIGNED) DESC LIMIT 1");
            $lastID = $stmt->fetchColumn();
            if ($lastID) {
                $num = intval(substr($lastID, 3)) + 1;
                $notification_ID = $prefix . str_pad($num, 3, '0', STR_PAD_LEFT);
            } else {
                $notification_ID = $prefix . '001';
            }

            $stmt = $pdo->prepare("INSERT INTO notification (notification_ID, user_ID, title, message, status, type, target_url, created_at) VALUES (?, ?, ?, ?, 'unread', ?, ?, NOW())");
            $stmt->execute([$notification_ID, $user_ID, $title, $message, $type, $target_url]);
            return $notification_ID;
        } catch (Exception $e) {
            error_log("Failed to create notification: " . $e->getMessage());
            return false;
        }
    }

    public function sendNotification($data, $user) {
        if ($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized!"];
        }

        $user_ID = $data['user_ID'];
        $title = $data['title'] ?? 'Notification';
        $message = $data['message'];
        $type = $data['type'] ?? 'general';

        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE user_ID = ?");
        $stmt->execute([$user_ID]);
        $target_user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$target_user) {
            return ["error" => "User not found!"];
        }

        $notification_ID = self::create($this->pdo, $user_ID, $title, $message, $type);

        return [
            "success" => "Notification sent successfully!",
            "notification_ID" => $notification_ID
        ];
    }

    public function getNotifications($user) {
        require_once __DIR__ . '/../utils/DeadlineChecker.php';
        DeadlineChecker::check($this->pdo);

        $stmt = $this->pdo->prepare("
            SELECT notification_ID, title, message, type, status, target_url, created_at
            FROM notification
            WHERE user_ID = ?
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$user->user_ID]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            "success" => true,
            "notifications" => $notifications ? $notifications : []
        ];
    }

    public function markAllAsRead($user) {
        $stmt = $this->pdo->prepare("UPDATE notification SET status = 'read' WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        return ["success" => true, "message" => "All notifications marked as read."];
    }

    public function markAsRead($notification_ID, $user) {
        $stmt = $this->pdo->prepare("UPDATE notification SET status = 'read' WHERE notification_ID = ? AND user_ID = ?");
        $stmt->execute([$notification_ID, $user->user_ID]);
        return ["success" => true, "message" => "Notification marked as read."];
    }
}
?>
