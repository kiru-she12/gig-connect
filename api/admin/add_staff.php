<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';
include '../../config/mail.php';
include '../../config/email_templates.php';

$user = authenticate();

// only admin and manager can add staff
if($user->role !== 'admin' && $user->role !== 'manager') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'];
$email = $data['email'];
$password = $data['password'];
$role = $data['role'];

// manager can only add delivery staff
if($user->role === 'manager' && $role !== 'delivery_staff') {
    echo json_encode(["error" => "Managers can only add delivery staff!"]);
    exit();
}

// admin can add manager and delivery staff only
if($user->role === 'admin' && $role !== 'manager' && $role !== 'delivery_staff') {
    echo json_encode(["error" => "Invalid role!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'];
$email = $data['email'];
$password = $data['password'];
$role = $data['role']; // 'manager' or 'delivery_staff'

// validate role
if($role !== 'manager' && $role !== 'delivery_staff') {
    echo json_encode(["error" => "Invalid role!"]);
    exit();
}

// check if email already exists
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if($existing) {
    echo json_encode(["error" => "Email already exists!"]);
    exit();
}

// generate user ID
$prefix = [
    'manager' => 'MNG',
    'delivery_staff' => 'DEL'
];

$pre = $prefix[$role];
$stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = '$role'");
$count = $stmt->fetchColumn();
$user_ID = $pre . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

// hash password
$hashed = password_hash($password, PASSWORD_BCRYPT);

// insert into users table
$stmt = $pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'active')");
$stmt->execute([$user_ID, $name, $email, $hashed, $role]);

// insert into specific table
if($role === 'manager') {
    $manager_ID = 'MNG' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare("INSERT INTO manager (manager_ID, user_ID) VALUES (?, ?)");
    $stmt->execute([$manager_ID, $user_ID]);

} else if($role === 'delivery_staff') {
    $phone = $data['phone'] ?? null;
    $vehicle_type = $data['vehicle_type'] ?? null;
    $location = $data['location'] ?? null;

    $delivery_staff_ID = 'DEL' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare("INSERT INTO delivery_staff (delivery_staff_ID, user_ID, name, phone, vehicle_type, location) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$delivery_staff_ID, $user_ID, $name, $phone, $vehicle_type, $location]);
}

// send welcome email
$email_body = welcomeEmail($name);
sendEmail($email, "Welcome to GigConnect!", $email_body);

echo json_encode([
    "success" => "Staff added successfully!",
    "user_ID" => $user_ID
]);
?>