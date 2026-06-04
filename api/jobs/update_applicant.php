<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

// only job provider can update applicants
if($user->role !== 'job_provider') {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$application_ID = $data['application_ID'];
$action = $data['action']; // 'shortlist', 'accept', 'reject'

// check if application exists
$stmt = $pdo->prepare("
    SELECT a.*, j.provider_ID 
    FROM application a
    JOIN job j ON a.job_ID = j.job_ID
    WHERE a.application_ID = ?
");
$stmt->execute([$application_ID]);
$application = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$application) {
    echo json_encode(["error" => "Application not found!"]);
    exit();
}

// check if job belongs to this provider
$stmt = $pdo->prepare("SELECT * FROM job_provider WHERE user_ID = ? AND provider_ID = ?");
$stmt->execute([$user->user_ID, $application['provider_ID']]);
$provider = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$provider) {
    echo json_encode(["error" => "Unauthorized!"]);
    exit();
}

$valid_actions = ['shortlist', 'accept', 'reject'];

if(!in_array($action, $valid_actions)) {
    echo json_encode(["error" => "Invalid action!"]);
    exit();
}

$status_map = [
    'shortlist' => 'shortlisted',
    'accept' => 'accepted',
    'reject' => 'rejected'
];

$new_status = $status_map[$action];

$stmt = $pdo->prepare("UPDATE application SET status = ? WHERE application_ID = ?");
$stmt->execute([$new_status, $application_ID]);

// if accepted update job status to in_progress
if($action === 'accept') {
    $stmt = $pdo->prepare("UPDATE job SET status = 'in_progress', assigned_time = NOW() WHERE job_ID = ?");
    $stmt->execute([$application['job_ID']]);
}

echo json_encode([
    "success" => "Application " . $new_status . " successfully!",
    "application_ID" => $application_ID,
    "status" => $new_status
]);
?>