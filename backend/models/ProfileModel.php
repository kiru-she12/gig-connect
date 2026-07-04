<?php
// backend/models/ProfileModel.php
require_once __DIR__ . '/BaseModel.php';

class ProfileModel extends BaseModel {

    public function updateProfile($data, $user) {
        $name = $data['name'] ?? null;
        $phone = $data['phone'] ?? null;

        if($name || $phone) {
            $stmt = $this->pdo->prepare("UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE user_ID = ?");
            $stmt->execute([$name, $phone, $user->user_ID]);
        }

        if($user->role === 'student') {
            $this->ensureStudentProfile($user->user_ID);
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

        if($user->role === 'job_provider') {
            $this->ensureProviderProfile($user->user_ID);
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

        if($user->role === 'delivery_staff') {
            $this->ensureDeliveryStaffProfile($user->user_ID);
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

    public function getProfile($user) {
        $stmt = $this->pdo->prepare("SELECT user_ID, name, email, role, status, phone, created_at, profile_pic FROM users WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$profile) {
            return ["error" => "User not found!"];
        }

        if($user->role === 'student') {
            $this->ensureStudentProfile($user->user_ID);
            $stmt = $this->pdo->prepare("SELECT student_ID, skills, rating, preference, is_delivery_available, degree, year, gender FROM student WHERE user_ID = ?");
            $stmt->execute([$user->user_ID]);
            $extra = $stmt->fetch(PDO::FETCH_ASSOC);
            $profile['student_details'] = $extra;

        } else if($user->role === 'job_provider') {
            $this->ensureProviderProfile($user->user_ID);
            $stmt = $this->pdo->prepare("SELECT provider_ID, nic, business_reg_no, type, is_verified, address, latitude, longitude FROM job_provider WHERE user_ID = ?");
            $stmt->execute([$user->user_ID]);
            $extra = $stmt->fetch(PDO::FETCH_ASSOC);
            $profile['provider_details'] = $extra;

        } else if($user->role === 'delivery_staff') {
            $this->ensureDeliveryStaffProfile($user->user_ID);
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

    public function changePassword($data, $user) {
        $current_password = $data['current_password'] ?? null;
        $new_password = $data['new_password'] ?? null;
        $confirm_password = $data['confirm_password'] ?? null;

        if (!$current_password || !$new_password || !$confirm_password) {
            return ["error" => "All fields are required!"];
        }

        if ($new_password !== $confirm_password) {
            return ["error" => "New passwords do not match!"];
        }

        $stmt = $this->pdo->prepare("SELECT password FROM users WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $db_user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$db_user || !password_verify($current_password, $db_user['password'])) {
            return ["error" => "Incorrect current password!"];
        }

        $new_hash = password_hash($new_password, PASSWORD_BCRYPT);

        $stmt = $this->pdo->prepare("UPDATE users SET password = ? WHERE user_ID = ?");
        $stmt->execute([$new_hash, $user->user_ID]);

        return [
            "success" => true,
            "message" => "Password updated successfully!"
        ];
    }
}
?>
