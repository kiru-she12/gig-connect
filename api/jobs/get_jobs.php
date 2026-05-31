<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

$category = $_GET['category'] ?? null;
$job_type = $_GET['job_type'] ?? null;
$min_payment = $_GET['min_payment'] ?? null;
$max_payment = $_GET['max_payment'] ?? null;
$skills = $_GET['skills'] ?? null;

$query = "SELECT * FROM job WHERE status = 'active'";

if($job_type) {
    $query .= " AND job_type = '$job_type'";
}

if($min_payment) {
    $query .= " AND payment >= '$min_payment'";
}

if($max_payment) {
    $query .= " AND payment <= '$max_payment'";
}

if($skills) {
    $query .= " AND skills LIKE '%$skills%'";
}

$query .= " ORDER BY is_boosted DESC, created_at DESC";

$stmt = $pdo->query($query);
$jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

if(!$jobs) {
    echo json_encode(["message" => "No jobs found!"]);
    exit();
}

echo json_encode([
    "success" => true,
    "jobs" => $jobs
]);
?>