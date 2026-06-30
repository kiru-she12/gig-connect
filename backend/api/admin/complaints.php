<?php
require_once __DIR__ . '/../../config/cors.php';
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class ComplaintsController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest($user) {
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET') {
            if ($user->role !== 'admin' && $user->role !== 'manager') {
                return ["error" => "Unauthorized!"];
            }
            return $this->getComplaints();
        } else if ($method === 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            if (isset($data['action']) && $data['action'] === 'create') {
                return $this->createComplaint($data);
            }
            if ($user->role !== 'admin' && $user->role !== 'manager') {
                return ["error" => "Unauthorized!"];
            }
            return $this->updateComplaintStatus($data);
        }

        return ["error" => "Method not allowed"];
    }

    private function getComplaints() {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM complaints ORDER BY id DESC");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            return ["error" => $e->getMessage()];
        }
    }

    private function createComplaint($data) {
        $complainer = $data['complainer'] ?? null;
        $about = $data['about'] ?? null;
        $reason = $data['reason'] ?? null;
        $text = $data['text'] ?? null;

        if (!$complainer || !$about || !$reason || !$text) {
            return ["error" => "All fields (complainer, about, reason, text) are required."];
        }

        try {
            $stmt = $this->pdo->prepare("INSERT INTO complaints (complainer, about, reason, text, date, status) VALUES (?, ?, ?, ?, CURDATE(), 'Pending Review')");
            $stmt->execute([$complainer, $about, $reason, $text]);
            return ["success" => true, "message" => "Complaint/Alert created successfully."];
        } catch (Exception $e) {
            return ["error" => $e->getMessage()];
        }
    }

    private function updateComplaintStatus($data) {
        $complaint_id = $data['id'] ?? null;
        $status = $data['status'] ?? 'Resolved';

        if (!$complaint_id) {
            return ["error" => "Complaint ID is required."];
        }

        try {
            $stmt = $this->pdo->prepare("UPDATE complaints SET status = ? WHERE id = ?");
            $stmt->execute([$status, $complaint_id]);
            return ["success" => true, "message" => "Complaint status updated to $status successfully."];
        } catch (Exception $e) {
            return ["error" => $e->getMessage()];
        }
    }
}

$user = authenticate();
$controller = new ComplaintsController($pdo);
$result = $controller->handleRequest($user);
echo json_encode($result);
?>
