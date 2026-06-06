<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../config/mail.php';
include '../../config/email_templates.php';
$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'];
$email = $data['email'];
$password = $data['password'];
$role = $data['role'];

// prevent admin, manager and delivery staff registration
if($role === 'admin' || $role === 'manager' || $role === 'delivery_staff') {
    echo json_encode(["error" => "Unauthorized registration!"]);
    exit();
}

// validate student email
if($role === 'student') {
    if(!preg_match('/^[a-z0-9]+@std\.uwu\.ac\.lk$/', $email)) {
        echo json_encode(["error" => "Invalid UWU student email!"]);
        exit();
    }
}

// generate user ID
$prefix = [
    'student' => 'STU',
    'job_provider' => 'CLI'
];

$pre = $prefix[$role];
$stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = '$role'");
$count = $stmt->fetchColumn();
$user_ID = $pre . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

// hash password
$hashed = password_hash($password, PASSWORD_BCRYPT);

// insert into users table
$stmt = $pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'pending')");
$stmt->execute([$user_ID, $name, $email, $hashed, $role]);

// if student insert into student table
if($role === 'student') {
    $student_ID = 'STU' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare("INSERT INTO student (student_ID, user_ID) VALUES (?, ?)");
    $stmt->execute([$student_ID, $user_ID]);
}

// if job_provider insert into job_provider table
if($role === 'job_provider') {
    $provider_ID = 'CLI' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    $nic = $data['nic'];
    $business_reg_no = $data['business_reg_no'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO job_provider (provider_ID, user_ID, nic, business_reg_no) VALUES (?, ?, ?, ?)");
    $stmt->execute([$provider_ID, $user_ID, $nic, $business_reg_no]);
}
// send welcome email
$email_body = welcomeEmail($name);
sendEmail($email, "Welcome to GigConnect!", $email_body);

echo json_encode(["success" => "User registered successfully!", "user_ID" => $user_ID]);
?>