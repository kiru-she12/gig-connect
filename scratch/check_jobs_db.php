<?php
include __DIR__ . '/../backend/config/db.php';

$stmt = $pdo->query("SELECT job_ID, title, status, provider_ID FROM job");
$jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($jobs, JSON_PRETTY_PRINT);
?>
