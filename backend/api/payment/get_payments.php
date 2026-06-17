<?php
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include '../../config/db.php';
include '../../middleware/auth.php';

class GetPayments {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function get($data, $user) {
        $payment_type = $_GET['payment_type'] ?? null;
        $status = $_GET['status'] ?? null;

        $query = "SELECT * FROM payment WHERE 1=1";
        $params = [];

        if ($user->role === 'job_provider') {
            // Get provider ID
            $stmt_prov = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
            $stmt_prov->execute([$user->user_ID]);
            $provider_ID = $stmt_prov->fetchColumn();

            if (!$provider_ID) {
                return ["error" => "Job provider profile not found!"];
            }

            $query .= " AND provider_ID = ?";
            $params[] = $provider_ID;
        } else if ($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized! You do not have permission to view payment records."];
        }

        if ($payment_type) {
            $query .= " AND payment_type = ?";
            $params[] = $payment_type;
        }

        if ($status) {
            $query .= " AND status = ?";
            $params[] = $status;
        }

        $query .= " ORDER BY created_at DESC";

        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format floats
        foreach ($payments as &$pay) {
            $pay['amount'] = floatval($pay['amount']);
        }

        return [
            "success" => true,
            "payments" => $payments
        ];
    }
}

$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$obj = new GetPayments($pdo);
$result = $obj->get($data, $user);
echo json_encode($result);
?>
