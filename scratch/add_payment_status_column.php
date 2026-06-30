<?php
include 'backend/config/db.php';

try {
    $pdo->exec("ALTER TABLE job ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid'");
    echo "Successfully added payment_status column to job table.\n";
} catch (Exception $e) {
    echo "Column may already exist: " . $e->getMessage() . "\n";
}
?>
