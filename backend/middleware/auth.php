<?php
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    private static $secret_key = null;

    private static function getSecretKey() {
        if (self::$secret_key === null) {
            self::$secret_key = $_ENV['JWT_SECRET'] ?? '';
        }
        return self::$secret_key;
    }

    public static function authenticate() {
        $headers = getallheaders();

        if (!isset($headers['Authorization'])) {
            echo json_encode(["error" => "Token not provided!"]);
            exit();
        }

        $token = str_replace("Bearer ", "", $headers['Authorization']);
        $key = self::getSecretKey();

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            return $decoded;
        } catch (Exception $e) {
            echo json_encode(["error" => "Invalid token!"]);
            exit();
        }
    }
}

// Wrapper for backward compatibility
function authenticate() {
    return AuthMiddleware::authenticate();
}
?>