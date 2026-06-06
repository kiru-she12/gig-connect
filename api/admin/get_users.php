<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

class Job {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getJobs($filters) {
        $job_type = $filters['job_type'] ?? null;
        $min_payment = $filters['min_payment'] ?? null;
        $max_payment = $filters['max_payment'] ?? null;
        $skills = $filters['skills'] ?? null;

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

        $stmt = $this->pdo->query($query);
        $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if(!$jobs) {
            return ["message" => "No jobs found!"];
        }

        return [
            "success" => true,
            "jobs" => $jobs
        ];
    }
}

// run
$job = new Job($pdo);
$result = $job->getJobs($_GET);
echo json_encode($result);
?>