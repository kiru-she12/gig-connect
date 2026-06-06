<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Job {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function postJob($data, $user) {
        // only job providers can post jobs
        if($user->role !== 'job_provider') {
            return ["error" => "Only job providers can post jobs!"];
        }

        $title = $data['title'];
        $description = $data['description'];
        $skills = $data['skills'];
        $payment = $data['payment'];
        $job_type = $data['job_type'];
        $deadline = $data['deadline'];

        // get provider_id
        $stmt = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$provider) {
            return ["error" => "Job provider not found!"];
        }

        // generate job ID
        $stmt2 = $this->pdo->query("SELECT COUNT(*) FROM job");
        $count = $stmt2->fetchColumn();
        $job_ID = 'JOB' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        // insert job
        $stmt3 = $this->pdo->prepare("INSERT INTO job (job_ID, provider_ID, title, description, skills, payment, job_type, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt3->execute([
            $job_ID,
            $provider['provider_ID'],
            $title,
            $description,
            $skills,
            $payment,
            $job_type,
            $deadline
        ]);

        return [
            "success" => "Job posted successfully!",
            "job_ID" => $job_ID
        ];
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$job = new Job($pdo);
$result = $job->postJob($data, $user);
echo json_encode($result);
?>