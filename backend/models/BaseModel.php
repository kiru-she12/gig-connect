<?php
// backend/models/BaseModel.php

class BaseModel {
    protected $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    protected function generateNextID($table, $column, $prefix, $prefixLength = 3) {
        $startPos = $prefixLength + 1;
        $stmt = $this->pdo->prepare("SELECT MAX(CAST(SUBSTRING(`$column`, $startPos) AS UNSIGNED)) FROM `$table` WHERE `$column` LIKE ?");
        $stmt->execute([$prefix . '%']);
        $maxVal = intval($stmt->fetchColumn());
        return $prefix . str_pad($maxVal + 1, 3, '0', STR_PAD_LEFT);
    }

    protected function ensureStudentProfile($user_ID) {
        $stmt = $this->pdo->prepare("SELECT student_ID FROM student WHERE user_ID = ?");
        $stmt->execute([$user_ID]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            $student_ID = $this->generateNextID('student', 'student_ID', 'STU');
            $stmt_ins = $this->pdo->prepare("INSERT INTO student (student_ID, user_ID, skills, year, degree, bio, languages) VALUES (?, ?, '', '', '', '', '')");
            $stmt_ins->execute([$student_ID, $user_ID]);
            return $student_ID;
        }
        return $student['student_ID'];
    }

    protected function ensureProviderProfile($user_ID) {
        $stmt = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
        $stmt->execute([$user_ID]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$provider) {
            $provider_ID = $this->generateNextID('job_provider', 'provider_ID', 'CLI');
            $stmt_ins = $this->pdo->prepare("INSERT INTO job_provider (provider_ID, user_ID, nic, business_reg_no, type, address) VALUES (?, ?, '', '', '', '')");
            $stmt_ins->execute([$provider_ID, $user_ID]);
            return $provider_ID;
        }
        return $provider['provider_ID'];
    }

    protected function ensureDeliveryStaffProfile($user_ID) {
        $stmt = $this->pdo->prepare("SELECT delivery_staff_ID FROM delivery_staff WHERE user_ID = ?");
        $stmt->execute([$user_ID]);
        $staff = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$staff) {
            $delivery_staff_ID = $this->generateNextID('delivery_staff', 'delivery_staff_ID', 'DEL');
            // Fetch name from users table
            $stmt_name = $this->pdo->prepare("SELECT name, phone FROM users WHERE user_ID = ?");
            $stmt_name->execute([$user_ID]);
            $user_info = $stmt_name->fetch(PDO::FETCH_ASSOC);
            $name = $user_info['name'] ?? 'Delivery Staff';
            $phone = $user_info['phone'] ?? '';

            $stmt_ins = $this->pdo->prepare("INSERT INTO delivery_staff (delivery_staff_ID, user_ID, name, phone, vehicle_type, location) VALUES (?, ?, ?, ?, '', '')");
            $stmt_ins->execute([$delivery_staff_ID, $user_ID, $name, $phone]);
            return $delivery_staff_ID;
        }
        return $staff['delivery_staff_ID'];
    }
}
?>
