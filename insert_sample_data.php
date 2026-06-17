<?php
include 'backend/config/db.php';

try {
    // Enable error reporting
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    echo "Starting database seeding...\n";

    // 1. Seed/Update 5 Job Providers in 'users' and 'job_provider' tables
    $providers = [
        [
            'id' => 'CLI001',
            'name' => 'Dunhinda Falls Tourism',
            'email' => 'dunhinda.tourism@example.com',
            'phone' => '94762004739',
            'nic' => '200471500529',
            'business_reg_no' => 'BR-TR-001',
            'type' => 'Tourism'
        ],
        [
            'id' => 'CLI002',
            'name' => 'Badulla Bakers',
            'email' => 'badulla.bakers@example.com',
            'phone' => '94712345678',
            'nic' => '199012345678',
            'business_reg_no' => 'BR-FD-002',
            'type' => 'Food'
        ],
        [
            'id' => 'CLI003',
            'name' => 'Ella View Hotel',
            'email' => 'ella.view@example.com',
            'phone' => '94759876543',
            'nic' => '198598765432',
            'business_reg_no' => 'BR-HP-003',
            'type' => 'Hospitality'
        ],
        [
            'id' => 'CLI004',
            'name' => 'Badulla Super Mart',
            'email' => 'badulla.super@example.com',
            'phone' => '94775556677',
            'nic' => '199555667788',
            'business_reg_no' => 'BR-RT-004',
            'type' => 'Retail'
        ],
        [
            'id' => 'CLI005',
            'name' => 'Home provider',
            'email' => 'home.provider@example.com',
            'phone' => '94701122334',
            'nic' => '200011223344',
            'business_reg_no' => 'BR-PR-005',
            'type' => 'Personal/Home services'
        ]
    ];

    $passwordHash = password_hash('password123', PASSWORD_BCRYPT);

    foreach ($providers as $p) {
        // Insert or Update users table
        $stmtUser = $pdo->prepare("
            INSERT INTO users (user_ID, name, email, password, role, status, phone, is_verified, created_at)
            VALUES (?, ?, ?, ?, 'job_provider', 'active', ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                email = VALUES(email),
                phone = VALUES(phone),
                is_verified = 1
        ");
        $stmtUser->execute([$p['id'], $p['name'], $p['email'], $passwordHash, $p['phone']]);

        // Insert or Update job_provider table
        $stmtProv = $pdo->prepare("
            INSERT INTO job_provider (provider_ID, user_ID, nic, business_reg_no, type, is_verified)
            VALUES (?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                nic = VALUES(nic),
                business_reg_no = VALUES(business_reg_no),
                type = VALUES(type),
                is_verified = 1
        ");
        $stmtProv->execute([$p['id'], $p['id'], $p['nic'], $p['business_reg_no'], $p['type']]);

        echo "Provider {$p['id']} ({$p['name']}) seeded successfully.\n";
    }

    // 2. Seed 60 Jobs in 'job' table
    $jobs = [
        // CATEGORY 1: TOURISM (JOB001 - JOB020)
        [
            'job_ID' => 'JOB001',
            'provider_ID' => 'CLI001',
            'title' => 'Tour guide at Dunhinda Falls',
            'description' => 'Guide foreign and local tourists visiting Dunhinda Falls. Share historical details and safety tips. Location: Dunhinda Falls, Badulla. Time: 9AM-1PM (one day).',
            'skills' => 'English, Sinhala, Tamil',
            'payment' => 2500.00,
            'job_type' => 'onsite',
            'is_boosted' => 1
        ],
        [
            'job_ID' => 'JOB002',
            'provider_ID' => 'CLI001',
            'title' => 'Tourist photographer at Ella Rock',
            'description' => 'Capture professional high-quality photographs for visitors hiking Ella Rock. Must bring your own DSLR camera. Location: Ella Rock, Badulla. Time: 7AM-12PM.',
            'skills' => 'Photography',
            'payment' => 3000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB003',
            'provider_ID' => 'CLI001',
            'title' => 'Translation assistant for foreign tourists',
            'description' => 'Assist a group of foreign tourists with translation services between English and Tamil/Sinhala. Location: Badulla town area. Time: 2PM-6PM.',
            'skills' => 'English, Tamil',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB004',
            'provider_ID' => 'CLI003',
            'title' => 'Social media content creator for hotel',
            'description' => 'Take promotional photos and capture short video clips for our hotel social media pages. Location: Ella View Hotel, Ella. Time: 10AM-3PM.',
            'skills' => 'Photography, Social Media',
            'payment' => 2500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB005',
            'provider_ID' => 'CLI001',
            'title' => 'Tour package flyer designer',
            'description' => 'Design an attractive digital flyer/brochure for Dunhinda Falls special tour packages. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 1500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB006',
            'provider_ID' => 'CLI001',
            'title' => 'Tourist guide at Nine Arch Bridge',
            'description' => 'Guide incoming tourists at Nine Arch Bridge, explain the history, and point out top photography spots. Location: Nine Arch Bridge, Ella. Time: 8AM-12PM.',
            'skills' => 'English',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB007',
            'provider_ID' => 'CLI003',
            'title' => 'Hotel front desk assistant',
            'description' => 'Help receive international guests at the front desk, answering basic queries and helping with check-in. Location: Ella View Hotel, Ella. Time: 6PM-10PM.',
            'skills' => 'English, Sinhala',
            'payment' => 3000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB008',
            'provider_ID' => 'CLI003',
            'title' => 'Souvenir shop assistant at Ella',
            'description' => 'Help manage inventory and assist foreign tourists in choosing traditional Sri Lankan souvenirs. Location: Ella Main Street. Time: 9AM-5PM.',
            'skills' => 'English, Tamil',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB009',
            'provider_ID' => 'CLI001',
            'title' => 'Tuk tuk tour coordinator',
            'description' => 'Coordinate booking schedules between tourists and local Tuk Tuk drivers at the Badulla Railway Station. Location: Badulla. Time: 8AM-2PM.',
            'skills' => 'English, Sinhala',
            'payment' => 2500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB010',
            'provider_ID' => 'CLI001',
            'title' => 'Travel blog writer about Badulla',
            'description' => 'Write a 1200-word engaging travel blog article detailing top scenic spots and budget hiking routes in Badulla. Remote task.',
            'skills' => 'English, Content Writing',
            'payment' => 1800.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB011',
            'provider_ID' => 'CLI003',
            'title' => 'Restaurant menu translator',
            'description' => 'Translate our restaurant menu items and descriptions from English into Sinhala and Tamil. Remote task.',
            'skills' => 'English, Tamil, Sinhala',
            'payment' => 1200.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB012',
            'provider_ID' => 'CLI003',
            'title' => 'Hiking guide at Rawana Falls',
            'description' => 'Accompany active tourists up the Rawana Falls trails. Good physical fitness and trail knowledge required. Location: Rawana Falls, Ella. Time: 6AM-12PM.',
            'skills' => 'English, Fitness',
            'payment' => 3000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB013',
            'provider_ID' => 'CLI003',
            'title' => 'Hotel room photographer',
            'description' => 'Take professional interior photos of renovated luxury rooms for our online listing. Location: Ella View Hotel, Ella. Time: 10AM-2PM.',
            'skills' => 'Photography',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB014',
            'provider_ID' => 'CLI001',
            'title' => 'Tourist information desk assistant',
            'description' => 'Provide information, maps, and local advice to tourists at our Badulla town center booth. Location: Badulla. Time: 9AM-5PM.',
            'skills' => 'English, Tamil',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB015',
            'provider_ID' => 'CLI003',
            'title' => 'Instagram content for guesthouse',
            'description' => 'Design, compile, and schedule a grid of 9 high-quality Instagram posts for a local boutique guesthouse. Remote task.',
            'skills' => 'Social Media, Photography',
            'payment' => 1500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB016',
            'provider_ID' => 'CLI001',
            'title' => 'Cultural event MC assistant',
            'description' => 'Assist the main Master of Ceremonies at a local cultural festival. Help coordinate backstage. Location: Badulla Town Hall. Time: 4PM-9PM.',
            'skills' => 'Sinhala, English',
            'payment' => 2500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB017',
            'provider_ID' => 'CLI001',
            'title' => 'Travel vlog video editor',
            'description' => 'Edit raw travel footage into a compelling 10-minute vlog for YouTube. Add background music and subtitles. Remote task.',
            'skills' => 'Video Editing',
            'payment' => 3500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB018',
            'provider_ID' => 'CLI001',
            'title' => 'Handicraft stall assistant at market',
            'description' => 'Assist in displaying local wooden crafts and communicating pricing to visitors. Location: Badulla Weekend Market. Time: 8AM-1PM.',
            'skills' => 'Tamil, Sinhala',
            'payment' => 1800.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB019',
            'provider_ID' => 'CLI001',
            'title' => 'Tour booking website content writer',
            'description' => 'Write clear, attractive descriptions for 5 different nature trekking packages. Remote task.',
            'skills' => 'Content Writing, English',
            'payment' => 2000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB020',
            'provider_ID' => 'CLI001',
            'title' => 'Google Maps reviewer and writer',
            'description' => 'Conduct research and write comprehensive reviews of historical locations in Badulla for a travel guide app. Remote task.',
            'skills' => 'English, Content Writing',
            'payment' => 1000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],

        // CATEGORY 2: LOCAL BUSINESS (JOB021 - JOB040)
        [
            'job_ID' => 'JOB021',
            'provider_ID' => 'CLI002',
            'title' => 'Logo design for bakery',
            'description' => 'Create a modern, elegant, minimalist brand logo for Badulla Bakers. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 2000.00,
            'job_type' => 'remote',
            'is_boosted' => 1
        ],
        [
            'job_ID' => 'JOB022',
            'provider_ID' => 'CLI002',
            'title' => 'Facebook page management for boutique',
            'description' => 'Manage a boutique page for 4 weeks. Draft weekly posts, respond to customer product queries. Remote task.',
            'skills' => 'Social Media Management',
            'payment' => 1500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB023',
            'provider_ID' => 'CLI004',
            'title' => 'Data entry for pharmacy records',
            'description' => 'Input daily prescription data and invoice sheets into MS Excel. Location: Badulla town pharmacy.',
            'skills' => 'Data Entry, Excel',
            'payment' => 1200.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB024',
            'provider_ID' => 'CLI004',
            'title' => 'Cashier assistant at supermarket',
            'description' => 'Assist the primary cashier, manage packaging, and handle cash transactions during rush hours. Location: Badulla Super Mart. Time: 9AM-5PM.',
            'skills' => 'Maths',
            'payment' => 2500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB025',
            'provider_ID' => 'CLI004',
            'title' => 'Flyer printing and distribution',
            'description' => 'Distribute new discount flyers around Badulla town center and near the university bus stand. Location: Badulla.',
            'skills' => 'Delivery',
            'payment' => 1500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB026',
            'provider_ID' => 'CLI002',
            'title' => 'WhatsApp order management for bakery',
            'description' => 'Respond to customer orders and confirm delivery times using our business WhatsApp. Remote task.',
            'skills' => 'Communication',
            'payment' => 1000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB027',
            'provider_ID' => 'CLI002',
            'title' => 'Stock inventory data entry',
            'description' => 'Check physical stocks of flour, sugar, and baking supplies, and update the Excel database. Location: Badulla Bakers.',
            'skills' => 'Data Entry, Excel',
            'payment' => 1500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB028',
            'provider_ID' => 'CLI004',
            'title' => 'Website product listing for clothing shop',
            'description' => 'Upload 30 new dress items with photos, sizes, and pricing to our online shop. Remote task.',
            'skills' => 'Web Dev, Data Entry',
            'payment' => 2000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB029',
            'provider_ID' => 'CLI004',
            'title' => 'Event decoration setup assistant',
            'description' => 'Help hang flower garlands and arrange table settings for a business banquet. Location: Badulla Town.',
            'skills' => 'Creativity',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB030',
            'provider_ID' => 'CLI004',
            'title' => 'Poster design for hardware shop',
            'description' => 'Design an advertisement poster highlighting discounts on power tools. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 1200.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB031',
            'provider_ID' => 'CLI004',
            'title' => 'Sales assistant at electronics shop',
            'description' => 'Interact with customers, explain phone and laptop specifications, and handle inquiries. Location: Badulla town. Time: 10AM-6PM.',
            'skills' => 'Communication, English',
            'payment' => 2500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB032',
            'provider_ID' => 'CLI004',
            'title' => 'Social media reels for restaurant',
            'description' => 'Edit short, engaging culinary videos to showcase special cheese kottu preparation. Remote task.',
            'skills' => 'Video Editing, Social Media',
            'payment' => 2000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB033',
            'provider_ID' => 'CLI004',
            'title' => 'Business card design for accountant',
            'description' => 'Design a professional double-sided corporate card layout. Remote task.',
            'skills' => 'Design',
            'payment' => 800.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB034',
            'provider_ID' => 'CLI004',
            'title' => 'Excel report for construction company',
            'description' => 'Format raw material expense sheets and generate charts for a weekly review. Remote task.',
            'skills' => 'Excel, Data Entry',
            'payment' => 1500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB035',
            'provider_ID' => 'CLI004',
            'title' => 'Packing assistant at grocery store',
            'description' => 'Help pack loose grains and spices into retail pouches. Location: Badulla Super Mart. Time: 7AM-12PM.',
            'skills' => 'Physical',
            'payment' => 1500.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB036',
            'provider_ID' => 'CLI004',
            'title' => 'Tuition center receptionist',
            'description' => 'Greet parents, handle class enrollment logs, and collect payments. Location: Badulla Town. Time: 3PM-7PM.',
            'skills' => 'Communication, English',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB037',
            'provider_ID' => 'CLI002',
            'title' => 'Menu design for new cafe',
            'description' => 'Design a visually appealing, themed digital menu card. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 1500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB038',
            'provider_ID' => 'CLI004',
            'title' => 'Product photography for online shop',
            'description' => 'Photograph 15 leather bags with proper studio lighting and clean backgrounds. Location: Badulla Town.',
            'skills' => 'Photography',
            'payment' => 2000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB039',
            'provider_ID' => 'CLI002',
            'title' => 'WhatsApp catalogue design',
            'description' => 'Format a PDF catalog with images of 20 bakery items and pricing. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 1000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB040',
            'provider_ID' => 'CLI004',
            'title' => 'Assistant at wedding photography shoot',
            'description' => 'Help carry lighting stands and assist the main photographer during a outdoor wedding shoot. Location: Ella, Badulla.',
            'skills' => 'Photography',
            'payment' => 3000.00,
            'job_type' => 'onsite',
            'is_boosted' => 0
        ],

        // CATEGORY 3: HOME/PERSONAL SERVICES (JOB041 - JOB060)
        [
            'job_ID' => 'JOB041',
            'provider_ID' => 'CLI005',
            'title' => 'Cupcake/cake order delivery',
            'description' => 'Pick up cake from Home Provider in Badulla and deliver it safely to a client in Badulla town. Remote (delivery only).',
            'skills' => 'Delivery',
            'payment' => 500.00,
            'job_type' => 'remote',
            'is_boosted' => 1
        ],
        [
            'job_ID' => 'JOB042',
            'provider_ID' => 'CLI005',
            'title' => 'Handmade products delivery',
            'description' => 'Pick up craft box and deliver to customer in Badulla town. Remote (delivery only).',
            'skills' => 'Delivery',
            'payment' => 600.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB043',
            'provider_ID' => 'CLI005',
            'title' => 'Online assignment typing help',
            'description' => 'Transcribe 20 pages of handwritten lecture notes into a Word document. Remote task.',
            'skills' => 'Typing, English',
            'payment' => 1000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB044',
            'provider_ID' => 'CLI005',
            'title' => 'PowerPoint presentation design',
            'description' => 'Improve the visual design of an existing 15-slide academic presentation. Remote task.',
            'skills' => 'Design, PowerPoint',
            'payment' => 800.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB045',
            'provider_ID' => 'CLI005',
            'title' => 'CV/Resume design for job seeker',
            'description' => 'Design a professional, single-page ATS-friendly CV. Remote task.',
            'skills' => 'Design, English',
            'payment' => 500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB046',
            'provider_ID' => 'CLI005',
            'title' => 'Translation of documents Tamil to English',
            'description' => 'Translate a short birth certificate and educational transcript. Remote task.',
            'skills' => 'Tamil, English, Translation',
            'payment' => 1000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB047',
            'provider_ID' => 'CLI005',
            'title' => 'Online form filling assistance',
            'description' => 'Help fill out online university registration forms step by step via screen share. Remote task.',
            'skills' => 'Computer Literacy',
            'payment' => 500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB048',
            'provider_ID' => 'CLI005',
            'title' => 'Video editing for family event',
            'description' => 'Compile family vacation clips into a clean 5-minute video with basic transitions. Remote task.',
            'skills' => 'Video Editing',
            'payment' => 1500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB049',
            'provider_ID' => 'CLI005',
            'title' => 'Birthday invitation card design',
            'description' => 'Design a cute, printable digital invitation card for a child\'s 5th birthday. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 600.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB050',
            'provider_ID' => 'CLI005',
            'title' => 'Logo design for home business',
            'description' => 'Design a logo for a home-based crochet shop. Remote task.',
            'skills' => 'Design',
            'payment' => 1200.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB051',
            'provider_ID' => 'CLI005',
            'title' => 'Sinhala to English letter translation',
            'description' => 'Translate a personal handwritten letter into clear English. Remote task.',
            'skills' => 'Sinhala, English, Translation',
            'payment' => 800.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB052',
            'provider_ID' => 'CLI005',
            'title' => 'Mobile phone troubleshooting help',
            'description' => 'Assist in solving backup storage issues on an Android device via Zoom. Remote task.',
            'skills' => 'Technology',
            'payment' => 500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB053',
            'provider_ID' => 'CLI005',
            'title' => 'Online grocery order assistance',
            'description' => 'Help configure and submit a local grocery delivery order online. Remote task.',
            'skills' => 'Computer Literacy',
            'payment' => 400.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB054',
            'provider_ID' => 'CLI005',
            'title' => 'Proofreading English document',
            'description' => 'Proofread a 5-page research report for grammar, spelling, and readability. Remote task.',
            'skills' => 'English, Content Writing',
            'payment' => 600.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB055',
            'provider_ID' => 'CLI005',
            'title' => 'Kids homework help via WhatsApp',
            'description' => 'Help solve 10 algebra problems and explain the steps via WhatsApp voice notes. Remote task.',
            'skills' => 'Tutoring, Maths, English',
            'payment' => 800.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB056',
            'provider_ID' => 'CLI005',
            'title' => 'Handmade craft delivery in Badulla town',
            'description' => 'Pick up package from client home and deliver to Badulla town. Remote (delivery).',
            'skills' => 'Delivery',
            'payment' => 500.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB057',
            'provider_ID' => 'CLI005',
            'title' => 'Wedding invitation design',
            'description' => 'Design an elegant floral-themed digital wedding invitation card. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 1000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB058',
            'provider_ID' => 'CLI005',
            'title' => 'YouTube thumbnail design',
            'description' => 'Design a high-CTR YouTube thumbnail for a gaming channel. Remote task.',
            'skills' => 'Design, Photoshop',
            'payment' => 600.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB059',
            'provider_ID' => 'CLI005',
            'title' => 'Data collection survey',
            'description' => 'Compile survey responses from 10 students regarding online study tools. Remote task.',
            'skills' => 'Communication, Data Entry',
            'payment' => 1000.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ],
        [
            'job_ID' => 'JOB060',
            'provider_ID' => 'CLI005',
            'title' => 'Online tutor for O/L Maths',
            'description' => 'Conduct a 1-hour session explaining simultaneous equations. Remote task.',
            'skills' => 'Tutoring, Maths',
            'payment' => 1200.00,
            'job_type' => 'remote',
            'is_boosted' => 0
        ]
    ];

    // Seed jobs
    foreach ($jobs as $idx => $j) {
        // Generate random created_at date in the past 2 months (60 days)
        $createdDaysAgo = rand(1, 60);
        $createdAt = date('Y-m-d H:i:s', strtotime("-$createdDaysAgo days"));

        // Generate random deadline date after 10.07.2026 (let's say between 12.07.2026 and 30.08.2026)
        $deadlineUnix = rand(strtotime('2026-07-12 00:00:00'), strtotime('2026-08-30 23:59:59'));
        $deadline = date('Y-m-d H:i:s', $deadlineUnix);

        $stmtJob = $pdo->prepare("
            INSERT INTO job (job_ID, provider_ID, title, description, skills, payment, job_type, status, deadline, is_boosted, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                provider_ID = VALUES(provider_ID),
                title = VALUES(title),
                description = VALUES(description),
                skills = VALUES(skills),
                payment = VALUES(payment),
                job_type = VALUES(job_type),
                status = 'active',
                deadline = VALUES(deadline),
                is_boosted = VALUES(is_boosted),
                created_at = VALUES(created_at)
        ");
        $stmtJob->execute([
            $j['job_ID'],
            $j['provider_ID'],
            $j['title'],
            $j['description'],
            $j['skills'],
            $j['payment'],
            $j['job_type'],
            $deadline,
            $j['is_boosted'],
            $createdAt
        ]);
    }

    echo "Successfully seeded " . count($jobs) . " jobs.\n";
    echo "Database seeding completed successfully!\n";

} catch (Exception $e) {
    echo "Error seeding database: " . $e->getMessage() . "\n";
}
?>
