<?php
include __DIR__ . '/../backend/config/db.php';

$stmt = $pdo->query("SELECT user_ID, name, email, role, status FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users, JSON_PRETTY_PRINT);
?>
