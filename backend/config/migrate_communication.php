<?php
// backend/config/migrate_communication.php
require_once __DIR__ . '/db.php';

try {
    echo "Updating communication table schema...\n";

    $columnsToAdd = [
        "job_ID" => "VARCHAR(50) NULL",
        "is_read" => "TINYINT(1) DEFAULT 0",
        "is_deleted" => "TINYINT(1) DEFAULT 0",
        "flagged" => "TINYINT(1) DEFAULT 0",
        "flagged_reason" => "TEXT NULL",
        "attachment_url" => "VARCHAR(255) NULL",
        "attachment_type" => "VARCHAR(50) NULL",
        "created_at" => "DATETIME DEFAULT CURRENT_TIMESTAMP",
        "updated_at" => "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];

    foreach ($columnsToAdd as $col => $definition) {
        $checkStmt = $pdo->query("SHOW COLUMNS FROM communication LIKE '$col'");
        if ($checkStmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE communication ADD COLUMN $col $definition");
            echo "Added column $col to communication table.\n";
        } else {
            echo "Column $col already exists.\n";
        }
    }

    // Indexes
    $indexes = [
        "idx_comm_sender" => "sender_ID",
        "idx_comm_receiver" => "receiver_ID",
        "idx_comm_job" => "job_ID",
        "idx_comm_created" => "created_at",
        "idx_comm_read" => "is_read"
    ];

    foreach ($indexes as $idxName => $colName) {
        $idxCheck = $pdo->query("SHOW INDEX FROM communication WHERE Key_name = '$idxName'");
        if ($idxCheck->rowCount() == 0) {
            $pdo->exec("ALTER TABLE communication ADD INDEX $idxName ($colName)");
            echo "Added index $idxName.\n";
        }
    }

    echo "Migration completed successfully!\n";
} catch (PDOException $e) {
    echo "Migration Error: " . $e->getMessage() . "\n";
}
?>
