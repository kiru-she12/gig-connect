<?php
include __DIR__ . '/../backend/config/db.php';
try {
    // Add gender column to student table
    $pdo->exec("ALTER TABLE student ADD COLUMN gender VARCHAR(20) DEFAULT NULL AFTER year");
    echo "Column added successfully!\n";
} catch (PDOException $e) {
    echo "Error or column already exists: " . $e->getMessage() . "\n";
}
?>
