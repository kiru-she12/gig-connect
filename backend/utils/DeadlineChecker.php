<?php
// backend/utils/DeadlineChecker.php

if (!class_exists('DeadlineChecker')) {
    class DeadlineChecker {
        public static function check($pdo) {
            try {
                // Find all accepted applications for in_progress jobs
                $stmt = $pdo->prepare("
                    SELECT a.application_ID, a.job_ID, a.student_ID, 
                           j.title as job_title, j.deadline, j.job_date, j.end_time,
                           u.user_ID as student_user_id, u.name as student_name
                    FROM application a
                    JOIN job j ON a.job_ID = j.job_ID
                    JOIN student st ON a.student_ID = st.student_ID
                    JOIN users u ON st.user_ID = u.user_ID
                    WHERE a.status = 'accepted' AND j.status = 'in_progress'
                ");
                $stmt->execute();
                $apps = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (empty($apps)) {
                    return;
                }

                $now = time();

                foreach ($apps as $app) {
                    // Determine deadline timestamp
                    $deadline_str = $app['deadline'];
                    if (!empty($app['job_date']) && !empty($app['end_time'])) {
                        $deadline_str = $app['job_date'] . ' ' . $app['end_time'];
                    } elseif (!empty($app['deadline']) && strlen($app['deadline']) === 10) {
                        $deadline_str = $app['deadline'] . ' 23:59:59';
                    }

                    if (empty($deadline_str)) continue;

                    $deadline_time = strtotime($deadline_str);
                    if (!$deadline_time) continue;

                    $diff_seconds = $now - $deadline_time;

                    // Case 1: Deadline passed by 1 hour (>= 3600s) -> Notify Student to click Complete
                    if ($diff_seconds >= 3600) {
                        $chk_std = $pdo->prepare("
                            SELECT COUNT(*) FROM notification 
                            WHERE user_ID = ? AND type = 'deadline_reminder_student' AND message LIKE ?
                        ");
                        $chk_std->execute([$app['student_user_id'], "%" . $app['job_ID'] . "%"]);
                        if ($chk_std->fetchColumn() == 0) {
                            require_once __DIR__ . '/../models/NotificationModel.php';
                            NotificationModel::create(
                                $pdo,
                                $app['student_user_id'],
                                "Deadline Passed ⏰",
                                "The deadline for '" . $app['job_title'] . "' (ID: " . $app['job_ID'] . ") passed 1 hour ago. Please click 'Complete Job' in your dashboard to submit your finished work.",
                                "deadline_reminder_student",
                                "/dashboard/student/applications"
                            );
                        }
                    }

                    // Case 2: Deadline passed by 2 hours (>= 7200s) -> Notify Admin and Manager
                    if ($diff_seconds >= 7200) {
                        $chk_adm = $pdo->prepare("
                            SELECT COUNT(*) FROM notification 
                            WHERE type = 'deadline_overdue_admin' AND message LIKE ?
                        ");
                        $chk_adm->execute(["%" . $app['job_ID'] . "%"]);
                        if ($chk_adm->fetchColumn() == 0) {
                            $adm_stmt = $pdo->query("SELECT user_ID FROM users WHERE role IN ('admin', 'manager')");
                            $admin_users = $adm_stmt->fetchAll(PDO::FETCH_COLUMN);

                            require_once __DIR__ . '/../models/NotificationModel.php';
                            foreach ($admin_users as $admin_id) {
                                NotificationModel::create(
                                    $pdo,
                                    $admin_id,
                                    "Overdue Job Alert ⚠️",
                                    "Student " . $app['student_name'] . " has not marked job '" . $app['job_title'] . "' (ID: " . $app['job_ID'] . ") as completed 2 hours past deadline.",
                                    "deadline_overdue_admin",
                                    "/dashboard/admin/jobs"
                                );
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                error_log("DeadlineChecker Error: " . $e->getMessage());
            }
        }
    }
}
?>
