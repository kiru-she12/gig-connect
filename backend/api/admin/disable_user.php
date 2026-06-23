<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';
include '../../config/mail.php';
include '../../config/email_templates.php';

class UserManager {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function manageUser($data, $user) {
        // only admin and manager can access user manager, but disable/enable is restricted to admin
        if($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized!"];
        }

        $user_ID = $data['user_ID'];
        $action = $data['action'];

        if (($action === 'disable' || $action === 'enable') && $user->role !== 'admin') {
            return ["error" => "Unauthorized! Only system administrators can disable or enable users."];
        }

        // check if user exists
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE user_ID = ?");
        $stmt->execute([$user_ID]);
        $target_user = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$target_user) {
            return ["error" => "User not found!"];
        }

        // cannot disable another admin
        if($target_user['role'] === 'admin') {
            return ["error" => "Cannot manage an admin account!"];
        }

        if($action === 'disable') {
            $stmt = $this->pdo->prepare("UPDATE users SET status = 'banned' WHERE user_ID = ?");
            $stmt->execute([$user_ID]);
            return ["success" => "User disabled successfully!"];

        } else if($action === 'enable') {
            $stmt = $this->pdo->prepare("UPDATE users SET status = 'active' WHERE user_ID = ?");
            $stmt->execute([$user_ID]);
            return ["success" => "User enabled successfully!"];

        } else if($action === 'approve') {
            $stmt = $this->pdo->prepare("UPDATE users SET status = 'active' WHERE user_ID = ?");
            $stmt->execute([$user_ID]);

            // send approval email
            $email_body = approvalEmail($target_user['name'], $target_user['role']);
            $mailSent = sendEmail($target_user['email'], "GigConnect - Account Approved!", $email_body);

            if (!$mailSent) {
                return ["success" => "User approved successfully, but the notification email could not be sent. Please verify your SMTP settings and check if outbound ports 587/465 are blocked by your network/firewall."];
            }

            return ["success" => "User approved successfully!"];

        } else {
            return ["error" => "Invalid action!"];
        }
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$userManager = new UserManager($pdo);
$result = $userManager->manageUser($data, $user);
echo json_encode($result);
?>