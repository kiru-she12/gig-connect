<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include '../../config/db.php';
include '../../middleware/auth.php';

function getCategory($title, $skills) {
    $t = strtolower($title);
    $s = strtolower($skills);
    if (strpos($t, 'design') !== false || strpos($t, 'logo') !== false || strpos($t, 'poster') !== false || strpos($t, 'card') !== false || strpos($t, 'flyer') !== false || strpos($t, 'presentation') !== false || strpos($t, 'powerpoint') !== false || strpos($t, 'cv') !== false || strpos($t, 'resume') !== false || strpos($s, 'design') !== false || strpos($s, 'photoshop') !== false) {
        return 'Design';
    }
    if (strpos($t, 'data entry') !== false || strpos($t, 'excel') !== false || strpos($t, 'inventory') !== false || strpos($t, 'listing') !== false || strpos($t, 'typing') !== false || strpos($t, 'form') !== false || strpos($s, 'data entry') !== false || strpos($s, 'excel') !== false || strpos($s, 'typing') !== false) {
        return 'Data Entry';
    }
    if (strpos($t, 'photography') !== false || strpos($t, 'photographer') !== false || strpos($t, 'video') !== false || strpos($t, 'editor') !== false || strpos($t, 'vlog') !== false || strpos($t, 'reels') !== false || strpos($t, 'thumbnail') !== false || strpos($s, 'photography') !== false || strpos($s, 'video editing') !== false) {
        return 'Photography';
    }
    if (strpos($t, 'web dev') !== false || strpos($t, 'website') !== false || strpos($s, 'web dev') !== false || strpos($s, 'coding') !== false) {
        return 'Web Dev';
    }
    if (strpos($t, 'translation') !== false || strpos($t, 'translator') !== false || strpos($t, 'translate') !== false || strpos($t, 'proofreading') !== false || strpos($s, 'translation') !== false || strpos($s, 'translator') !== false) {
        return 'Translation';
    }
    if (strpos($t, 'tutor') !== false || strpos($t, 'homework') !== false || strpos($t, 'kids') !== false || strpos($t, 'academic') !== false || strpos($s, 'tutoring') !== false || strpos($s, 'maths') !== false) {
        return 'Academic & Tutoring';
    }
    return 'Local Services';
}

try {
    $user = authenticate();
    if ($user->role !== 'student') {
        echo json_encode(["error" => "Unauthorized! Only students can view their applications."]);
        exit;
    }

    // Resolve student_ID from user_ID
    $stmt_std = $pdo->prepare("SELECT student_ID FROM student WHERE user_ID = ?");
    $stmt_std->execute([$user->user_ID]);
    $student = $stmt_std->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(["error" => "Student profile not found!"]);
        exit;
    }

    $student_ID = $student['student_ID'];

    // Fetch applications with job details and provider/client details
    $stmt = $pdo->prepare("
        SELECT a.application_ID, a.job_ID, a.status, a.applied_date,
               j.title as job_title, j.payment as job_payment, j.job_type, j.description as job_description, j.deadline as job_deadline, j.status as job_status, j.skills as job_skills,
               u.name as client_name, u.user_ID as client_user_ID
        FROM application a
        JOIN job j ON a.job_ID = j.job_ID
        JOIN job_provider jp ON j.provider_ID = jp.provider_ID
        JOIN users u ON jp.user_ID = u.user_ID
        WHERE a.student_ID = ?
        ORDER BY a.applied_date DESC
    ");
    $stmt->execute([$student_ID]);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Compute dynamic categories for the analytics representation
    foreach ($applications as &$app) {
        $app['job_category'] = getCategory($app['job_title'], $app['job_skills'] ?? '');
    }

    echo json_encode([
        "success" => true,
        "applications" => $applications
    ]);

} catch (Exception $e) {
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>
