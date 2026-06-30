<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
include '../../config/db.php';
include '../../middleware/auth.php';

try {
    $user = authenticate();
    $data = json_decode(file_get_contents("php://input"), true);

    $current_password = $data['current_password'] ?? null;
    $new_password = $data['new_password'] ?? null;
    $confirm_password = $data['confirm_password'] ?? null;

    if (!$current_password || !$new_password || !$confirm_password) {
        echo json_encode(["error" => "All fields are required!"]);
        exit;
    }

    if ($new_password !== $confirm_password) {
        echo json_encode(["error" => "New passwords do not match!"]);
        exit;
    }

    // Fetch user password hash
    $stmt = $pdo->prepare("SELECT password FROM users WHERE user_ID = ?");
    $stmt->execute([$user->user_ID]);
    $db_user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$db_user || !password_verify($current_password, $db_user['password'])) {
        echo json_encode(["error" => "Incorrect current password!"]);
        exit;
    }

    // Hash new password
    $new_hash = password_hash($new_password, PASSWORD_BCRYPT);

    // Update password
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE user_ID = ?");
    $stmt->execute([$new_hash, $user->user_ID]);

    echo json_encode([
        "success" => true,
        "message" => "Password updated successfully!"
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
