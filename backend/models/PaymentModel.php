<?php
// backend/models/PaymentModel.php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/email_templates.php';

class PaymentModel extends BaseModel {

    public function confirm($data, $user) {
        if ($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized! Only admins or managers can confirm payments."];
        }

        if (empty($data['payment_ID'])) {
            return ["error" => "Payment ID is required."];
        }

        $payment_ID = $data['payment_ID'];
        $action = $data['action'] ?? 'confirm';

        $stmt = $this->pdo->prepare("SELECT * FROM payment WHERE payment_ID = ?");
        $stmt->execute([$payment_ID]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$payment) {
            return ["error" => "Payment record not found!"];
        }

        if ($payment['status'] !== 'pending') {
            return ["error" => "Payment is already processed. Current status: " . $payment['status']];
        }

        $new_status = ($action === 'reject') ? 'failed' : 'paid';

        $stmt_update = $this->pdo->prepare("UPDATE payment SET status = ? WHERE payment_ID = ?");
        $stmt_update->execute([$new_status, $payment_ID]);

        if ($action === 'confirm' && $payment['payment_type'] === 'boost') {
            $stmt_job = $this->pdo->prepare("UPDATE job SET is_boosted = 1 WHERE job_ID = ?");
            $stmt_job->execute([$payment['job_ID']]);
        }

        if ($action === 'confirm' && $payment['payment_type'] === 'commission') {
            $job_ID = $payment['job_ID'];

            // Update job to paid
            $stmt_job = $this->pdo->prepare("UPDATE job SET payment_status = 'paid' WHERE job_ID = ?");
            $stmt_job->execute([$job_ID]);

            // Find all applications in 'pending_payment' status for this job
            $stmt = $this->pdo->prepare("
                SELECT a.application_ID, u.email, u.name, j.title
                FROM application a
                JOIN student s ON a.student_ID = s.student_ID
                JOIN users u ON s.user_ID = u.user_ID
                JOIN job j ON a.job_ID = j.job_ID
                WHERE a.job_ID = ? AND a.status = 'pending_payment'
            ");
            $stmt->execute([$job_ID]);
            $pending_apps = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($pending_apps) > 0) {
                // Update applications to 'accepted'
                $stmt = $this->pdo->prepare("UPDATE application SET status = 'accepted' WHERE job_ID = ? AND status = 'pending_payment'");
                $stmt->execute([$job_ID]);

                // Update job status to 'in_progress'
                $stmt = $this->pdo->prepare("UPDATE job SET status = 'in_progress', assigned_time = NOW() WHERE job_ID = ?");
                $stmt->execute([$job_ID]);

                // Send email notifications to students
                foreach ($pending_apps as $app) {
                    $email_body = applicationStatusEmail(
                        $app['name'],
                        $app['title'],
                        'accepted'
                    );
                    sendEmail($app['email'], "GigConnect - Application Update", $email_body);
                }
            }
        }

        return [
            "success" => "Payment status updated to '{$new_status}' successfully!",
            "payment_ID" => $payment_ID,
            "status" => $new_status
        ];
    }

    public function createCommission($data, $user) {
        if ($user->role !== 'job_provider') {
            return ["error" => "Unauthorized! Only job providers can generate commission payments."];
        }

        if (empty($data['job_ID'])) {
            return ["error" => "Job ID is required."];
        }

        $job_ID = $data['job_ID'];

        $stmt_prov = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
        $stmt_prov->execute([$user->user_ID]);
        $provider_ID = $stmt_prov->fetchColumn();

        if (!$provider_ID) {
            return ["error" => "Job provider profile not found!"];
        }

        $stmt_job = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = ?");
        $stmt_job->execute([$job_ID, $provider_ID]);
        $job = $stmt_job->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            return ["error" => "Job not found or does not belong to this provider!"];
        }

