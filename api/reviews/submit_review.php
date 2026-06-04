<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

$data = json_decode(file_get_contents("php://input"), true);

$job_ID = $data['job_ID'];
$given_to = $data['given_to'];
$score = $data['score'];
$review = $data['review'] ?? null;

// check if job exists and is completed
$stmt = $pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'completed'");
$stmt->execute([$job_ID]);
$job = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$job) {
    echo json_encode(["error" => "Job not found or not completed!"]);
    exit();
}

// check if already reviewed
$stmt = $pdo->prepare("SELECT * FROM rate_review WHERE job_ID = ? AND given_by = ?");
$stmt->execute([$job_ID, $user->user_ID]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if($existing) {
    echo json_encode(["error" => "You already reviewed this job!"]);
    exit();
}

// validate score
if($score < 1 || $score > 5) {
    echo json_encode(["error" => "Score must be between 1 and 5!"]);
    exit();
}

// generate rating ID
$stmt = $pdo->query("SELECT COUNT(*) FROM rate_review");
$count = $stmt->fetchColumn();
$rating_ID = 'RAT' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

// insert review
$stmt = $pdo->prepare("INSERT INTO rate_review (rating_ID, job_ID, given_by, given_to, score, review) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([$rating_ID, $job_ID, $user->user_ID, $given_to, $score, $review]);

// update student rating if reviewed student
$stmt = $pdo->prepare("SELECT * FROM student WHERE user_ID = ?");
$stmt->execute([$given_to]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);

if($student) {
    $stmt = $pdo->prepare("SELECT AVG(score) FROM rate_review WHERE given_to = ?");
    $stmt->execute([$given_to]);
    $avg_rating = $stmt->fetchColumn();

    $stmt = $pdo->prepare("UPDATE student SET rating = ? WHERE user_ID = ?");
    $stmt->execute([round($avg_rating, 2), $given_to]);
}

echo json_encode([
    "success" => "Review submitted successfully!",
    "rating_ID" => $rating_ID
]);
?>