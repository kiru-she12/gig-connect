<?php
// backend/controllers/AuthController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class AuthController extends BaseController {
    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['email']) || !isset($data['password'])) {
            JsonView::render(["error" => "Invalid email or password input data!"]);
        }

        $userModel = new UserModel($this->pdo);
        $result = $userModel->authenticate($data['email'], $data['password']);

        if (isset($result['error'])) {
            JsonView::render($result);
            return;
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
            "token" => $result['token'],
            "user_ID" => $result['user_ID'],
            "name" => $result['name'],
            "role" => $result['role']
        ]);
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            JsonView::render(["error" => "Invalid input data!"]);
        }

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

    public function forgetPassword() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['email'])) {
            JsonView::render(["error" => "Email is required!"]);
        }

        $userModel = new UserModel($this->pdo);
        $result = $userModel->sendOTP($data);
        JsonView::render($result);
    }

    public function resetPassword() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            JsonView::render(["error" => "Invalid input data!"]);
        }

        $userModel = new UserModel($this->pdo);
        $result = $userModel->resetPassword($data);
        JsonView::render($result);
    }

    public function verifyOTP() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            JsonView::render(["error" => "Invalid input data!"]);
        }

        $userModel = new UserModel($this->pdo);
        $result = $userModel->verifyOTP($data);
        JsonView::render($result);
    }
}
?>
