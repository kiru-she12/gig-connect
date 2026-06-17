<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

class ResetPassword {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function resetPassword($data) {
        $email = $data['email'];
        $otp = $data['otp'];
        $new_password = $data['new_password'];
        $confirm_password = $data['confirm_password'];

        // check passwords match
        if($new_password !== $confirm_password) {
            return ["error" => "Passwords do not match!"];
        }

        // find user
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$user) {
            return ["error" => "User not found!"];
        }

        // check OTP
        if($user['otp'] != $otp) {
            return ["error" => "Invalid OTP!"];
        }

        // check OTP expiry
        if(strtotime($user['otp_expiry']) < time()) {
            return ["error" => "OTP expired! Please request again."];
        }

        // hash new password
        $hashed = password_hash($new_password, PASSWORD_BCRYPT);

        // update password
        $stmt = $this->pdo->prepare("UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?");
        $stmt->execute([$hashed, $email]);

        return ["success" => "Password reset successfully!"];
    }
}

// run
$data = json_decode(file_get_contents("php://input"), true);
$resetPassword = new ResetPassword($pdo);
$result = $resetPassword->resetPassword($data);
echo json_encode($result);
?>