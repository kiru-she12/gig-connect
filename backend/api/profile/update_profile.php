<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Profile {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function updateProfile($data, $user) {
        // update basic user info
        $name = $data['name'] ?? null;
        $phone = $data['phone'] ?? null;

        if($name || $phone) {
            $stmt = $this->pdo->prepare("UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE user_ID = ?");
            $stmt->execute([$name, $phone, $user->user_ID]);
        }

        // update student details
        if($user->role === 'student') {
            $skills = $data['skills'] ?? null;
            $preference = $data['preference'] ?? null;
            $is_delivery_available = $data['is_delivery_available'] ?? null;
            $degree = $data['degree'] ?? null;
            $year = $data['year'] ?? null;
            $gender = $data['gender'] ?? null;

            $stmt = $this->pdo->prepare("UPDATE student SET 
                skills = COALESCE(?, skills),
                preference = COALESCE(?, preference),
                is_delivery_available = COALESCE(?, is_delivery_available),
                degree = COALESCE(?, degree),
                year = COALESCE(?, year),
                gender = COALESCE(?, gender)
                WHERE user_ID = ?");
            $stmt->execute([$skills, $preference, $is_delivery_available, $degree, $year, $gender, $user->user_ID]);
        }

        // update job provider details
        if($user->role === 'job_provider') {
            $business_reg_no = $data['business_reg_no'] ?? null;
            $type = $data['type'] ?? null;
            $address = $data['address'] ?? null;
            $latitude = $data['latitude'] ?? null;
            $longitude = $data['longitude'] ?? null;

            $stmt = $this->pdo->prepare("UPDATE job_provider SET 
                business_reg_no = COALESCE(?, business_reg_no),
                type = COALESCE(?, type),
                address = COALESCE(?, address),
                latitude = COALESCE(?, latitude),
                longitude = COALESCE(?, longitude)
                WHERE user_ID = ?");
            $stmt->execute([$business_reg_no, $type, $address, $latitude, $longitude, $user->user_ID]);
        }

        // update delivery staff details
        if($user->role === 'delivery_staff') {
            $vehicle_type = $data['vehicle_type'] ?? null;
            $location = $data['location'] ?? null;

            $stmt = $this->pdo->prepare("UPDATE delivery_staff SET 
                vehicle_type = COALESCE(?, vehicle_type),
                location = COALESCE(?, location)
                WHERE user_ID = ?");
            $stmt->execute([$vehicle_type, $location, $user->user_ID]);
        }

        return ["success" => "Profile updated successfully!"];
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$profile = new Profile($pdo);
$result = $profile->updateProfile($data, $user);
echo json_encode($result);
?>