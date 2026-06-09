<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../config/mail.php';
include '../../config/email_templates.php';
include '../../config/sms.php';

class ForgotPassword {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function sendOTP($data) {
        $email = $data['email'];

        // find user by email
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$user) {
            return ["error" => "User not found!"];
        }

        // generate OTP
        $otp = rand(100000, 999999);
        $otp_expiry = date('Y-m-d H:i:s', strtotime('+5 minutes'));

        // save OTP
        $stmt = $this->pdo->prepare("UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?");
        $stmt->execute([$otp, $otp_expiry, $email]);

        // send OTP via email
        $email_body = otpEmail($user['name'], $otp);
        sendEmail($email, "GigConnect - Password Reset OTP", $email_body);

        // send OTP via SMS if phone exists
        if($user['phone']) {
            sendSMS($user['phone'], "Your GigConnect password reset OTP is: " . $otp . ". Valid for 5 minutes.");
        }

        return [
            "success" => "OTP sent to your email and phone!",
            "email" => $email
        ];
    }
}

// run
$data = json_decode(file_get_contents("php://input"), true);
$forgotPassword = new ForgotPassword($pdo);
$result = $forgotPassword->sendOTP($data);
echo json_encode($result);
?>