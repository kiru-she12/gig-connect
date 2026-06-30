<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

class Analytics {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAnalytics($user) {
        if($user->role !== 'admin') {
            return ["error" => "Unauthorized!"];
        }

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'student'");
        $total_students = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'job_provider'");
        $total_clients = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM job");
        $total_jobs = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM job WHERE status = 'active'");
        $active_jobs = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM job WHERE status = 'completed'");
        $completed_jobs = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM job WHERE status = 'pending'");
        $pending_jobs = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM application");
        $total_applications = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT SUM(amount) FROM payment WHERE payment_type = 'commission' AND status = 'paid'");
        $total_revenue = $stmt->fetchColumn() ?? 0;

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM delivery");
        $total_deliveries = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM delivery WHERE status = 'delivered'");
        $completed_deliveries = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE status = 'banned'");
        $banned_users = $stmt->fetchColumn();

        $stmt = $this->pdo->query("SELECT job_ID, title, status, created_at FROM job ORDER BY created_at DESC LIMIT 5");
        $recent_jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            "success" => true,
            "analytics" => [
                "users" => [
                    "total_students" => $total_students,
                    "total_clients" => $total_clients,
                    "banned_users" => $banned_users
                ],
                "jobs" => [
                    "total_jobs" => $total_jobs,
                    "active_jobs" => $active_jobs,
                    "pending_jobs" => $pending_jobs,
                    "completed_jobs" => $completed_jobs
                ],
                "applications" => [
                    "total_applications" => $total_applications
                ],
                "revenue" => [
                    "total_revenue" => $total_revenue
                ],
                "deliveries" => [
                    "total_deliveries" => $total_deliveries,
                    "completed_deliveries" => $completed_deliveries
                ],
                "recent_jobs" => $recent_jobs
            ]
        ];
    }
}

// run
$user = authenticate();
$analytics = new Analytics($pdo);
$result = $analytics->getAnalytics($user);
echo json_encode($result);
?>