<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../vendor/autoload.php';

if (!class_exists('Database')) {
    require_once __DIR__ . '/db.php';
}

class MailService {
    public static function send($to, $subject, $body) {
        $mail = new PHPMailer(true);

        // Fetch credentials from environment variables
        $gmail          = $_ENV['GMAIL'] ?? null;
        $gmail_password = $_ENV['GMAIL_PASSWORD'] ?? null;

        try {
            // Save a local copy of the email for verification and offline development
            $dir = __DIR__ . '/../sent_emails';
            if (!file_exists($dir)) {
                mkdir($dir, 0777, true);
            }
            $filename = $dir . '/' . time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $to) . '.html';
            $meta = "<!-- \nTo: {$to}\nSubject: {$subject}\nDate: " . date('Y-m-d H:i:s') . "\n-->\n";
            file_put_contents($filename, $meta . $body);

            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $gmail;
            $mail->Password   = $gmail_password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;
            $mail->Timeout    = 2; // Short timeout to prevent freezing if network/port is blocked

            // Bypass SSL/TLS peer verification for local XAMPP/PHP development compatibility
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                    'allow_self_signed' => true
                )
            );

            $mail->setFrom($gmail, 'GigConnect System');
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log(date('[Y-m-d H:i:s] ') . "Mail send failed to {$to}. Error: " . $mail->ErrorInfo . " | Exception: " . $e->getMessage() . "\n", 3, __DIR__ . '/../mail_error.log');
            return false;
        }
    }
}

// Wrapper for backward compatibility
function sendEmail($to, $subject, $body) {
    return MailService::send($to, $subject, $body);
}
?>