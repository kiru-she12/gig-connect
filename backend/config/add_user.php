<?php
// backend/config/add_user.php
require_once __DIR__ . '/db.php';

try {
    $email = 'angelsures07@gmail.com';
    $password = 'gowtham';
    $name = 'Gowtham';
    $role = 'student';

    $hashedPw = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("SELECT user_ID FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // Update password & status
        $stmtUpdate = $pdo->prepare("UPDATE users SET password = ?, status = 'active', is_verified = 1 WHERE email = ?");
        $stmtUpdate->execute([$hashedPw, $email]);
        echo "Updated password & status for $email\n";
    } else {
        // Insert new user
        $user_ID = 'STU007';
        $stmtIns = $pdo->prepare("INSERT INTO users (user_ID, name, email, password, role, status, is_verified) VALUES (?, ?, ?, ?, ?, 'active', 1)");
        $stmtIns->execute([$user_ID, $name, $email, $hashedPw, $role]);

        // Insert into student table
        $stmtStu = $pdo->prepare("INSERT INTO student (student_ID, user_ID, skills, year, degree, bio) VALUES (?, ?, 'Web Dev, Design', 'Year 3', 'BSc Computer Science', 'Student Developer')");
        $stmtStu->execute(['STU007', $user_ID]);

        echo "Created account for $email ($role)\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
