<?php
// backend/config/seed_data.php
require_once __DIR__ . '/db.php';

try {
    // 1. Ensure provider exists
    $providerUser = 'CLI001';
    $stmtP = $pdo->prepare("SELECT provider_ID FROM job_provider WHERE user_ID = ?");
    $stmtP->execute([$providerUser]);
    $provider = $stmtP->fetch(PDO::FETCH_ASSOC);

    $provider_ID = $provider ? $provider['provider_ID'] : 'CLI001';

    // Sample jobs list
    $sampleJobs = [
        [
            'job_ID' => 'JOB001',
            'title' => 'UWU Student Portal UI/UX Design',
            'description' => 'Looking for a creative student designer to create modern Figma prototypes for a campus student portal.',
            'address' => 'Badulla, Sri Lanka',
            'skills' => 'Design, Figma, UI/UX',
            'payment' => 15000.00,
            'job_type' => 'remote',
            'deadline' => date('Y-m-d', strtotime('+7 days')),
            'status' => 'active',
            'seekers_needed' => 2,
            'is_product_based' => 0,
            'is_boosted' => 1
        ],
        [
            'job_ID' => 'JOB002',
            'title' => 'Campus Event Photography & Editing',
            'description' => 'Need a student photographer with DSLR camera to cover the annual UWU tech symposium event.',
            'address' => 'Uva Wellassa University, Badulla',
            'skills' => 'Photography, Video Editing, Photoshop',
            'payment' => 20000.00,
            'job_type' => 'onsite',
            'deadline' => date('Y-m-d', strtotime('+10 days')),
            'status' => 'active',
            'seekers_needed' => 1,
            'is_product_based' => 0,
            'is_boosted' => 1
        ],
        [
            'job_ID' => 'JOB003',
            'title' => 'Data Entry & Excel Inventory Analysis',
            'description' => 'Assist in organizing and cleaning up product inventory spreadsheets for a local business in Badulla.',
            'address' => 'Badulla Town',
            'skills' => 'Data Entry, Excel, Typing',
            'payment' => 12000.00,
            'job_type' => 'remote',
            'deadline' => date('Y-m-d', strtotime('+5 days')),
            'status' => 'active',
            'seekers_needed' => 1,
            'is_product_based' => 0,
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB004',
            'title' => 'React Frontend Developer for Local Startup',
            'description' => 'Build interactive dashboard components using React and Tailwind CSS for a web application.',
            'address' => 'Remote',
            'skills' => 'Web Dev, React, JavaScript, Coding',
            'payment' => 35000.00,
            'job_type' => 'remote',
            'deadline' => date('Y-m-d', strtotime('+14 days')),
            'status' => 'active',
            'seekers_needed' => 2,
            'is_product_based' => 0,
            'is_boosted' => 1
        ]
    ];

    foreach ($sampleJobs as $j) {
        $check = $pdo->prepare("SELECT job_ID FROM job WHERE job_ID = ?");
        $check->execute([$j['job_ID']]);
        if (!$check->fetch()) {
            $stmt = $pdo->prepare("INSERT INTO job (job_ID, provider_ID, title, description, address, skills, payment, job_type, deadline, status, seekers_needed, is_product_based, is_boosted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $j['job_ID'],
                $provider_ID,
                $j['title'],
                $j['description'],
                $j['address'],
                $j['skills'],
                $j['payment'],
                $j['job_type'],
                $j['deadline'],
                $j['status'],
                $j['seekers_needed'],
                $j['is_product_based'],
                $j['is_boosted']
            ]);
            echo "Inserted sample job: {$j['title']}\n";
        }
    }

    // Sample notification for Gowtham (STU007)
    $stmtNotif = $pdo->prepare("INSERT INTO notification (user_ID, title, message, type) VALUES ('STU007', 'Welcome to GigConnect!', 'Your student profile is active. Browse available gigs and start applying today.', 'general')");
    $stmtNotif->execute();

    echo "Sample data seeded successfully!\n";

} catch (PDOException $e) {
    echo "Seed Error: " . $e->getMessage() . "\n";
}
?>
