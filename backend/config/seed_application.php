<?php
require_once __DIR__ . '/db.php';

try {
    $student_ID = 'STU007';
    $job_ID = 'JOB001';
    $app_ID = 'APP001';

    $check = $pdo->prepare("SELECT application_ID FROM application WHERE application_ID = ?");
    $check->execute([$app_ID]);

    if (!$check->fetch()) {
        $stmt = $pdo->prepare("INSERT INTO application (application_ID, student_ID, job_ID, status, cover_letter) VALUES (?, ?, ?, 'pending', 'I am a skilled UI/UX designer and web developer. I would love to build this student portal UI!')");
        $stmt->execute([$app_ID, $student_ID, $job_ID]);
        echo "Created sample application APP001 for Gowtham\n";
    }
} catch (PDOException $e) {
    echo "App Seed Error: " . $e->getMessage() . "\n";
}
?>
