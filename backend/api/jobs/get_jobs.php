<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

class JobService {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getJobs($filters) {
        $category = $filters['category'] ?? null;
        $job_type = $filters['job_type'] ?? null;
        $min_payment = $filters['min_payment'] ?? null;
        $max_payment = $filters['max_payment'] ?? null;
        $skills = $filters['skills'] ?? null;
        $all = $filters['all'] ?? null;
        $status = $filters['status'] ?? null;

        $query = "SELECT * FROM job WHERE 1=1";

        if (!$all && !$status) {
            $query .= " AND status = 'active'";
        } else if ($status) {
            $query .= " AND status = '$status'";
        }

        if ($job_type) {
            $query .= " AND job_type = '$job_type'";
        }

        if ($min_payment) {
            $query .= " AND payment >= '$min_payment'";
        }

        if ($max_payment) {
            $query .= " AND payment <= '$max_payment'";
        }

        if ($skills) {
            $query .= " AND skills LIKE '%$skills%'";
        }

        $query .= " ORDER BY is_boosted DESC, created_at DESC";

        $stmt = $this->pdo->query($query);
        $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$jobs) {
            return ["message" => "No jobs found!"];
        }

        return [
            "success" => true,
            "jobs" => $jobs
        ];
    }
}

$filters = [
    'category' => $_GET['category'] ?? null,
    'job_type' => $_GET['job_type'] ?? null,
    'min_payment' => $_GET['min_payment'] ?? null,
    'max_payment' => $_GET['max_payment'] ?? null,
    'skills' => $_GET['skills'] ?? null,
    'all' => $_GET['all'] ?? null,
    'status' => $_GET['status'] ?? null
];

$jobService = new JobService($pdo);
$result = $jobService->getJobs($filters);
echo json_encode($result);
?>