<?php
include 'config/sms.php';

$result = sendSMS("94757825845", "Test OTP from GigConnect: 123456");
echo json_encode($result);
?>