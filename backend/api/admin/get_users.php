<?php
require_once __DIR__ . '/../../config/cors.php';
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

        if ($role === 'student') {
            $query = "SELECT u.user_ID, u.name, u.email, u.role, u.status, u.created_at, s.year, s.degree, s.bio, s.languages, s.skills FROM users u LEFT JOIN student s ON u.user_ID = s.user_ID WHERE u.role = 'student'";
            if ($status) {
                $query .= " AND u.status = '$status'";
            }
        } else {
            $query = "SELECT user_ID, name, email, role, status, created_at FROM users WHERE 1";
            if($role) {
                $query .= " AND role = '$role'";
            }
            if($status) {
                $query .= " AND status = '$status'";
            }
        }

        $query .= " ORDER BY created_at DESC";

        $stmt = $this->pdo->query($query);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if($role === 'student') {
            $dummyStudents = [
                ["user_ID" => 10001, "name" => "Achintha Bandara", "email" => "iit22030@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-05-12 08:30:00"],
                ["user_ID" => 10002, "name" => "Dilhani Jayasinghe", "email" => "aqt21060@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-05-14 09:15:00"],
                ["user_ID" => 10003, "name" => "Kasun Perera", "email" => "pmt23057@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-05-18 10:45:00"],
                ["user_ID" => 10004, "name" => "Priyantha Silva", "email" => "eag23066@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-05-20 11:20:00"],
                ["user_ID" => 10005, "name" => "Sanjeewa Kumara", "email" => "ans22073@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-05-22 14:10:00"],
                ["user_ID" => 10006, "name" => "Thilini Wijesinghe", "email" => "cst23001@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-05-25 15:30:00"],
                ["user_ID" => 10007, "name" => "Ruwan Fernando", "email" => "hte22088@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-05-28 16:40:00"],
                ["user_ID" => 10008, "name" => "Menaka Ranasinghe", "email" => "ict23012@std.uwu.ac.lk", "role" => "student", "status" => "pending", "created_at" => "2026-06-01 10:05:00"],
                ["user_ID" => 10009, "name" => "Sanduni Wickramasinghe", "email" => "mrt22034@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-06-03 12:50:00"],
                ["user_ID" => 10010, "name" => "Nuwan Rajapaksha", "email" => "sct23055@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-06-05 14:15:00"],
                ["user_ID" => 10011, "name" => "Isuru Herath", "email" => "bet22090@std.uwu.ac.lk", "role" => "student", "status" => "active", "created_at" => "2026-06-08 09:22:00"]
            ];
            
            $dummyEmails = array_map('strtolower', array_column($dummyStudents, 'email'));
            $filteredDBUsers = array_filter($users ? $users : [], function($u) use ($dummyEmails) {
                $email = strtolower($u['email'] ?? '');
                return !in_array($email, $dummyEmails);
            });
            
            $users = array_merge($dummyStudents, array_values($filteredDBUsers));
        }

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