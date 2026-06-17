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

    public function approveJob($data, $user) {
        // only admin and manager can approve/moderate jobs
        if($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized!"];
        }

        $job_ID = $data['job_ID'];
        $action = $data['action'] ?? '';
        $status = $data['status'] ?? '';

        // check if job exists
        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ?");
        $stmt->execute([$job_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$job) {
            return ["error" => "Job not found!"];
        }

        if(!empty($status)) {
            $valid_statuses = ['pending', 'active', 'in_progress', 'completed', 'closed'];
            if(in_array($status, $valid_statuses)) {
                $stmt = $this->pdo->prepare("UPDATE job SET status = ? WHERE job_ID = ?");
                $stmt->execute([$status, $job_ID]);
                return ["success" => "Job status updated to $status successfully!"];
            } else {
                return ["error" => "Invalid status!"];
            }
        }

        if($action === 'approve') {
            $stmt = $this->pdo->prepare("UPDATE job SET status = 'active' WHERE job_ID = ?");
            $stmt->execute([$job_ID]);
            return ["success" => "Job approved successfully!"];

        } else if($action === 'reject') {
            $stmt = $this->pdo->prepare("UPDATE job SET status = 'closed' WHERE job_ID = ?");
            $stmt->execute([$job_ID]);
            return ["success" => "Job rejected successfully!"];

        } else {
            return ["error" => "Invalid action or status!"];
        }
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$job = new Job($pdo);
$result = $job->approveJob($data, $user);
echo json_encode($result);
?>