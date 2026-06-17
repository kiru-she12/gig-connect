<?php
class SMSService {
    public static function send($phone, $message) {
        $api_token = $_ENV['TEXTLK_API_TOKEN'] ?? '';
        
        if (empty($api_token)) {
            $envPath = __DIR__ . '/../.env';
            if (file_exists($envPath)) {
                $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    if (strpos(trim($line), '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        list($name, $value) = explode('=', $line, 2);
                        if (trim($name) === 'TEXTLK_API_TOKEN') {
                            $value = trim($value);
                            if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                                $value = substr($value, 1, -1);
                            }
                            $api_token = $value;
                            break;
                        }
                    }
                }
            }
        }
        
        if (empty($api_token)) {
            $api_token = "5337|ret9au1ImvozGuo4S304JaBXdos4UPoyWfq11IOp59030769";
        }
        
        $sender_id = "TextLKDemo";
        
        $url = "https://app.text.lk/api/v3/sms/send";
        
        $data = [
            "recipient" => $phone,
            "sender_id" => $sender_id,
            "message" => $message
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
        $result = json_decode($response, true);
        
        return $result;
    }
}

// Wrapper for backward compatibility
function sendSMS($phone, $message) {
    return SMSService::send($phone, $message);
}
?>