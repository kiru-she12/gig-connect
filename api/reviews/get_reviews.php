<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

$user_ID = $_GET['user_ID'] ?? null;

if(!$user_ID) {
    echo json_encode(["error" => "User ID is required!"]);
    exit();
}

$stmt = $pdo->prepare("
    SELECT r.rating_ID, r.score, r.review,
           u.name as given_by_name,
           j.title as job_title
    FROM rate_review r
    JOIN users u ON r.given_by = u.user_ID
    JOIN job j ON r.job_ID = j.job_ID
    WHERE r.given_to = ?
    ORDER BY r.rating_ID DESC
");
$stmt->execute([$user_ID]);
$reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

if(!$reviews) {
    echo json_encode(["message" => "No reviews found!"]);
    exit();
}

echo json_encode([
    "success" => true,
    "reviews" => $reviews
]);
?>