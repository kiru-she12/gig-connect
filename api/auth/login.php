<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
require '../../vendor/autoload.php';

use Firebase\JWT\JWT;

class Auth {
    private $pdo;
    private $secret_key = "gigconnect_super_secret_key_uwu_2026_cst05";

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function login($data) {
        $email = $data['email'];
        $password = $data['password'];

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

        $token = JWT::encode($payload, $this->secret_key, 'HS256');

        return [
            "success" => "Login successful!",
            "token" => $token,
            "user_ID" => $user['user_ID'],
            "name" => $user['name'],
            "role" => $user['role']
        ];
    }
}

// run
$data = json_decode(file_get_contents("php://input"), true);
$auth = new Auth($pdo);
$result = $auth->login($data);
echo json_encode($result);
?>