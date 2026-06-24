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
        $business_reg_no = isset($data['business_reg_no']) ? trim($data['business_reg_no']) : '';
        $address = isset($data['address']) ? trim($data['address']) : '';
        $latitude = isset($data['latitude']) ? $data['latitude'] : null;
        $longitude = isset($data['longitude']) ? $data['longitude'] : null;
        $seekers_needed = isset($data['seekers_needed']) ? intval($data['seekers_needed']) : 1;
        $job_date = isset($data['job_date']) ? $data['job_date'] : null;
        $start_time = isset($data['start_time']) ? $data['start_time'] : null;
        $end_time = isset($data['end_time']) ? $data['end_time'] : null;

        // validate business registration number for onsite jobs
        if ($job_type === 'onsite' && empty($business_reg_no)) {
            return ["error" => "Business registration number is required for onsite jobs!"];
        }

        // validate address for onsite jobs
        if ($job_type === 'onsite' && empty($address)) {
            return ["error" => "Address is required for onsite jobs!"];
        }

        // get provider_id
        $stmt = $this->pdo->prepare("SELECT provider_ID, is_verified FROM job_provider WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$provider) {
            return ["error" => "Job provider not found!"];
        }

        // Update provider's business details if provided
        $updateFields = [];
        $params = [];
        if (!empty($business_reg_no)) {
            $updateFields[] = "business_reg_no = ?";
            $params[] = $business_reg_no;
        }
        if (!empty($address)) {
            $updateFields[] = "address = ?";
            $params[] = $address;
        }
        if ($latitude !== null) {
            $updateFields[] = "latitude = ?";
            $params[] = $latitude;
        }
        if ($longitude !== null) {
            $updateFields[] = "longitude = ?";
            $params[] = $longitude;
        }

        if (!empty($updateFields)) {
            $sql = "UPDATE job_provider SET " . implode(", ", $updateFields) . " WHERE provider_ID = ?";
            $params[] = $provider['provider_ID'];
            $stmtUpdate = $this->pdo->prepare($sql);
            $stmtUpdate->execute($params);
        }

        // Determine job status: all new jobs start as pending until approved by admin/manager
        $status = 'pending';

        // generate job ID
        $stmt2 = $this->pdo->query("SELECT COUNT(*) FROM job");
        $count = $stmt2->fetchColumn();
        $job_ID = 'JOB' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        // insert job
        $stmt3 = $this->pdo->prepare("INSERT INTO job (job_ID, provider_ID, title, description, skills, payment, job_type, deadline, status, seekers_needed, job_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt3->execute([
            $job_ID,
            $provider['provider_ID'],
            $title,
            $description,
            $skills,
            $payment,
            $job_type,
            $deadline,
            $status,
            $seekers_needed,
            $job_date,
            $start_time,
            $end_time
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