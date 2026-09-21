<?php
// backend/models/UserModel.php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/email_templates.php';
require_once __DIR__ . '/../config/sms.php';

use Firebase\JWT\JWT;

class UserModel extends BaseModel {
    public function __construct($pdo) {
        parent::__construct($pdo);
        if (!isset($_ENV['JWT_SECRET']) || empty($_ENV['JWT_SECRET']) || trim($_ENV['JWT_SECRET']) === '') {
            header("Content-Type: application/json");
            echo json_encode(["error" => "Server configuration error: JWT Secret missing."]);
            exit();
        }
    }

    public function authenticate($email, $password) {
        // find user by email or username (name)
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ? OR name = ?");
        $stmt->execute([$email, $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // check if user exists and password is correct
        if (!$user || !password_verify($password, $user['password'])) {
            return ["error" => "Invalid username or password!"];
        }

        // check if pending
        if($user['status'] === 'pending') {
            return ["error" => "Your account is pending approval!"];
        }

        // check if banned
        if($user['status'] === 'banned') {
            return ["error" => "Your account has been banned!"];
        }

        // generate JWT token
        $payload = [
            "user_ID" => $user['user_ID'],
            "name" => $user['name'],
            "role" => $user['role'],
            "profile_pic" => $user['profile_pic'] ?? null,
            "exp" => time() + (60 * 60 * 24)
        ];

        try {
            $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
        } catch (Exception $e) {
            return ["error" => "Authentication failed"];
        }

        return [
            "success" => true,
            "token" => $token,
            "user_ID" => $user['user_ID'],
            "name" => $user['name'],
            "role" => $user['role'],
            "profile_pic" => $user['profile_pic'] ?? null
        ];
    }

    public function register($data) {
        $name = $data['name'];
        $email = $data['email'];
        $password = $data['password'];
        $role = $data['role'];

        // prevent admin, manager and delivery staff registration
        if($role === 'admin' || $role === 'manager' || $role === 'delivery_staff') {
            return ["error" => "Unauthorized registration!"];
        }

        // validate name (cannot contain numbers)
        $trimmed_name = trim($name);
        if (empty($trimmed_name) || preg_match('/[0-9]/', $trimmed_name) || !preg_match("/^[a-zA-Z\s\.\'-]{2,100}$/", $trimmed_name)) {
            return ["error" => "Name must only contain letters, spaces, dots, or hyphens and cannot contain numbers!"];
        }

        // validate phone number (must be exactly 10 digits)
        $phone = trim($data['phone'] ?? '');
        if (!preg_match('/^0\d{9}$/', $phone)) {
            return ["error" => "Phone number must be exactly 10 digits (e.g., 0712345678)!"];
        }

        // validate email format
        if ($role === 'student') {
            if (!preg_match('/^[a-z0-9]+@std\.uwu\.ac\.lk$/', $email)) {
                return ["error" => "Invalid UWU student email!"];
            }
        } else {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return ["error" => "Invalid email address format!"];
            }
        }

        // validate NIC for job provider
        if ($role === 'job_provider') {
            $nic = trim($data['nic'] ?? '');
            if (!preg_match('/^(?:[0-9]{9}[vVxX]|[0-9]{12})$/', $nic)) {
                return ["error" => "Invalid NIC format! Must be 9 digits followed by V/X or 12 digits."];
            }
        }

        // check if email already exists
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if($existing) {
            return ["error" => "Email already exists!"];
        }

        // generate user ID
        $prefix = [
            'student' => 'STU',
            'job_provider' => 'CLI'
        ];

        $pre = $prefix[$role];
        $user_ID = $this->generateNextID('users', 'user_ID', $pre);

        // hash password
        $hashed = password_hash($password, PASSWORD_BCRYPT);

        // insert into users table
        $stmt = $this->pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$user_ID, $name, $email, $hashed, $role]);

        // if student insert into student table
        if($role === 'student') {
            $student_ID = $this->generateNextID('student', 'student_ID', 'STU');
            $skills = isset($data['skills']) ? (is_array($data['skills']) ? implode(',', $data['skills']) : $data['skills']) : '';
            $year = $data['year'] ?? '';
            $degree = $data['degree'] ?? '';
            $bio = $data['bio'] ?? '';
            $languages = $data['languages'] ?? '';
            $stmt = $this->pdo->prepare("INSERT INTO student (student_ID, user_ID, skills, year, degree, bio, languages) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$student_ID, $user_ID, $skills, $year, $degree, $bio, $languages]);
        }

        // if job provider insert into job_provider table
        if($role === 'job_provider') {
            $provider_ID = $this->generateNextID('job_provider', 'provider_ID', 'CLI');
            $nic = $data['nic'];
            $business_reg_no = $data['business_reg_no'] ?? null;
            $stmt = $this->pdo->prepare("INSERT INTO job_provider (provider_ID, user_ID, nic, business_reg_no) VALUES (?, ?, ?, ?)");
            $stmt->execute([$provider_ID, $user_ID, $nic, $business_reg_no]);
        }

        // generate OTP
        $otp = random_int(100000, 999999);
        $otp_expiry = date('Y-m-d H:i:s', strtotime('+5 minutes'));

        // save OTP to users table
        $stmt = $this->pdo->prepare("UPDATE users SET otp = ?, otp_expiry = ?, phone = ? WHERE user_ID = ?");
        $stmt->execute([$otp, $otp_expiry, $data['phone'], $user_ID]);

        // send OTP via email
        $email_body = otpEmail($name, $otp);
        sendEmail($email, "GigConnect - OTP Verification", $email_body);

        // send OTP via SMS
        sendSMS($data['phone'], "Your GigConnect OTP is: " . $otp . ". Valid for 5 minutes.");

        return [
            "success" => "Registration successful! Please verify your OTP.",
            "user_ID" => $user_ID,
            "otp" => $otp
        ];
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
        $otp = random_int(100000, 999999);
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
            "email" => $email,
            "otp" => $otp
        ];
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
?>
