<?php
// backend/models/CommunicationModel.php
require_once __DIR__ . '/BaseModel.php';

class CommunicationModel extends BaseModel {

    public function getChats($user, $get_active_chats) {
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
        return ["success" => true, "chats" => []];
    }

    public function getMessagesForAdmin($job_ID = null) {
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

    public function getMessagesForUser($user, $job_ID = null) {
        if ($job_ID) {
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

    public function flagMessage($msg_ID, $job_ID, $reason) {
        if ($msg_ID) {
            $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 1, flagged_reason = ? WHERE msg_ID = ?");
            $stmt->execute([$reason, $msg_ID]);
        } elseif ($job_ID) {
            $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 1, flagged_reason = ? WHERE job_ID = ?");
            $stmt->execute([$reason, $job_ID]);
        }
        return ["success" => "Conversation flagged successfully"];
    }

    public function unflagMessage($msg_ID, $job_ID) {
        if ($msg_ID) {
            $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 0, flagged_reason = NULL WHERE msg_ID = ?");
            $stmt->execute([$msg_ID]);
        } elseif ($job_ID) {
            $stmt = $this->pdo->prepare("UPDATE communication SET flagged = 0, flagged_reason = NULL WHERE job_ID = ?");
            $stmt->execute([$job_ID]);
        }
        return ["success" => "Conversation unflagged successfully"];
    }

    public function terminateConversation($job_ID) {
        $stmt = $this->pdo->prepare("UPDATE communication SET status = 'terminated' WHERE job_ID = ?");
        $stmt->execute([$job_ID]);
        return ["success" => "Conversation terminated successfully"];
    }

    public function checkTerminated($job_ID) {
        $stmt = $this->pdo->prepare("SELECT status FROM communication WHERE job_ID = ? AND status = 'terminated' LIMIT 1");
        $stmt->execute([$job_ID]);
        return (bool)$stmt->fetch();
    }

    public function checkMatch($job_ID, $sender_ID, $receiver_ID) {
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
        $stmt->execute([$job_ID, $sender_ID, $sender_ID, $receiver_ID, $receiver_ID]);
        return $stmt->fetch();
    }

    public function insertMessage($msg_ID, $sender_ID, $receiver_ID, $content, $job_ID, $flagged, $flagged_reason) {
        $stmt = $this->pdo->prepare("
            INSERT INTO communication (msg_ID, sender_ID, receiver_ID, content, job_ID, flagged, flagged_reason) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$msg_ID, $sender_ID, $receiver_ID, $content, $job_ID, $flagged, $flagged_reason]);
    }
}
?>
