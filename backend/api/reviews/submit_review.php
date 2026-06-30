<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Review {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function submitReview($data, $user) {
        $job_ID = $data['job_ID'];
        $given_to = $data['given_to'];
        $score = $data['score'];
        $review = $data['review'] ?? null;

        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'completed'");
        $stmt->execute([$job_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$job) {
            return ["error" => "Job not found or not completed!"];
        }

        $stmt = $this->pdo->prepare("SELECT * FROM rate_review WHERE job_ID = ? AND given_by = ?");
        $stmt->execute([$job_ID, $user->user_ID]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if($existing) {
            return ["error" => "You already reviewed this job!"];
        }

        if($score < 1 || $score > 5) {
            return ["error" => "Score must be between 1 and 5!"];
        }

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM rate_review");
        $count = $stmt->fetchColumn();
        $rating_ID = 'RAT' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        $stmt = $this->pdo->prepare("INSERT INTO rate_review (rating_ID, job_ID, given_by, given_to, score, review) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$rating_ID, $job_ID, $user->user_ID, $given_to, $score, $review]);

        $stmt = $this->pdo->prepare("SELECT * FROM student WHERE user_ID = ?");
        $stmt->execute([$given_to]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if($student) {
            $stmt = $this->pdo->prepare("SELECT AVG(score) FROM rate_review WHERE given_to = ?");
            $stmt->execute([$given_to]);
            $avg_rating = $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("UPDATE student SET rating = ? WHERE user_ID = ?");
            $stmt->execute([round($avg_rating, 2), $given_to]);
        }

        return [
            "success" => "Review submitted successfully!",
            "rating_ID" => $rating_ID
        ];
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$review = new Review($pdo);
$result = $review->submitReview($data, $user);
echo json_encode($result);
?>