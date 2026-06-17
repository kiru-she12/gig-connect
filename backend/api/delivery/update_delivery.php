<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Delivery {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function updateDelivery($data, $user) {
        $delivery_ID = $data['delivery_ID'];
        $action = $data['action'];

        $stmt = $this->pdo->prepare("SELECT * FROM delivery WHERE delivery_ID = ?");
        $stmt->execute([$delivery_ID]);
        $delivery = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$delivery) {
            return ["error" => "Delivery not found!"];
        }

        if($action === 'assign') {
            if($user->role !== 'admin' && $user->role !== 'manager') {
                return ["error" => "Unauthorized!"];
            }
            $delivery_person_ID = $data['delivery_person_ID'];
            $stmt = $this->pdo->prepare("UPDATE delivery SET delivery_person_ID = ?, status = 'assigned' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_person_ID, $delivery_ID]);
            return ["success" => "Delivery staff assigned successfully!"];

        } else if($action === 'pickup') {
            if($user->role !== 'delivery_staff' && !($delivery['delivery_type'] === 'self' && $delivery['sender_std_ID'] === $user->user_ID)) {
                return ["error" => "Unauthorized!"];
            }
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'picked_up' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);
            return ["success" => "Product picked up successfully!"];

        } else if($action === 'deliver') {
            if($user->role !== 'delivery_staff' && !($delivery['delivery_type'] === 'self' && $delivery['sender_std_ID'] === $user->user_ID)) {
                return ["error" => "Unauthorized!"];
            }
            $stmt = $this->pdo->prepare("UPDATE delivery SET status = 'delivered' WHERE delivery_ID = ?");
            $stmt->execute([$delivery_ID]);
            $stmt = $this->pdo->prepare("UPDATE job SET status = 'completed', completed_time = NOW() WHERE job_ID = ?");
            $stmt->execute([$delivery['job_ID']]);
            return ["success" => "Product delivered successfully!"];

        } else {
            return ["error" => "Invalid action!"];
        }
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$delivery = new Delivery($pdo);
$result = $delivery->updateDelivery($data, $user);
echo json_encode($result);
?>