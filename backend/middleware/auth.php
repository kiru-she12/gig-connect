<?php
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    private static $secret_key = null;

    private static function getSecretKey() {
        if (self::$secret_key === null) {
            self::$secret_key = $_ENV['JWT_SECRET'] ?? null;
            if (!self::$secret_key || trim(self::$secret_key) === '') {
                header("Content-Type: application/json");
                echo json_encode(["error" => "Server configuration error: JWT Secret missing."]);
                exit();
            }
        }
        return self::$secret_key;
    }

    public static function authenticate() {
        $headers = getallheaders();
        $token = null;

        $authHeader = null;
        if (is_array($headers)) {
            foreach ($headers as $k => $v) {
                if (strtolower($k) === 'authorization') {
                    $authHeader = $v;
                    break;
                }
            }
        }
        if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (isset($_COOKIE['token']) && $_COOKIE['token'] !== '') {
            $token = $_COOKIE['token'];
        } elseif ($authHeader && stripos($authHeader, 'Bearer ') === 0) {
            $extracted = trim(substr($authHeader, 7));
            if ($extracted !== '' && $extracted !== 'null' && $extracted !== 'undefined') {
                $token = $extracted;
            }
        }

        if (!$token) {
            echo json_encode(["error" => "Token not provided!"]);
            exit();
        }

        $key = self::getSecretKey();

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            return $decoded;
        } catch (Exception $e) {
            header("Content-Type: application/json");
            echo json_encode(["error" => "Invalid token!"]);
            exit();
        }
    }
}
function authenticate() {
    return AuthMiddleware::authenticate();
}
?>