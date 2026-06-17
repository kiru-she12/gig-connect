<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

class Review {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getReviews($user_ID, $type = 'received') {
        if(!$user_ID) {
            return ["error" => "User ID is required!"];
        }

        if ($type === 'given') {
            $stmt = $this->pdo->prepare("
                SELECT r.rating_ID, r.score, r.review,
                       u.name as given_to_name,
                       j.title as job_title
                FROM rate_review r
                JOIN users u ON r.given_to = u.user_ID
                JOIN job j ON r.job_ID = j.job_ID
                WHERE r.given_by = ?
                ORDER BY r.rating_ID DESC
            ");
        } else {
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
        }
        
        $stmt->execute([$user_ID]);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            "success" => true,
            "reviews" => $reviews ? $reviews : []
        ];
    }
}

// run
$user_ID = $_GET['user_ID'] ?? null;
$type = $_GET['type'] ?? 'received';
$review = new Review($pdo);
$result = $review->getReviews($user_ID, $type);
echo json_encode($result);
?>