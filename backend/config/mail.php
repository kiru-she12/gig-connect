<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../vendor/autoload.php';

class MailService {
    public static function send($to, $subject, $body) {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = $_ENV['GMAIL'] ?? 'gigconnectsystem@gmail.com';
            $mail->Password = $_ENV['GMAIL_PASSWORD'] ?? 'ymfn gpzx sixs abmr';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            $mail->setFrom($_ENV['GMAIL'] ?? 'gigconnectsystem@gmail.com', 'GigConnect System');
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;

            $mail->send();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}

// Wrapper for backward compatibility
function sendEmail($to, $subject, $body) {
    return MailService::send($to, $subject, $body);
}
?>