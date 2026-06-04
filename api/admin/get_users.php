<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only admin and manager can view users
if($user->role !== 'admin' && $user->role !== 'manager') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$role = $_GET['role'] ?? null;
$status = $_GET['status'] ?? null;

$query = "SELECT user_ID, name, email, role, status, created_at FROM users WHERE 1";

if($role) {
    $query .= " AND role = '$role'";
}

if($status) {
    $query .= " AND status = '$status'";
}

$query .= " ORDER BY created_at DESC";

$stmt = $pdo->query($query);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if(!$users) {
    echo json_encode(["message" => "No users found!"]);
    exit();
}

echo json_encode([
    "success" => true,
    "users" => $users
]);
?>