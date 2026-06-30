<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';
include '../../config/mail.php';
include '../../config/email_templates.php';

class Application {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function updateApplicant($data, $user) {
        // only job provider can update applicants
        if($user->role !== 'job_provider') {
            return ["error" => "Unauthorized!"];
        }

        $application_ID = $data['application_ID'];
        $action = $data['action'];

        // check if application exists
        $stmt = $this->pdo->prepare("
            SELECT a.*, j.provider_ID, j.title
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            WHERE a.application_ID = ?
        ");
        $stmt->execute([$application_ID]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$application) {
            return ["error" => "Application not found!"];
        }

        // check if job belongs to this provider
        $stmt = $this->pdo->prepare("SELECT * FROM job_provider WHERE user_ID = ? AND provider_ID = ?");
        $stmt->execute([$user->user_ID, $application['provider_ID']]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$provider) {
            return ["error" => "Unauthorized!"];
        }

        $valid_actions = ['shortlist', 'accept', 'reject'];

        if(!in_array($action, $valid_actions)) {
            return ["error" => "Invalid action!"];
        }

        $status_map = [
            'shortlist' => 'shortlisted',
            'accept' => 'accepted',
            'reject' => 'rejected'
        ];

        $new_status = $status_map[$action];

        $stmt = $this->pdo->prepare("UPDATE application SET status = ? WHERE application_ID = ?");
        $stmt->execute([$new_status, $application_ID]);

        // if accepted update job status to in_progress
        if($action === 'accept') {
            $stmt = $this->pdo->prepare("UPDATE job SET status = 'in_progress', assigned_time = NOW() WHERE job_ID = ?");
            $stmt->execute([$application['job_ID']]);
        }

        // send email to student
        $stmt = $this->pdo->prepare("
            SELECT u.email, u.name
            FROM application a
            JOIN student s ON a.student_ID = s.student_ID
            JOIN users u ON s.user_ID = u.user_ID
            WHERE a.application_ID = ?
        ");
        $stmt->execute([$application_ID]);
        $student_info = $stmt->fetch(PDO::FETCH_ASSOC);

        $email_body = applicationStatusEmail(
            $student_info['name'],
            $application['title'],
            $new_status
        );
        sendEmail($student_info['email'], "GigConnect - Application Update", $email_body);

        return [
            "success" => "Application " . $new_status . " successfully!",
            "application_ID" => $application_ID,
            "status" => $new_status
        ];
    }
}

// run
$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$application = new Application($pdo);
$result = $application->updateApplicant($data, $user);
echo json_encode($result);
?>