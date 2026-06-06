<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

class Review {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getReviews($user_ID) {
        if(!$user_ID) {
            return ["error" => "User ID is required!"];
        }

        $stmt = $this->pdo->prepare("
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
            return ["message" => "No reviews found!"];
        }

        return [
            "success" => true,
            "reviews" => $reviews
        ];
    }
}

// run
$user_ID = $_GET['user_ID'] ?? null;
$review = new Review($pdo);
$result = $review->getReviews($user_ID);
echo json_encode($result);
?>