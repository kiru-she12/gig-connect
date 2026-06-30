<?php
// backend/controllers/AuthController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class AuthController extends BaseController {
    public function login($data) {
        $userModel = new UserModel($this->pdo);
        $result = $userModel->authenticate($data['email'], $data['password']);

        if (isset($result['error'])) {
            JsonView::render($result);
        }

        // Set HttpOnly, SameSite=Lax cookie for token expiration in 24 hours
        setcookie('token', $result['token'], [
            'expires' => time() + (60 * 60 * 24),
            'path' => '/',
            'domain' => '',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        JsonView::render([
            "success" => true,
            "user_ID" => $result['user_ID'],
            "name" => $result['name'],
            "role" => $result['role']
        ]);
    }

    public function register($data) {
        $userModel = new UserModel($this->pdo);
        $result = $userModel->register($data);
        JsonView::render($result);
    }

    public function logout() {
        // Clear the cookie by setting it in the past
        setcookie('token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        JsonView::render(["success" => "Logged out successfully!"]);
    }
}
?>
