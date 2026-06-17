<?php
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include '../../config/db.php';
include '../../middleware/auth.php';

class DeliveryList {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getDeliveries($user) {
        if ($user->role === 'student') {
            // Student: only deliveries they initiated for product-based jobs
            $stmt = $this->pdo->prepare("
                SELECT d.*, j.title as job_title, j.payment as job_payment, j.is_product_based,
                       u.name as delivery_staff_name
                FROM delivery d
                JOIN job j ON d.job_ID = j.job_ID AND j.is_product_based = 1
                LEFT JOIN users u ON d.delivery_person_ID = u.user_ID
                WHERE d.sender_std_ID = ?
                ORDER BY d.delivery_ID DESC
            ");
            $stmt->execute([$user->user_ID]);
            return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];

        } else if ($user->role === 'delivery_staff') {
            // Rider: only product-based job deliveries assigned to them
            $stmt = $this->pdo->prepare("
                SELECT d.*, j.title as job_title, j.payment as job_payment, j.is_product_based,
                       u.name as sender_name
                FROM delivery d
                JOIN job j ON d.job_ID = j.job_ID AND j.is_product_based = 1
                LEFT JOIN users u ON d.sender_std_ID = u.user_ID
                WHERE d.delivery_person_ID = ?
                ORDER BY d.delivery_ID DESC
            ");
            $stmt->execute([$user->user_ID]);
            return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];

        } else if ($user->role === 'admin' || $user->role === 'manager') {
            // Admin/Manager: all product-based deliveries
            $stmt = $this->pdo->query("
                SELECT d.*, j.title as job_title, j.payment as job_payment, j.is_product_based,
                       u1.name as sender_name, u2.name as delivery_staff_name
                FROM delivery d
                JOIN job j ON d.job_ID = j.job_ID AND j.is_product_based = 1
                LEFT JOIN users u1 ON d.sender_std_ID = u1.user_ID
                LEFT JOIN users u2 ON d.delivery_person_ID = u2.user_ID
                ORDER BY d.delivery_ID DESC
            ");
            return ["success" => true, "deliveries" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } else {
            return ["error" => "Unauthorized role!"];
        }
    }
}

$user = authenticate();
$list = new DeliveryList($pdo);
$result = $list->getDeliveries($user);
echo json_encode($result);
?>
