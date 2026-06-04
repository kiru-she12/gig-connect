<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only job provider can view applicants
if($user->role !== 'job_provider') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$job_ID = $_GET['job_ID'] ?? null;

if(!$job_ID) {
    echo json_encode(["error" => "Job ID is required!"]);
    exit();
}

// check if job belongs to this provider
$stmt = $pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = (SELECT provider_ID FROM job_provider WHERE user_ID = ?)");
$stmt->execute([$job_ID, $user->user_ID]);
$job = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$job) {
    echo json_encode(["error" => "Job not found!"]);
    exit();
}

// get applicants with student details
$stmt = $pdo->prepare("
    SELECT a.application_ID, a.status, a.applied_date,
           s.student_ID, s.skills, s.rating,
           u.name, u.email
    FROM application a
    JOIN student s ON a.student_ID = s.student_ID
    JOIN users u ON s.user_ID = u.user_ID
    WHERE a.job_ID = ?
    ORDER BY s.rating DESC
");
$stmt->execute([$job_ID]);
$applicants = $stmt->fetchAll(PDO::FETCH_ASSOC);

if(!$applicants) {
    echo json_encode(["message" => "No applicants found!"]);
    exit();
}

echo json_encode([
    "success" => true,
    "applicants" => $applicants
]);
?>