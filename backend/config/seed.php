<?php
// backend/config/seed.php
require_once __DIR__ . '/db.php';

try {
    $hashedAdminPw = password_hash('admin123', PASSWORD_BCRYPT);
    $hashedClientPw = password_hash('client123', PASSWORD_BCRYPT);
    $hashedStudentPw = password_hash('student123', PASSWORD_BCRYPT);

    // 1. Admin
    $stmt = $pdo->prepare("SELECT user_ID FROM users WHERE email = ?");
    $stmt->execute(['admin@gigconnect.com']);
    if (!$stmt->fetch()) {
        $stmtIns = $pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status, is_verified) VALUES ('ADM001', 'System Admin', 'admin@gigconnect.com', ?, 'admin', 'active', 1)");
        $stmtIns->execute([$hashedAdminPw]);
        echo "Created admin account (admin@gigconnect.com / admin123)\n";
    }

    // 2. Client / Job Provider
    $stmt->execute(['client@gigconnect.com']);
    if (!$stmt->fetch()) {
        $stmtIns = $pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status, is_verified) VALUES ('CLI001', 'Demo Client', 'client@gigconnect.com', ?, 'job_provider', 'active', 1)");
        $stmtIns->execute([$hashedClientPw]);

        $stmtClient = $pdo->prepare("INSERT INTO job_provider (provider_ID, user_ID, nic, is_verified) VALUES ('CLI001', 'CLI001', '123456789V', 1)");
        $stmtClient->execute();
        echo "Created client account (client@gigconnect.com / client123)\n";
    }

    // 3. Student
    $stmt->execute(['student@std.uwu.ac.lk']);
    if (!$stmt->fetch()) {
        $stmtIns = $pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status, is_verified) VALUES ('STU001', 'Demo Student', 'student@std.uwu.ac.lk', ?, 'student', 'active', 1)");
        $stmtIns->execute([$hashedStudentPw]);

        $stmtStudent = $pdo->prepare("INSERT INTO student (student_ID, user_ID, skills, year, degree, bio) VALUES ('STU001', 'STU001', 'Web Dev, Design', 'Year 3', 'BSc Computer Science', 'Passionate UWU student developer')");
        $stmtStudent->execute();
        echo "Created student account (student@std.uwu.ac.lk / student123)\n";
    }

    echo "Seeding completed successfully!\n";

} catch (PDOException $e) {
    echo "Seeding Error: " . $e->getMessage() . "\n";
}
?>
