<?php
include 'config/db.php';

class TableDescriptor {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function describeTable($tableName) {
        try {
            $stmt = $this->pdo->query("DESCRIBE " . preg_replace('/[^a-zA-Z0-9_]/', '', $tableName));
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            return ["error" => $e->getMessage()];
        }
    }
}

$descriptor = new TableDescriptor($pdo);
$cols = $descriptor->describeTable("communication");
echo json_encode($cols, JSON_PRETTY_PRINT);
?>
