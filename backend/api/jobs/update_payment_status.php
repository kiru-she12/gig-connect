<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
include '../../config/db.php';
include '../../middleware/auth.php';

class PaymentStatusUpdate {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function updatePaymentStatus($data, $user) {
        if ($user->role !== 'job_provider') {
            return ["error" => "Unauthorized! Only job providers can update payment status."];
        }

        $job_ID = $data['job_ID'] ?? null;
        $status = $data['payment_status'] ?? 'paid';

        if (!$job_ID) {
            return ["error" => "Job ID is required!"];
        }

        // Get provider_id
        $stmt = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $provider_ID = $stmt->fetchColumn();

        if (!$provider_ID) {
            return ["error" => "Job provider profile not found!"];
        }

        // Check if job exists and belongs to this provider
        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = ?");
        $stmt->execute([$job_ID, $provider_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            return ["error" => "Job not found or unauthorized!"];
        }

        // Update payment status
        $stmt = $this->pdo->prepare("UPDATE job SET payment_status = ? WHERE job_ID = ?");
        $stmt->execute([$status, $job_ID]);

        return [
            "success" => "Job payment status updated successfully!",
            "job_ID" => $job_ID,
            "payment_status" => $status
        ];
    }
}

// Run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$update = new PaymentStatusUpdate($pdo);
$result = $update->updatePaymentStatus($data, $user);
echo json_encode($result);
?>
