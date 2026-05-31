<?php
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$secret_key = "gigconnect_super_secret_key_uwu_2026_cst05";

function authenticate() {
    global $secret_key;

    $headers = getallheaders();

    if(!isset($headers['Authorization'])) {
        echo json_encode(["error" => "Token not provided!"]);
        exit();
    }

    $token = str_replace("Bearer ", "", $headers['Authorization']);

    try {
        $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
        return $decoded;
    } catch(Exception $e) {
        echo json_encode(["error" => "Invalid token!"]);
        exit();
    }
}
?>