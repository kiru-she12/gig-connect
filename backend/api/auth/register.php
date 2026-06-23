<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../config/mail.php';
include '../../config/email_templates.php';
include '../../config/sms.php';

class User {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
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

// run
$data = json_decode(file_get_contents("php://input"), true);
$user = new User($pdo);
$result = $user->register($data);
echo json_encode($result);
?>