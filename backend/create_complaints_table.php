<?php
include 'config/db.php';

class ComplaintsTableMigration {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function run() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                complainer VARCHAR(255) NOT NULL,
                about VARCHAR(255) NOT NULL,
                reason VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending Review'
            )";
            $this->pdo->exec($sql);
            echo "Table 'complaints' created or already exists.\n";

            // Insert dummy data if empty
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM complaints");
            $count = $stmt->fetchColumn();
            if ($count == 0) {
                $stmt = $this->pdo->prepare("INSERT INTO complaints (complainer, about, reason, text, date, status) VALUES (?, ?, ?, ?, ?, ?)");
                
                $stmt->execute([
                    'Kirushika T. (cst23001@std.uwu.ac.lk)',
                    'uvafoods@gmail.com',
                    'Late Payment Delivery',
                    'Job was completed and marked as done on Tuesday, but payments have not been processed yet.',
                    '2026-06-12',
                    'Pending Review'
                ]);

                $stmt->execute([
                    'mpk@gmail.com',
                    'Ranjan S. (iit22055@std.uwu.ac.lk)',
                    'Unprofessional Conduct',
                    'Student missed two scheduled shifts for the lab assistant gig without prior notice.',
                    '2026-06-10',
                    'Resolved'
                ]);

                $stmt->execute([
                    'System On-Site Scheduler (Alert)',
                    'Mahazin (cst23069@std.uwu.ac.lk)',
                    'On-Site Completion Timeout',
                    'Student went to the scheduled on-site job but did not click "Job Completed" within the timeframe. SMS reminder sent to student. Escalated alert to admin/manager dashboard.',
                    '2026-06-13',
                    'Pending Review'
                ]);
                
                echo "Inserted initial complaints data.\n";
            }
        } catch (Exception $e) {
            echo "Error: " . $e->getMessage() . "\n";
        }
    }
}

$migration = new ComplaintsTableMigration($pdo);
$migration->run();
?>
