<?php
require_once __DIR__ . '/../../config/cors.php';
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Content-Type: application/json");
include '../../config/db.php';
include '../../middleware/auth.php';
include '../../config/mail.php';
include '../../config/email_templates.php';

class StaffManager {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function addStaff($data, $user) {
        if($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized!"];
        }

        $name = $data['name'];
        $email = $data['email'];
        $password = $data['password'];
        $role = $data['role'];

        if($user->role === 'manager' && $role !== 'delivery_staff') {
            return ["error" => "Managers can only add delivery staff!"];
        }

        if($role !== 'manager' && $role !== 'delivery_staff') {
            return ["error" => "Invalid role!"];
        }

        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if($existing) {
            return ["error" => "Email already exists!"];
        }

        $prefix = [
            'manager' => 'MNG',
            'delivery_staff' => 'DEL'
        ];

        $pre = $prefix[$role];
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = '$role'");
        $count = $stmt->fetchColumn();
        $user_ID = $pre . str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        $hashed = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $this->pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$user_ID, $name, $email, $hashed, $role]);

        if($role === 'manager') {
            $manager_ID = 'MNG' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
            $stmt = $this->pdo->prepare("INSERT INTO manager (manager_ID, user_ID) VALUES (?, ?)");
            $stmt->execute([$manager_ID, $user_ID]);

        } else if($role === 'delivery_staff') {
            $phone = $data['phone'] ?? null;
            $vehicle_type = $data['vehicle_type'] ?? null;
            $location = $data['location'] ?? null;
            $delivery_staff_ID = 'DEL' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
            $stmt = $this->pdo->prepare("INSERT INTO delivery_staff (delivery_staff_ID, user_ID, name, phone, vehicle_type, location) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$delivery_staff_ID, $user_ID, $name, $phone, $vehicle_type, $location]);
        }

        $email_body = welcomeEmail($name);
        sendEmail($email, "Welcome to GigConnect!", $email_body);

        return [
            "success" => "Staff added successfully!",
            "user_ID" => $user_ID
        ];
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$staffManager = new StaffManager($pdo);
$result = $staffManager->addStaff($data, $user);
echo json_encode($result);
?>