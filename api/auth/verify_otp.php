<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

class OTPVerification {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function verifyOTP($data) {
        $email = $data['email'];
        $otp = $data['otp'];

        // find user by email
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$user) {
            return ["error" => "User not found!"];
        }

        // check if already verified
        if($user['is_verified'] == 1) {
            return ["error" => "Account already verified!"];
        }

        // check OTP
        if($user['otp'] != $otp) {
            return ["error" => "Invalid OTP!"];
        }

        // check OTP expiry
        if(strtotime($user['otp_expiry']) < time()) {
            return ["error" => "OTP expired! Please register again."];
        }

        // mark as verified
        $stmt = $this->pdo->prepare("UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL WHERE email = ?");
        $stmt->execute([$email]);

        return [
            "success" => "Account verified successfully! Please wait for admin approval.",
            "user_ID" => $user['user_ID']
        ];
    }
}

// run
$data = json_decode(file_get_contents("php://input"), true);
$otpVerification = new OTPVerification($pdo);
$result = $otpVerification->verifyOTP($data);
echo json_encode($result);
?>