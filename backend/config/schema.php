<?php
// backend/config/schema.php
require_once __DIR__ . '/db.php';

try {
    // 1. users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        user_ID VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(30) NULL,
        role ENUM('student', 'job_provider', 'admin', 'manager', 'delivery_staff') NOT NULL,
        status ENUM('pending', 'active', 'banned') DEFAULT 'active',
        is_verified TINYINT(1) DEFAULT 0,
        otp VARCHAR(10) NULL,
        otp_expiry DATETIME NULL,
        profile_pic VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 2. student table
    $pdo->exec("CREATE TABLE IF NOT EXISTS student (
        student_ID VARCHAR(50) PRIMARY KEY,
        user_ID VARCHAR(50) NOT NULL,
        skills TEXT NULL,
        year VARCHAR(50) NULL,
        degree VARCHAR(150) NULL,
        bio TEXT NULL,
        languages TEXT NULL,
        rating DECIMAL(3,2) DEFAULT 0.00,
        preference VARCHAR(50) DEFAULT 'both',
        is_delivery_available TINYINT(1) DEFAULT 0,
        gender VARCHAR(20) NULL,
        FOREIGN KEY (user_ID) REFERENCES users(user_ID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $stuCols = ['rating' => "DECIMAL(3,2) DEFAULT 0.00", 'preference' => "VARCHAR(50) DEFAULT 'both'", 'is_delivery_available' => "TINYINT(1) DEFAULT 0", 'gender' => "VARCHAR(20) NULL"];
    foreach ($stuCols as $col => $def) {
        $check = $pdo->query("SHOW COLUMNS FROM student LIKE '$col'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE student ADD COLUMN $col $def");
        }
    }

    // 3. job_provider table
    $pdo->exec("CREATE TABLE IF NOT EXISTS job_provider (
        provider_ID VARCHAR(50) PRIMARY KEY,
        user_ID VARCHAR(50) NOT NULL,
        nic VARCHAR(50) NULL,
        business_reg_no VARCHAR(100) NULL,
        type VARCHAR(50) NULL,
        is_verified TINYINT(1) DEFAULT 0,
        address TEXT NULL,
        latitude DECIMAL(10,8) NULL,
        longitude DECIMAL(11,8) NULL,
        FOREIGN KEY (user_ID) REFERENCES users(user_ID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 4. delivery_staff table
    $pdo->exec("CREATE TABLE IF NOT EXISTS delivery_staff (
        delivery_staff_ID VARCHAR(50) PRIMARY KEY,
        user_ID VARCHAR(50) NOT NULL,
        name VARCHAR(100) NULL,
        phone VARCHAR(30) NULL,
        vehicle_type VARCHAR(50) NULL,
        location VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'available',
        latitude DECIMAL(10,8) NULL,
        longitude DECIMAL(11,8) NULL,
        FOREIGN KEY (user_ID) REFERENCES users(user_ID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 5. job table
    $pdo->exec("CREATE TABLE IF NOT EXISTS job (
        job_ID VARCHAR(50) PRIMARY KEY,
        provider_ID VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        address TEXT NULL,
        skills TEXT NULL,
        payment DECIMAL(10,2) NOT NULL,
        payment_status ENUM('pending', 'paid') DEFAULT 'pending',
        job_type ENUM('onsite', 'remote') NOT NULL,
        deadline DATE NOT NULL,
        status ENUM('pending', 'active', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        seekers_needed INT DEFAULT 1,
        job_date DATE NULL,
        start_time TIME NULL,
        end_time TIME NULL,
        is_product_based TINYINT(1) DEFAULT 0,
        is_boosted TINYINT(1) DEFAULT 0,
        assigned_time DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 6. application table
    $pdo->exec("CREATE TABLE IF NOT EXISTS application (
        application_ID VARCHAR(50) PRIMARY KEY,
        student_ID VARCHAR(50) NOT NULL,
        job_ID VARCHAR(50) NOT NULL,
        status ENUM('pending', 'shortlisted', 'accepted', 'rejected', 'pending_payment') DEFAULT 'pending',
        cover_letter TEXT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivery_needed TINYINT(1) DEFAULT 0,
        FOREIGN KEY (student_ID) REFERENCES student(student_ID) ON DELETE CASCADE,
        FOREIGN KEY (job_ID) REFERENCES job(job_ID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $appCols = ['applied_date' => "DATETIME DEFAULT CURRENT_TIMESTAMP", 'delivery_needed' => "TINYINT(1) DEFAULT 0", 'cover_letter' => "TEXT NULL"];
    foreach ($appCols as $col => $def) {
        $check = $pdo->query("SHOW COLUMNS FROM application LIKE '$col'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE application ADD COLUMN $col $def");
        }
    }

    // 7. recommendation table
    $pdo->exec("CREATE TABLE IF NOT EXISTS recommendation (
        recommendation_ID VARCHAR(50) PRIMARY KEY,
        student_ID VARCHAR(50) NOT NULL,
        job_ID VARCHAR(50) NOT NULL,
        match_score DECIMAL(5,4) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 8. communication table
    $pdo->exec("CREATE TABLE IF NOT EXISTS communication (
        message_ID INT AUTO_INCREMENT PRIMARY KEY,
        sender_ID VARCHAR(50) NOT NULL,
        receiver_ID VARCHAR(50) NOT NULL,
        job_ID VARCHAR(50) NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        flagged TINYINT(1) DEFAULT 0,
        flagged_reason TEXT NULL,
        attachment_url VARCHAR(255) NULL,
        attachment_type VARCHAR(50) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 9. notification table
    $pdo->exec("CREATE TABLE IF NOT EXISTS notification (
        notification_ID VARCHAR(50) PRIMARY KEY,
        user_ID VARCHAR(50) NOT NULL,
        title VARCHAR(255) NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'unread',
        type VARCHAR(50) DEFAULT 'general',
        target_url VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $notifCols = ['status' => "VARCHAR(50) DEFAULT 'unread'", 'title' => "VARCHAR(255) NULL", 'target_url' => "VARCHAR(255) NULL"];
    foreach ($notifCols as $col => $def) {
        $check = $pdo->query("SHOW COLUMNS FROM notification LIKE '$col'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE notification ADD COLUMN $col $def");
        }
    }

    // 10. payment table
    $pdo->exec("CREATE TABLE IF NOT EXISTS payment (
        payment_ID VARCHAR(50) PRIMARY KEY,
        job_ID VARCHAR(50) NULL,
        provider_ID VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        commission DECIMAL(10,2) DEFAULT 0.00,
        payment_type VARCHAR(50) DEFAULT 'job_payment',
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        transaction_ref VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 11. rate_review table
    $pdo->exec("CREATE TABLE IF NOT EXISTS rate_review (
        rating_ID VARCHAR(50) PRIMARY KEY,
        job_ID VARCHAR(50) NOT NULL,
        given_by VARCHAR(50) NOT NULL,
        given_to VARCHAR(50) NOT NULL,
        score DECIMAL(3,1) NOT NULL,
        review TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 12. delivery table
    $pdo->exec("CREATE TABLE IF NOT EXISTS delivery (
        delivery_ID VARCHAR(50) PRIMARY KEY,
        job_ID VARCHAR(50) NOT NULL,
        sender_std_ID VARCHAR(50) NULL,
        user_ID VARCHAR(50) NULL,
        delivery_staff_ID VARCHAR(50) NULL,
        delivery_person_ID VARCHAR(50) NULL,
        pickup_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        item_description TEXT NULL,
        delivery_type VARCHAR(50) DEFAULT 'self',
        status ENUM('pending', 'assigned', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
        otp VARCHAR(10) NULL,
        otp_expiry DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 13. complaints table
    $pdo->exec("CREATE TABLE IF NOT EXISTS complaints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_ID VARCHAR(50) NULL,
        complainer VARCHAR(255) NOT NULL,
        about VARCHAR(255) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        evidence_image TEXT NULL,
        job_ID VARCHAR(50) NULL,
        status VARCHAR(50) DEFAULT 'Pending Review',
        date DATE DEFAULT (CURRENT_DATE),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $complaintCols = [
        'complainer' => "VARCHAR(255) NULL", 
        'about' => "VARCHAR(255) NULL", 
        'reason' => "VARCHAR(255) NULL", 
        'text' => "TEXT NULL", 
        'evidence_image' => "LONGTEXT NULL", 
        'job_ID' => "VARCHAR(50) NULL", 
        'complainant_role' => "VARCHAR(50) DEFAULT 'student'",
        'date' => "DATE NULL",
        'resolved_at' => "DATETIME NULL"
    ];
    foreach ($complaintCols as $col => $def) {
        $check = $pdo->query("SHOW COLUMNS FROM complaints LIKE '$col'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE complaints ADD COLUMN $col $def");
        }
    }

    echo "Database schema updated successfully!\n";

} catch (PDOException $e) {
    die("Schema Initialization Error: " . $e->getMessage() . "\n");
}
?>
