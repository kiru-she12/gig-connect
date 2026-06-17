<?php
include 'backend/config/db.php';

function describe($pdo, $tbl) {
    echo "=== DESCRIBE $tbl ===\n";
    try {
        $stmt = $pdo->query("DESCRIBE `$tbl`");
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            print_r($row);
        }
    } catch(Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

describe($pdo, 'job');
describe($pdo, 'application');
describe($pdo, 'delivery');
?>
