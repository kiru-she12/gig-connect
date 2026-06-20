<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';

function getCategory($title, $skills) {
    $t = strtolower($title);
    $s = strtolower($skills);
    if (strpos($t, 'design') !== false || strpos($t, 'logo') !== false || strpos($t, 'poster') !== false || strpos($t, 'card') !== false || strpos($t, 'flyer') !== false || strpos($t, 'presentation') !== false || strpos($t, 'powerpoint') !== false || strpos($t, 'cv') !== false || strpos($t, 'resume') !== false || strpos($s, 'design') !== false || strpos($s, 'photoshop') !== false) {
        return 'Design';
    }
    if (strpos($t, 'data entry') !== false || strpos($t, 'excel') !== false || strpos($t, 'inventory') !== false || strpos($t, 'listing') !== false || strpos($t, 'typing') !== false || strpos($t, 'form') !== false || strpos($s, 'data entry') !== false || strpos($s, 'excel') !== false || strpos($s, 'typing') !== false) {
        return 'Data Entry';
    }
    if (strpos($t, 'photography') !== false || strpos($t, 'photographer') !== false || strpos($t, 'video') !== false || strpos($t, 'editor') !== false || strpos($t, 'vlog') !== false || strpos($t, 'reels') !== false || strpos($t, 'thumbnail') !== false || strpos($s, 'photography') !== false || strpos($s, 'video editing') !== false) {
        return 'Photography';
    }
    if (strpos($t, 'web dev') !== false || strpos($t, 'website') !== false || strpos($s, 'web dev') !== false || strpos($s, 'coding') !== false) {
        return 'Web Dev';
    }
    if (strpos($t, 'translation') !== false || strpos($t, 'translator') !== false || strpos($t, 'translate') !== false || strpos($t, 'proofreading') !== false || strpos($s, 'translation') !== false || strpos($s, 'translator') !== false) {
        return 'Translation';
    }
    if (strpos($t, 'tutor') !== false || strpos($t, 'homework') !== false || strpos($t, 'kids') !== false || strpos($t, 'academic') !== false || strpos($s, 'tutoring') !== false || strpos($s, 'maths') !== false) {
        return 'Academic & Tutoring';
    }
    return 'Local Services';
}

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

        $query = "SELECT j.*, u.name AS provider_name, u.email AS provider_email 
                  FROM job j 
                  LEFT JOIN users u ON j.provider_ID = u.user_ID 
                  WHERE 1=1";

        if (!$all && !$status) {
            $query .= " AND j.status = 'active'";
        } else if ($status) {
            $query .= " AND j.status = '$status'";
        }

        if ($job_type) {
            $query .= " AND j.job_type = '$job_type'";
        }

        if ($min_payment) {
            $query .= " AND j.payment >= '$min_payment'";
        }

        if ($max_payment) {
            $query .= " AND j.payment <= '$max_payment'";
        }

        if ($skills) {
            $query .= " AND j.skills LIKE '%$skills%'";
        }

        $query .= " ORDER BY j.is_boosted DESC, j.created_at DESC";

        $stmt = $this->pdo->query($query);
        $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$jobs) {
            return ["message" => "No jobs found!"];
        }

        foreach ($jobs as &$job) {
            $job['category'] = getCategory($job['title'], $job['skills'] ?? '');
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