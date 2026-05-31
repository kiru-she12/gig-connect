<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
require '../../vendor/autoload.php';

use Firebase\JWT\JWT;

$secret_key = "gigconnect_super_secret_key_uwu_2026_cst05";

$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'];
$password = $data['password'];

// find user by email
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);


// check if user exists
if(!$user) {
    echo json_encode(["error" => "User not found!"]);
    exit();
}

// check password
if(!password_verify($password, $user['password'])) {
    echo json_encode(["error" => "Wrong password!"]);
    exit();
}

// check if user is disabled
if($user['status'] === 'disabled') {
    echo json_encode(["error" => "Your account has been disabled!"]);
    exit();
}

// generate JWT token
$payload = [
    "user_ID" => $user['user_ID'],
    "name" => $user['name'],
    "role" => $user['role'],
    "exp" => time() + (60 * 60 * 24)
];

$token = JWT::encode($payload, $secret_key, 'HS256');

echo json_encode([
    "success" => "Login successful!",
    "token" => $token,
    "user_ID" => $user['user_ID'],
    "name" => $user['name'],
    "role" => $user['role']
]);
?>