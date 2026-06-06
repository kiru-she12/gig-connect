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

    public function applyJob($data, $user) {
        // only students can apply
        if($user->role !== 'student') {
            return ["error" => "Only students can apply for jobs!"];
        }

        $job_ID = $data['job_ID'];

        // check if job exists and is active
        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'active'");
        $stmt->execute([$job_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$job) {
            return ["error" => "Job not found or not active!"];
        }

        // get student_id
        $stmt = $this->pdo->prepare("SELECT student_ID FROM student WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$student) {
            return ["error" => "Student not found!"];
        }

        // check if already applied
        $stmt = $this->pdo->prepare("SELECT * FROM application WHERE job_ID = ? AND student_ID = ?");
        $stmt->execute([$job_ID, $student['student_ID']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if($existing) {
            return ["error" => "You already applied for this job!"];
        }

        // generate application ID
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM application");
        $count = $stmt->fetchColumn();
        $application_ID = 'APP' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        // insert application
        $stmt = $this->pdo->prepare("INSERT INTO application (application_ID, job_ID, student_ID) VALUES (?, ?, ?)");
        $stmt->execute([$application_ID, $job_ID, $student['student_ID']]);

        return [
            "success" => "Applied successfully!",
            "application_ID" => $application_ID
        ];
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$application = new Application($pdo);
$result = $application->applyJob($data, $user);
echo json_encode($result);
?>