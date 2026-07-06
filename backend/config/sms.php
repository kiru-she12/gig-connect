<?php
class SMSService {
    private static function getSetting($key) {
        global $pdo;
        try {
            $stmt = $pdo->prepare("SELECT `value` FROM `settings` WHERE `key` = ? LIMIT 1");
            $stmt->execute([$key]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? $row['value'] : null;
        } catch (Exception $e) {
            return null;
        }
    }

    public static function send($phone, $message) {
        // Fetch API token from database
        $api_token = self::getSetting('TEXTLK_API_TOKEN');

        if (empty($api_token)) {
            error_log(date('[Y-m-d H:i:s] ') . "SMS send failed: TEXTLK_API_TOKEN not found in database settings.\n", 3, __DIR__ . '/../mail_error.log');
            return ['error' => 'SMS API token not configured'];
        }

        $sender_id = "TextLKDemo";
        $url       = "https://app.text.lk/api/v3/sms/send";

        $data = [
            "recipient" => $phone,
            "sender_id" => $sender_id,
            "message"   => $message
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $api_token,
            "Content-Type: application/json",
            "Accept: application/json"
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $result   = json_decode($response, true);

        return $result;
    }
}

// Wrapper for backward compatibility
function sendSMS($phone, $message) {
    return SMSService::send($phone, $message);
}
?>