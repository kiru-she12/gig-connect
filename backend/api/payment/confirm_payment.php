<?php
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include '../../config/db.php';
include '../../middleware/auth.php';

class ConfirmPayment {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function confirm($data, $user) {
        if ($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized! Only admins or managers can confirm payments."];
        }

        if (empty($data['payment_ID'])) {
            return ["error" => "Payment ID is required."];
        }

        $payment_ID = $data['payment_ID'];
        $action = $data['action'] ?? 'confirm'; // 'confirm' or 'reject'

        // Check if payment exists
        $stmt = $this->pdo->prepare("SELECT * FROM payment WHERE payment_ID = ?");
        $stmt->execute([$payment_ID]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$payment) {
            return ["error" => "Payment record not found!"];
        }

        if ($payment['status'] !== 'pending') {
            return ["error" => "Payment is already processed. Current status: " . $payment['status']];
        }

        $new_status = ($action === 'reject') ? 'failed' : 'paid';

        // Update payment status
        $stmt_update = $this->pdo->prepare("UPDATE payment SET status = ? WHERE payment_ID = ?");
        $stmt_update->execute([$new_status, $payment_ID]);

        // If action is confirm and payment_type is boost, update job is_boosted = 1
        if ($action === 'confirm' && $payment['payment_type'] === 'boost') {
            $stmt_job = $this->pdo->prepare("UPDATE job SET is_boosted = 1 WHERE job_ID = ?");
            $stmt_job->execute([$payment['job_ID']]);
        }

        return [
            "success" => "Payment status updated to '{$new_status}' successfully!",
            "payment_ID" => $payment_ID,
            "status" => $new_status
        ];
    }
}

$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$obj = new ConfirmPayment($pdo);
$result = $obj->confirm($data, $user);
echo json_encode($result);
?>
