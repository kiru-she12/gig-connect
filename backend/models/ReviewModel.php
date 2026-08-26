<?php
// backend/models/ReviewModel.php
require_once __DIR__ . '/BaseModel.php';

class ReviewModel extends BaseModel {

    public function submitReview($data, $user) {
        $job_ID = $data['job_ID'];
        $given_to = $data['given_to'];
        $score = $data['score'];
        $review = $data['review'] ?? null;

        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND (status = 'completed' OR status = 'delivered')");
        $stmt->execute([$job_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$job) {
            return ["error" => "Job not found or not completed/delivered!"];
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

        $rating_ID = $this->generateNextID('rate_review', 'rating_ID', 'RAT');

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
?>