        $stmt_check = $this->pdo->prepare("SELECT * FROM payment WHERE job_ID = ? AND payment_type = 'commission'");
        $stmt_check->execute([$job_ID]);
        $existing = $stmt_check->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            return [
                "success" => "Commission record already exists.",
                "payment_ID" => $existing['payment_ID'],
                "amount" => floatval($existing['amount']),
                "status" => $existing['status']
            ];
        }

        $amount = floatval($job['payment']) * 0.05;

        $payment_ID = $this->generateNextID('payment', 'payment_ID', 'PAY');

        $stmt_insert = $this->pdo->prepare("
            INSERT INTO payment (payment_ID, job_ID, provider_ID, amount, payment_type, status, created_at)
            VALUES (?, ?, ?, ?, 'commission', 'pending', NOW())
        ");
        $stmt_insert->execute([$payment_ID, $job_ID, $provider_ID, $amount]);

        return [
            "success" => "Commission recorded successfully!",
            "payment_ID" => $payment_ID,
            "amount" => round($amount, 2),
            "status" => "pending"
        ];
    }

    public function createBoost($data, $user) {
        if ($user->role !== 'job_provider') {
            return ["error" => "Unauthorized! Only job providers can request job boosts."];
        }

        if (empty($data['job_ID'])) {
            return ["error" => "Job ID is required."];
        }

        $job_ID = $data['job_ID'];
        $amount = 300.00;

        $stmt_prov = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
        $stmt_prov->execute([$user->user_ID]);
        $provider_ID = $stmt_prov->fetchColumn();

        if (!$provider_ID) {
            return ["error" => "Job provider profile not found!"];
        }

        $stmt_job = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = ?");
        $stmt_job->execute([$job_ID, $provider_ID]);
        $job = $stmt_job->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            return ["error" => "Job not found or does not belong to this provider!"];
        }

        $stmt_check = $this->pdo->prepare("SELECT * FROM payment WHERE job_ID = ? AND payment_type = 'boost' AND status != 'failed'");
        $stmt_check->execute([$job_ID]);
        $existing = $stmt_check->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            return [
                "success" => "Boost payment already recorded.",
                "payment_ID" => $existing['payment_ID'],
                "amount" => floatval($existing['amount']),
                "status" => $existing['status']
            ];
        }

        $payment_ID = $this->generateNextID('payment', 'payment_ID', 'PAY');

        $stmt_insert = $this->pdo->prepare("
            INSERT INTO payment (payment_ID, job_ID, provider_ID, amount, payment_type, status, created_at)
            VALUES (?, ?, ?, ?, 'boost', 'pending', NOW())
        ");
        $stmt_insert->execute([$payment_ID, $job_ID, $provider_ID, $amount]);

        return [
            "success" => "Boost payment requested successfully!",
            "payment_ID" => $payment_ID,
            "amount" => $amount,
            "status" => "pending"
        ];
    }

    public function getPayments($filters, $user) {
        $payment_type = $filters['payment_type'] ?? null;
        $status = $filters['status'] ?? null;

        $query = "SELECT * FROM payment WHERE 1=1";
        $params = [];

        if ($user->role === 'job_provider') {
            $stmt_prov = $this->pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
            $stmt_prov->execute([$user->user_ID]);
            $provider_ID = $stmt_prov->fetchColumn();

            if (!$provider_ID) {
                return ["error" => "Job provider profile not found!"];
            }

            $query .= " AND provider_ID = ?";
            $params[] = $provider_ID;
        } else if ($user->role !== 'admin' && $user->role !== 'manager') {
            return ["error" => "Unauthorized! You do not have permission to view payment records."];
        }

        if ($payment_type) {
            $query .= " AND payment_type = ?";
            $params[] = $payment_type;
        }

        if ($status) {
            $query .= " AND status = ?";
            $params[] = $status;
        }

        $query .= " ORDER BY created_at DESC";

        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($payments as &$pay) {
            $pay['amount'] = floatval($pay['amount']);
        }

        return [
            "success" => true,
            "payments" => $payments
        ];
    }
}
?>
