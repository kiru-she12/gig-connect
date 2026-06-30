<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Profile {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getProfile($user) {
        // get basic user info
        $stmt = $this->pdo->prepare("SELECT user_ID, name, email, role, status, phone, created_at FROM users WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$profile) {
            return ["error" => "User not found!"];
        }

        // get extra info based on role
        if($user->role === 'student') {
            $stmt = $this->pdo->prepare("SELECT student_ID, skills, rating, preference, is_delivery_available, degree, year, gender FROM student WHERE user_ID = ?");
            $stmt->execute([$user->user_ID]);
            $extra = $stmt->fetch(PDO::FETCH_ASSOC);
            $profile['student_details'] = $extra;

        } else if($user->role === 'job_provider') {
            $stmt = $this->pdo->prepare("SELECT provider_ID, nic, business_reg_no, type, is_verified, address, latitude, longitude FROM job_provider WHERE user_ID = ?");
            $stmt->execute([$user->user_ID]);
            $extra = $stmt->fetch(PDO::FETCH_ASSOC);
            $profile['provider_details'] = $extra;

        } else if($user->role === 'delivery_staff') {
            $stmt = $this->pdo->prepare("SELECT delivery_staff_ID, phone, vehicle_type, location, status FROM delivery_staff WHERE user_ID = ?");
            $stmt->execute([$user->user_ID]);
            $extra = $stmt->fetch(PDO::FETCH_ASSOC);
            $profile['delivery_details'] = $extra;
        }

        return [
            "success" => true,
            "profile" => $profile
        ];
    }
}

// run
$user = authenticate();
$profile = new Profile($pdo);
$result = $profile->getProfile($user);
echo json_encode($result);
?>