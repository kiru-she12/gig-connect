<?php
include __DIR__ . '/../backend/config/db.php';

echo "=== JOB PROVIDERS VERIFICATION STATUS ===\n";
$stmt = $pdo->query("SELECT provider_ID, user_ID, is_verified, business_reg_no FROM job_provider");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
?>
