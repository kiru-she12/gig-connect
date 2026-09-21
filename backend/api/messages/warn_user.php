<?php
// backend/api/messages/warn_user.php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

try {
    $user = authenticate();
    if ($user->role !== 'admin' && $user->role !== 'manager') {
        echo json_encode(["error" => "Unauthorized. Admin or Manager access required."]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $target_user_id = $data['user_id'] ?? null;
    $warning_text = $data['warning'] ?? $data['message'] ?? 'Admin Warning: Please adhere to platform messaging guidelines.';

    if (!$target_user_id) {
        echo json_encode(["error" => "Missing target user_id"]);
        exit;
    }

    require_once __DIR__ . '/../../models/NotificationModel.php';

    // Insert warning notification
    NotificationModel::create(
        $pdo,
        $target_user_id,
        'System Warning from Admin ⚠️',
        $warning_text,
        'warning',
        '/dashboard'
    );

    echo json_encode(["success" => true, "message" => "Warning issued to user successfully."]);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
