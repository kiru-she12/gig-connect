<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Notification {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
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

// run
$user = authenticate();
$notification = new Notification($pdo);
$result = $notification->getNotifications($user);
echo json_encode($result);
?>