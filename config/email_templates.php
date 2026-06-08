<?php
function welcomeEmail($name) {
    return "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;'>
            <h1 style='color: white; margin: 0;'>GigConnect</h1>
            <p style='color: #C7D2FE; margin: 5px 0;'>Uva Wellassa University</p>
        </div>
        <div style='background-color: #ffffff; padding: 30px; border: 1px solid #E5E7EB;'>
            <h2 style='color: #4F46E5;'>Welcome to GigConnect!</h2>
            <p>Dear $name,</p>
            <p>Thank you for registering on GigConnect — the official job platform for UWU students.</p>
            <p>You can now browse and apply for flexible part-time jobs that match your skills and schedule!</p>
            <div style='background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                <p style='margin: 0; color: #6B7280;'>If you did not create this account, please ignore this email.</p>
            </div>
        </div>
        <div style='background-color: #F9FAFB; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB;'>
            <p style='color: #9CA3AF; font-size: 12px; margin: 0;'>GigConnect System &copy; 2026 | Sri Lanka</p>
        </div>
    </div>";
}

function otpEmail($name, $otp) {
    return "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;'>
            <h1 style='color: white; margin: 0;'>GigConnect</h1>
            <p style='color: #C7D2FE; margin: 5px 0;'>Uva Wellassa University</p>
        </div>
        <div style='background-color: #ffffff; padding: 30px; border: 1px solid #E5E7EB;'>
            <h2 style='color: #4F46E5;'>OTP Verification</h2>
            <p>Dear $name,</p>
            <p>Thank you for registering on GigConnect. Please use the following One-Time Password (OTP) to complete your verification:</p>
            <div style='background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                <h1 style='color: #4F46E5; letter-spacing: 10px; margin: 0;'>$otp</h1>
            </div>
            <p style='color: #6B7280;'>This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
        <div style='background-color: #F9FAFB; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB;'>
            <p style='color: #9CA3AF; font-size: 12px; margin: 0;'>GigConnect System &copy; 2026 | Sri Lanka</p>
        </div>
    </div>";
}

function applicationStatusEmail($name, $job_title, $status) {
    $status_color = [
        'shortlisted' => '#F59E0B',
        'accepted' => '#10B981',
        'rejected' => '#EF4444'
    ];

    $color = $status_color[$status] ?? '#4F46E5';

    return "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;'>
            <h1 style='color: white; margin: 0;'>GigConnect</h1>
            <p style='color: #C7D2FE; margin: 5px 0;'>Uva Wellassa University</p>
        </div>
        <div style='background-color: #ffffff; padding: 30px; border: 1px solid #E5E7EB;'>
            <h2 style='color: #4F46E5;'>Application Update</h2>
            <p>Dear $name,</p>
            <p>Your application for <strong>$job_title</strong> has been updated.</p>
            <div style='background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                <h2 style='color: $color; margin: 0; text-transform: uppercase;'>$status</h2>
            </div>
            <p style='color: #6B7280;'>Login to GigConnect to view more details.</p>
        </div>
        <div style='background-color: #F9FAFB; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB;'>
            <p style='color: #9CA3AF; font-size: 12px; margin: 0;'>GigConnect System &copy; 2026 | Sri Lanka</p>
        </div>
    </div>";
}

function deliveryOtpEmail($name, $otp, $job_title) {
    return "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;'>
            <h1 style='color: white; margin: 0;'>GigConnect</h1>
            <p style='color: #C7D2FE; margin: 5px 0;'>Uva Wellassa University</p>
        </div>
        <div style='background-color: #ffffff; padding: 30px; border: 1px solid #E5E7EB;'>
            <h2 style='color: #4F46E5;'>Delivery OTP</h2>
            <p>Dear $name,</p>
            <p>Your delivery OTP for <strong>$job_title</strong> is:</p>
            <div style='background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                <h1 style='color: #4F46E5; letter-spacing: 10px; margin: 0;'>$otp</h1>
            </div>
            <p style='color: #6B7280;'>Share this OTP with the delivery staff to confirm pickup. If you did not request this, please contact support.</p>
        </div>
        <div style='background-color: #F9FAFB; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB;'>
            <p style='color: #9CA3AF; font-size: 12px; margin: 0;'>GigConnect System &copy; 2026 | Sri Lanka</p>
        </div>
    </div>";
}

function approvalEmail($name, $role) {
    return "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;'>
            <h1 style='color: white; margin: 0;'>GigConnect</h1>
            <p style='color: #C7D2FE; margin: 5px 0;'>Uva Wellassa University</p>
        </div>
        <div style='background-color: #ffffff; padding: 30px; border: 1px solid #E5E7EB;'>
            <h2 style='color: #10B981;'>Account Approved! ✅</h2>
            <p>Dear $name,</p>
            <p>Your GigConnect account has been approved by our admin team!</p>
            <p>You can now login and start using the platform as a <strong>$role</strong>.</p>
            <div style='background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                <p style='margin: 0; color: #6B7280;'>Login at: <a href='http://localhost/gigConnect'>GigConnect</a></p>
            </div>
        </div>
        <div style='background-color: #F9FAFB; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB;'>
            <p style='color: #9CA3AF; font-size: 12px; margin: 0;'>GigConnect System &copy; 2026 | Sri Lanka</p>
        </div>
    </div>";
}
?>