<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Notification {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

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

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM notification");
        $count = $stmt->fetchColumn();
        $notification_ID = 'NOT' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        $stmt = $this->pdo->prepare("INSERT INTO notification (notification_ID, user_ID, message, type) VALUES (?, ?, ?, ?)");
        $stmt->execute([$notification_ID, $user_ID, $message, $type]);

        return [
            "success" => "Notification sent successfully!",
            "notification_ID" => $notification_ID
        ];
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$notification = new Notification($pdo);
$result = $notification->sendNotification($data, $user);
echo json_encode($result);
?>