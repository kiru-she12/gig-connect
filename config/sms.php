<?php
function sendSMS($phone, $message) {
    $api_token = "5232|byhsjIWqg60zWCKTjUeQTceeT5HeR4x2sBnlaFO6071b592f";
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
?>