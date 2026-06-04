<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only admin and manager can approve jobs
if($user->role !== 'admin' && $user->role !== 'manager') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$job_ID = $data['job_ID'];
$action = $data['action']; // 'approve' or 'reject'

// check if job exists
$stmt = $pdo->prepare("SELECT * FROM job WHERE job_ID = ?");
$stmt->execute([$job_ID]);
$job = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$job) {
    echo json_encode(["error" => "Job not found!"]);
    exit();
}

if($action === 'approve') {
    $stmt = $pdo->prepare("UPDATE job SET status = 'active' WHERE job_ID = ?");
    $stmt->execute([$job_ID]);
    echo json_encode(["success" => "Job approved successfully!"]);
} else if($action === 'reject') {
    $stmt = $pdo->prepare("UPDATE job SET status = 'closed' WHERE job_ID = ?");
    $stmt->execute([$job_ID]);
    echo json_encode(["success" => "Job rejected successfully!"]);
} else {
    echo json_encode(["error" => "Invalid action!"]);
}
?>