<?php
// backend/controllers/CommunicationController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/CommunicationModel.php';
require_once __DIR__ . '/../views/JsonView.php';

class CommunicationController extends BaseController {

    public function handleRequest($user) {
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET') {
            $this->getMessages($user);
        } elseif ($method === 'POST') {
            $this->postMessage($user);
        } else {
            JsonView::render(["error" => "Method not allowed"], 405);
        }
    }

    private function getMessages($user) {
        $job_ID = $_GET['job_ID'] ?? null;
        $get_active_chats = $_GET['get_active_chats'] ?? null;

        $model = new CommunicationModel($this->pdo);

        if ($get_active_chats) {
            $result = $model->getChats($user, $get_active_chats);
            JsonView::render($result);
        }

        if ($user->role === 'admin' || $user->role === 'manager') {
            $result = $model->getMessagesForAdmin($job_ID);
            JsonView::render($result);
        }

        $result = $model->getMessagesForUser($user, $job_ID);
        JsonView::render($result);
    }

    private function postMessage($user) {
        $data = json_decode(file_get_contents("php://input"), true);
        $model = new CommunicationModel($this->pdo);

        // Admin moderation action
        if (($user->role === 'admin' || $user->role === 'manager') && isset($data['action'])) {
            $action = $data['action'];
            $msg_ID = $data['msg_ID'] ?? null;
            $job_ID = $data['job_ID'] ?? null;

            if ($action === 'flag') {
                $reason = $data['reason'] ?? 'Flagged by admin';
                $result = $model->flagMessage($msg_ID, $job_ID, $reason);
                JsonView::render($result);
            }

            if ($action === 'unflag') {
                $result = $model->unflagMessage($msg_ID, $job_ID);
                JsonView::render($result);
            }

            if ($action === 'terminate') {
                if ($job_ID) {
                    $result = $model->terminateConversation($job_ID);
                    JsonView::render($result);
                }
            }

            JsonView::render(["error" => "Invalid admin action"]);
        }

        // Regular user sending a message
        $job_ID = $data['job_ID'] ?? null;
        $receiver_ID = $data['receiver_ID'] ?? null;
        $content = $data['content'] ?? null;

        if (!$job_ID || !$receiver_ID || !$content) {
            JsonView::render(["error" => "Missing required fields"]);
        }

        // Verify that conversation is not terminated
        if ($model->checkTerminated($job_ID)) {
            JsonView::render(["error" => "This conversation has been terminated by administrator and is closed."]);
        }

        // Check if match exists
        $match = $model->checkMatch($job_ID, $user->user_ID, $receiver_ID);
        if (!$match) {
            JsonView::render(["error" => "You can only message after a job match is established (Shortlisted or Accepted)."]);
        }

        // Check for terms violations
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
        $model->insertMessage($msg_ID, $user->user_ID, $receiver_ID, $content, $job_ID, $flagged, $flagged_reason);

        JsonView::render([
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
        ]);
    }
}
?>
