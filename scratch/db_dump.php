<?php
include __DIR__ . '/../backend/config/db.php';

echo "=== USERS (Job Providers) ===\n";
$stmt = $pdo->query("SELECT user_ID, name, email, role FROM users WHERE role = 'job_provider'");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}

echo "=== JOB PROVIDERS ===\n";
$stmt = $pdo->query("SELECT provider_ID, user_ID, business_reg_no FROM job_provider");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}

echo "=== JOBS ===\n";
$stmt = $pdo->query("SELECT job_ID, provider_ID, title, status FROM job");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
?>
