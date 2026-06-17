<?php
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include '../../config/db.php';
include '../../middleware/auth.php';

class Commission {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function createCommission($data, $user) {
        if ($user->role !== 'job_provider') {
            return ["error" => "Unauthorized! Only job providers can generate commission payments."];
        }

        if (empty($data['job_ID'])) {
            return ["error" => "Job ID is required."];
        }

        $job_ID = $data['job_ID'];

        // Get provider ID
        $stmt_prov = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
        $stmt_prov->execute([$user->user_ID]);
        $provider_ID = $stmt_prov->fetchColumn();

        if (!$provider_ID) {
            return ["error" => "Job provider profile not found!"];
        }

        // Get job details to verify ownership and calculate amount
        $stmt_job = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = ?");
        $stmt_job->execute([$job_ID, $provider_ID]);
        $job = $stmt_job->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            return ["error" => "Job not found or does not belong to this provider!"];
        }

        // Check if commission payment already exists for this job
        $stmt_check = $this->pdo->prepare("SELECT * FROM payment WHERE job_ID = ? AND payment_type = 'commission'");
        $stmt_check->execute([$job_ID]);
        $existing = $stmt_check->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            return [
                "success" => "Commission record already exists.",
                "payment_ID" => $existing['payment_ID'],
                "amount" => floatval($existing['amount']),
                "status" => $existing['status']
            ];
        }

        // Calculate 5% commission
        $amount = floatval($job['payment']) * 0.05;

        // Generate payment ID
        $stmt_count = $this->pdo->query("SELECT COUNT(*) FROM payment");
        $pay_count = $stmt_count->fetchColumn();
        $payment_ID = 'PAY' . str_pad($pay_count + 1, 3, '0', STR_PAD_LEFT);

        // Insert payment record
        $stmt_insert = $this->pdo->prepare("
            INSERT INTO payment (payment_ID, job_ID, provider_ID, amount, payment_type, status, created_at)
            VALUES (?, ?, ?, ?, 'commission', 'pending', NOW())
        ");
        $stmt_insert->execute([$payment_ID, $job_ID, $provider_ID, $amount]);

        return [
            "success" => "Commission recorded successfully!",
            "payment_ID" => $payment_ID,
            "amount" => round($amount, 2),
            "status" => "pending"
        ];
    }
}

$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$obj = new Commission($pdo);
$result = $obj->createCommission($data, $user);
echo json_encode($result);
?>
