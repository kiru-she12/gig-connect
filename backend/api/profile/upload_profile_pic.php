<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../views/JsonView.php';

$user = authenticate();
if (!$user) {
    JsonView::render(["error" => "Unauthorized access!"]);
    exit;
}

$uploadDir = __DIR__ . '/../../uploads/profile_pics/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Fetch current user details
$stmt = $pdo->prepare("SELECT profile_pic FROM users WHERE user_ID = ?");
$stmt->execute([$user->user_ID]);
$currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
$oldPic = $currentUser['profile_pic'] ?? null;

// Handle JSON payload for remove action
$jsonInput = json_decode(file_get_contents("php://input"), true);
$action = $_POST['action'] ?? $jsonInput['action'] ?? null;

if ($action === 'remove') {
    if ($oldPic && file_exists($uploadDir . $oldPic)) {
        @unlink($uploadDir . $oldPic);
    }
    $updateStmt = $pdo->prepare("UPDATE users SET profile_pic = NULL WHERE user_ID = ?");
    $updateStmt->execute([$user->user_ID]);

    JsonView::render([
        "success" => true,
        "message" => "Profile picture removed successfully!",
        "profile_pic" => null
    ]);
    exit;
}

// Handle file upload
if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['profile_pic']['tmp_name'];
    $fileName = $_FILES['profile_pic']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($fileExtension, $allowedExtensions)) {
        JsonView::render(["error" => "Invalid file format! Allowed: JPG, PNG, WEBP, GIF."]);
        exit;
    }

    if ($_FILES['profile_pic']['size'] > 5 * 1024 * 1024) {
        JsonView::render(["error" => "File size exceeds 5MB limit!"]);
        exit;
    }

    $newFileName = 'user_' . $user->user_ID . '_' . time() . '.' . $fileExtension;
    $destPath = $uploadDir . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        if ($oldPic && file_exists($uploadDir . $oldPic)) {
            @unlink($uploadDir . $oldPic);
        }

        $updateStmt = $pdo->prepare("UPDATE users SET profile_pic = ? WHERE user_ID = ?");
        $updateStmt->execute([$newFileName, $user->user_ID]);

        JsonView::render([
            "success" => true,
            "message" => "Profile picture updated successfully!",
            "profile_pic" => $newFileName
        ]);
        exit;
    } else {
        JsonView::render(["error" => "Failed to save uploaded file."]);
        exit;
    }
}

JsonView::render(["error" => "No file or valid action provided."]);
?>
