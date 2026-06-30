<?php
// backend/models/UserModel.php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../vendor/autoload.php';
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
        // find user by email
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // check if user exists
        if(!$user) {
            return ["error" => "User not found!"];
        }

        // check password
        if(!password_verify($password, $user['password'])) {
            return ["error" => "Wrong password!"];
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
            "role" => $user['role']
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

        // validate student email
        if($role === 'student') {
            if(!preg_match('/^[a-z0-9]+@std\.uwu\.ac\.lk$/', $email)) {
                return ["error" => "Invalid UWU student email!"];
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
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = '$role'");
        $count = $stmt->fetchColumn();
        $user_ID = $pre . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        // hash password
        $hashed = password_hash($password, PASSWORD_BCRYPT);

        // insert into users table
        $stmt = $this->pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$user_ID, $name, $email, $hashed, $role]);

        // if student insert into student table
        if($role === 'student') {
            $student_ID = 'STU' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
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
            $provider_ID = 'CLI' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
            $nic = $data['nic'];
            $business_reg_no = $data['business_reg_no'] ?? null;
            $stmt = $this->pdo->prepare("INSERT INTO job_provider (provider_ID, user_ID, nic, business_reg_no) VALUES (?, ?, ?, ?)");
            $stmt->execute([$provider_ID, $user_ID, $nic, $business_reg_no]);
        }

        // generate OTP
        $otp = rand(100000, 999999);
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
}
?>
