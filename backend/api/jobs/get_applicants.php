<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Application {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getApplicants($job_ID, $user) {
        // only job provider can view applicants
        if($user->role !== 'job_provider') {
            return ["error" => "Unauthorized!"];
        }

        if(!$job_ID) {
            return ["error" => "Job ID is required!"];
        }

        // check if job belongs to this provider
        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = (SELECT provider_ID FROM job_provider WHERE user_ID = ?)");
        $stmt->execute([$job_ID, $user->user_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$job) {
            return ["error" => "Job not found!"];
        }

        // get applicants with student details
        $stmt = $this->pdo->prepare("
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
            return ["message" => "No applicants found!"];
        }

        return [
            "success" => true,
            "applicants" => $applicants
        ];
    }
}

// run
$user = authenticate();
$job_ID = $_GET['job_ID'] ?? null;
$application = new Application($pdo);
$result = $application->getApplicants($job_ID, $user);
echo json_encode($result);
?>