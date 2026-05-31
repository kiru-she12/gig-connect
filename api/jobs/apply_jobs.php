<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only students can apply
if($user->role !== 'student') {
    echo json_encode(["error" => "Only students can apply for jobs!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$job_ID = $data['job_ID'];

// check if job exists and is active
$stmt = $pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'active'");
$stmt->execute([$job_ID]);
$job = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$job) {
    echo json_encode(["error" => "Job not found or not active!"]);
    exit();
}

// get student_id
$stmt = $pdo->prepare("SELECT student_ID FROM student WHERE user_ID = ?");
$stmt->execute([$user->user_ID]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);

// check if already applied
$stmt = $pdo->prepare("SELECT * FROM application WHERE job_ID = ? AND student_ID = ?");
$stmt->execute([$job_ID, $student['student_ID']]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if($existing) {
    echo json_encode(["error" => "You already applied for this job!"]);
    exit();
}

// generate application ID
$stmt = $pdo->query("SELECT COUNT(*) FROM application");
$count = $stmt->fetchColumn();
$application_ID = 'APP' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

// insert application
$stmt = $pdo->prepare("INSERT INTO application (application_ID, job_ID, student_ID) VALUES (?, ?, ?)");
$stmt->execute([$application_ID, $job_ID, $student['student_ID']]);

echo json_encode([
    "success" => "Applied successfully!",
    "application_ID" => $application_ID
]);
?>