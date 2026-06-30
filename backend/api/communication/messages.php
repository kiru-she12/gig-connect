<?php
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json");
include '../../config/db.php';
include '../../middleware/auth.php';

class MessageController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest($user) {
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET') {
            return $this->getMessages($user);
        } elseif ($method === 'POST') {
            return $this->postMessage($user);
        } else {
            return ["error" => "Method not allowed"];
        }
    }

    private function getMessages($user) {
        $job_ID = $_GET['job_ID'] ?? null;
        $get_active_chats = $_GET['get_active_chats'] ?? null;

        if ($get_active_chats) {
            // Return list of matches that are eligible for chat
            if ($user->role === 'student') {
                $stmt = $this->pdo->prepare("
                    SELECT DISTINCT a.job_ID, j.title as job_title, a.status as application_status,
                           u.user_ID as partner_user_ID, u.name as partner_name, u.role as partner_role
                    FROM application a
                    JOIN job j ON a.job_ID = j.job_ID
                    JOIN job_provider jp ON j.provider_ID = jp.provider_ID
                    JOIN users u ON jp.user_ID = u.user_ID
                    JOIN student s ON a.student_ID = s.student_ID
                    WHERE s.user_ID = ? AND a.status IN ('accepted', 'shortlisted')
                ");
                $stmt->execute([$user->user_ID]);
                return ["success" => true, "chats" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            } elseif ($user->role === 'job_provider' || $user->role === 'client') {
                $stmt = $this->pdo->prepare("
                    SELECT DISTINCT a.job_ID, j.title as job_title, a.status as application_status,
                           u.user_ID as partner_user_ID, u.name as partner_name, u.role as partner_role
                    FROM application a
                    JOIN job j ON a.job_ID = j.job_ID
                    JOIN job_provider jp ON j.provider_ID = jp.provider_ID
                    JOIN student s ON a.student_ID = s.student_ID
                    JOIN users u ON s.user_ID = u.user_ID
                    WHERE jp.user_ID = ? AND a.status IN ('accepted', 'shortlisted')
                ");
                $stmt->execute([$user->user_ID]);
                return ["success" => true, "chats" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            }
        }

        // If admin or manager, they can view all conversations or specific ones
        if ($user->role === 'admin' || $user->role === 'manager') {
            if ($job_ID) {
                $stmt = $this->pdo->prepare("
                    SELECT c.*, u1.name as sender_name, u2.name as receiver_name 
                    FROM communication c
                    JOIN users u1 ON c.sender_ID = u1.user_ID
                    JOIN users u2 ON c.receiver_ID = u2.user_ID
                    WHERE c.job_ID = ?
                    ORDER BY c.timestamp ASC
                ");
                $stmt->execute([$job_ID]);
            } else {
                $stmt = $this->pdo->prepare("
                    SELECT c.*, u1.name as sender_name, u2.name as receiver_name, j.title as job_title
                    FROM communication c
                    JOIN users u1 ON c.sender_ID = u1.user_ID
                    JOIN users u2 ON c.receiver_ID = u2.user_ID
                    LEFT JOIN job j ON c.job_ID = j.job_ID
                    ORDER BY c.timestamp DESC
                ");
                $stmt->execute();
            }
            return ["success" => true, "messages" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        }

        // For student or job provider
        if ($job_ID) {
            // Fetch messages for a specific job chat
            $stmt = $this->pdo->prepare("
                SELECT c.*, u1.name as sender_name, u2.name as receiver_name 
                FROM communication c
                JOIN users u1 ON c.sender_ID = u1.user_ID
                JOIN users u2 ON c.receiver_ID = u2.user_ID
                WHERE c.job_ID = ? AND (c.sender_ID = ? OR c.receiver_ID = ?)
                ORDER BY c.timestamp ASC
            ");
            $stmt->execute([$job_ID, $user->user_ID, $user->user_ID]);
            return ["success" => true, "messages" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } else {
            // Fetch active conversations list
            $stmt = $this->pdo->prepare("
                SELECT c.*, u1.name as sender_name, u2.name as receiver_name, j.title as job_title
                FROM communication c
                JOIN users u1 ON c.sender_ID = u1.user_ID
                JOIN users u2 ON c.receiver_ID = u2.user_ID
                LEFT JOIN job j ON c.job_ID = j.job_ID
                WHERE c.sender_ID = ? OR c.receiver_ID = ?
                ORDER BY c.timestamp DESC
            ");
            $stmt->execute([$user->user_ID, $user->user_ID]);
            return ["success" => true, "messages" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        }
    }

    private function postMessage($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Admin moderation action
        if (($user->role === 'admin' || $user->role === 'manager') && isset($data['action'])) {
            $action = $data['action'];
            $msg_ID = $data['msg_ID'] ?? null;
            $job_ID = $data['job_ID'] ?? null;

            if ($action === 'flag') {
                $reason = $data['reason'] ?? 'Flagged by admin';
                if ($msg_ID) {
                    $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 1, flagged_reason = ? WHERE msg_ID = ?");
                    $stmt->execute([$reason, $msg_ID]);
                } elseif ($job_ID) {
                    $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 1, flagged_reason = ? WHERE job_ID = ?");
                    $stmt->execute([$reason, $job_ID]);
                }
                return ["success" => "Conversation flagged successfully"];
            }

            if ($action === 'unflag') {
                if ($msg_ID) {
                    $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 0, flagged_reason = NULL WHERE msg_ID = ?");
                    $stmt->execute([$msg_ID]);
                } elseif ($job_ID) {
                    $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 0, flagged_reason = NULL WHERE job_ID = ?");
                    $stmt->execute([$job_ID]);
                }
                return ["success" => "Conversation unflagged successfully"];
            }

            if ($action === 'terminate') {
                if ($job_ID) {
                    $stmt = $this->pdo->prepare("UPDATE communication SET status = 'terminated' WHERE job_ID = ?");
                    $stmt->execute([$job_ID]);
                    return ["success" => "Conversation terminated successfully"];
                }
            }

            return ["error" => "Invalid admin action"];
        }

        // Regular user sending a message
        $job_ID = $data['job_ID'] ?? null;
        $receiver_ID = $data['receiver_ID'] ?? null;
        $content = $data['content'] ?? null;

        if (!$job_ID || !$receiver_ID || !$content) {
            return ["error" => "Missing required fields"];
        }

        // Verify that conversation is not terminated
        $stmt = $this->pdo->prepare("SELECT status FROM communication WHERE job_ID = ? AND status = 'terminated' LIMIT 1");
        $stmt->execute([$job_ID]);
        if ($stmt->fetch()) {
            return ["error" => "This conversation has been terminated by administrator and is closed."];
        }

        // Check if there is an accepted/shortlisted match between student and job provider
        // Let's resolve student_ID from user_ID or provider_ID from user_ID
        $stmt = $this->pdo->prepare("
            SELECT a.application_ID, a.status 
            FROM application a
            JOIN student s ON a.student_ID = s.student_ID
            JOIN job j ON a.job_ID = j.job_ID
            JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            WHERE a.job_ID = ? 
              AND (s.user_ID = ? OR jp.user_ID = ?)
              AND (s.user_ID = ? OR jp.user_ID = ?)
              AND a.status IN ('accepted', 'shortlisted')
        ");
        $stmt->execute([$job_ID, $user->user_ID, $user->user_ID, $receiver_ID, $receiver_ID]);
        $match = $stmt->fetch();

        if (!$match) {
            return ["error" => "You can only message after a job match is established (Shortlisted or Accepted)."];
        }

        // Check for terms violations (off-platform contact attempts: phone numbers, email, "payout", "whatsapp", "direct pay")
        $flagged = 0;
        $flagged_reason = null;
        $lower_content = strtolower($content);

        $violating_words = ['whatsapp', 'viber', 'telegram', 'direct pay', 'bank transfer', 'bank account', 'phone number', 'contact me', 'call me', 'mobile number', 'payout outside', 'offplatform', 'off-platform'];
        foreach ($violating_words as $word) {
            if (strpos($lower_content, $word) !== false) {
                $flagged = 1;
                $flagged_reason = "System Flag: Detected potential off-platform payment/communication keywords ('$word').";
                break;
            }
        }

        // Also detect email or phone number patterns
        if (preg_match('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/i', $content) || preg_match('/\b\d{9,11}\b/', $content)) {
            $flagged = 1;
            $flagged_reason = "System Flag: Detected email address or phone number pattern.";
        }

        // Generate msg_ID
        $msg_ID = 'MSG' . uniqid();

        // Insert message
        $stmt = $this->pdo->prepare("
            INSERT INTO communication (msg_ID, sender_ID, receiver_ID, content, job_ID, flagged, flagged_reason) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$msg_ID, $user->user_ID, $receiver_ID, $content, $job_ID, $flagged, $flagged_reason]);

        return [
            "success" => "Message sent successfully",
            "message" => [
                "msg_ID" => $msg_ID,
                "sender_ID" => $user->user_ID,
                "receiver_ID" => $receiver_ID,
                "content" => $content,
                "job_ID" => $job_ID,
                "flagged" => $flagged,
                "flagged_reason" => $flagged_reason,
                "timestamp" => date('Y-m-d H:i:s')
            ]
        ];
    }
}

$user = authenticate();
$controller = new MessageController($pdo);
$response = $controller->handleRequest($user);
echo json_encode($response);
?>
