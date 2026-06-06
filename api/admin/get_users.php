<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class UserManager {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getUsers($filters, $user) {
        if($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized!"];
        }

        $role = $filters['role'] ?? null;
        $status = $filters['status'] ?? null;

        $query = "SELECT user_ID, name, email, role, status, created_at FROM users WHERE 1";

        if($role) {
            $query .= " AND role = '$role'";
        }
        if($status) {
            $query .= " AND status = '$status'";
        }

        $query .= " ORDER BY created_at DESC";

        $stmt = $this->pdo->query($query);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if(!$users) {
            return ["message" => "No users found!"];
        }

        return [
            "success" => true,
            "users" => $users
        ];
    }
}

// run
$user = authenticate();
$userManager = new UserManager($pdo);
$result = $userManager->getUsers($_GET, $user);
echo json_encode($result);
?>