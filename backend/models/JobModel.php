<?php
// backend/models/JobModel.php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/email_templates.php';

class JobModel extends BaseModel {

    public function postJob($data, $user) {
        // only job providers can post jobs
        if($user->role !== 'job_provider') {
            return ["error" => "Only job providers can post jobs!"];
        }

        $title = $data['title'];
        $description = $data['description'];
        $skills = $data['skills'];
        $payment = $data['payment'];
        $job_type = $data['job_type'];
        $deadline = $data['deadline'];
        $business_reg_no = isset($data['business_reg_no']) ? trim($data['business_reg_no']) : '';
        $address = isset($data['address']) ? trim($data['address']) : '';
        $latitude = isset($data['latitude']) ? $data['latitude'] : null;
        $longitude = isset($data['longitude']) ? $data['longitude'] : null;
        $seekers_needed = isset($data['seekers_needed']) ? intval($data['seekers_needed']) : 1;
        $job_date = isset($data['job_date']) ? $data['job_date'] : null;
        $start_time = isset($data['start_time']) ? $data['start_time'] : null;
        $end_time = isset($data['end_time']) ? $data['end_time'] : null;

        // validate business registration number for onsite jobs
        if ($job_type === 'onsite' && empty($business_reg_no)) {
            return ["error" => "Business registration number is required for onsite jobs!"];
        }

        // validate address for onsite jobs
        if ($job_type === 'onsite' && empty($address)) {
            return ["error" => "Address is required for onsite jobs!"];
        }

        // get provider_id
        $stmt = $this->pdo->prepare("SELECT provider_ID, is_verified FROM job_provider WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$provider) {
            return ["error" => "Job provider not found!"];
        }

        // Update provider's business details if provided
        $updateFields = [];
        $params = [];
        if (!empty($business_reg_no)) {
            $updateFields[] = "business_reg_no = ?";
            $params[] = $business_reg_no;
        }
        if (!empty($address)) {
            $updateFields[] = "address = ?";
            $params[] = $address;
        }
        if ($latitude !== null) {
            $updateFields[] = "latitude = ?";
            $params[] = $latitude;
        }
        if ($longitude !== null) {
            $updateFields[] = "longitude = ?";
            $params[] = $longitude;
        }

        if (!empty($updateFields)) {
            $sql = "UPDATE job_provider SET " . implode(", ", $updateFields) . " WHERE provider_ID = ?";
            $params[] = $provider['provider_ID'];
            $stmtUpdate = $this->pdo->prepare($sql);
            $stmtUpdate->execute($params);
        }

        // Determine job status: all new jobs start as pending until approved by admin/manager
        $status = 'pending';

        // generate job ID
        $job_ID = $this->generateNextID('job', 'job_ID', 'JOB');

        $is_product_based = isset($data['is_product_based']) ? intval($data['is_product_based']) : 0;

        // insert job
        $stmt3 = $this->pdo->prepare("INSERT INTO job (job_ID, provider_ID, title, description, address, skills, payment, job_type, deadline, status, seekers_needed, job_date, start_time, end_time, is_product_based) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt3->execute([
            $job_ID,
            $provider['provider_ID'],
            $title,
            $description,
            $address,
            $skills,
            $payment,
            $job_type,
            $deadline,
            $status,
            $seekers_needed,
            $job_date,
            $start_time,
            $end_time,
            $is_product_based
        ]);

        return [
            "success" => "Job posted successfully!",
            "job_ID" => $job_ID
        ];
    }

    public function getCategory($title, $skills) {
        $t = strtolower($title);
        $s = strtolower($skills);
        if (strpos($t, 'design') !== false || strpos($t, 'logo') !== false || strpos($t, 'poster') !== false || strpos($t, 'card') !== false || strpos($t, 'flyer') !== false || strpos($t, 'presentation') !== false || strpos($t, 'powerpoint') !== false || strpos($t, 'cv') !== false || strpos($t, 'resume') !== false || strpos($s, 'design') !== false || strpos($s, 'photoshop') !== false) {
            return 'Design';
        }
        if (strpos($t, 'data entry') !== false || strpos($t, 'excel') !== false || strpos($t, 'inventory') !== false || strpos($t, 'listing') !== false || strpos($t, 'typing') !== false || strpos($t, 'form') !== false || strpos($s, 'data entry') !== false || strpos($s, 'excel') !== false || strpos($s, 'typing') !== false) {
            return 'Data Entry';
        }
        if (strpos($t, 'photography') !== false || strpos($t, 'photographer') !== false || strpos($t, 'video') !== false || strpos($t, 'editor') !== false || strpos($t, 'vlog') !== false || strpos($t, 'reels') !== false || strpos($t, 'thumbnail') !== false || strpos($s, 'photography') !== false || strpos($s, 'video editing') !== false) {
            return 'Photography';
        }
        if (strpos($t, 'web dev') !== false || strpos($t, 'website') !== false || strpos($s, 'web dev') !== false || strpos($s, 'coding') !== false) {
            return 'Web Dev';
        }
        if (strpos($t, 'translation') !== false || strpos($t, 'translator') !== false || strpos($t, 'translate') !== false || strpos($t, 'proofreading') !== false || strpos($s, 'translation') !== false || strpos($s, 'translator') !== false) {
            return 'Translation';
        }
        if (strpos($t, 'tutor') !== false || strpos($t, 'homework') !== false || strpos($t, 'kids') !== false || strpos($t, 'academic') !== false || strpos($s, 'tutoring') !== false || strpos($s, 'maths') !== false) {
            return 'Academic & Tutoring';
        }
        return 'Local Services';
    }

    private function parseSkills($skills_str) {
        if (empty($skills_str)) return [];
        $decoded = json_decode($skills_str, true);
        if (is_array($decoded)) {
            return array_map('strtolower', array_map('trim', $decoded));
        }
        return array_filter(array_map('strtolower', array_map('trim', explode(',', $skills_str))));
    }

    private function computeSkillMatch(array $student_skills, array $job_skills): float {
        if (empty($student_skills) || empty($job_skills)) return 0.0;
        $intersect = array_intersect($student_skills, $job_skills);
        $union = count(array_unique(array_merge($student_skills, $job_skills)));
        return $union > 0 ? count($intersect) / $union : 0.0;
    }

    private function computeJobTypeMatch(string $job_type, string $explicit_pref, array $past_job_types): float {
        $job_type = strtolower(trim($job_type));
        $score = 0.0;

        if (!empty($explicit_pref)) {
            $pref_lower = strtolower(trim($explicit_pref));
            if ($pref_lower === $job_type || 
                ($pref_lower === 'remote' && $job_type === 'remote') ||
                ($pref_lower === 'onsite' && $job_type === 'onsite')) {
                $score += 0.5;
            }
        }

        if (!empty($past_job_types)) {
            $type_counts = array_count_values(array_map('strtolower', $past_job_types));
            $total = array_sum($type_counts);
            $match_count = $type_counts[$job_type] ?? 0;
            $score += ($total > 0) ? min(0.5, ($match_count / $total) * 0.5) : 0.0;
        }

        return min(1.0, $score);
    }

    private function computeRatingScore(float $rating, int $completed_count): float {
        if ($completed_count === 0) return 0.5;
        return max(0.2, $rating / 5.0);
    }

    public function getRecommendations($data, $user) {
        if ($user->role !== 'student') {
            return ["error" => "Unauthorized! Only students can receive recommendations."];
        }

        $stmt = $this->pdo->prepare("SELECT * FROM student WHERE user_ID = ?");
        $stmt->execute([$user->user_ID]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            return ["error" => "Student profile not found!"];
        }

        $student_ID      = $student['student_ID'];
        $student_skills  = $this->parseSkills($student['skills'] ?? '');
        $explicit_pref   = trim($student['preference'] ?? '');
        $rating          = floatval($student['rating'] ?? 0.0);

        $stmt_hist = $this->pdo->prepare("
            SELECT a.status, j.status AS job_status, j.job_type, j.skills AS job_skills, j.title
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            WHERE a.student_ID = ?
            ORDER BY a.applied_date DESC
        ");
        $stmt_hist->execute([$student_ID]);
        $history = $stmt_hist->fetchAll(PDO::FETCH_ASSOC);

        $completed_count = 0;
        $past_job_types  = [];
        $past_job_skills = [];
        $no_shows        = 0;

        foreach ($history as $h) {
            $status = strtolower($h['status']);
            $job_status = strtolower($h['job_status'] ?? '');
            if ($status === 'completed' || $job_status === 'completed') {
                $completed_count++;
                $past_job_types[]  = strtolower($h['job_type']);
                $past_job_skills   = array_merge($past_job_skills, $this->parseSkills($h['job_skills']));
            }
            if ($status === 'accepted' && $h['job_type'] && $job_status !== 'completed') {
                $past_job_types[] = strtolower($h['job_type']);
            }
            if ($h['status'] === 'no_show') {
                $no_shows++;
            }
        }

        $effective_skills = array_unique(array_merge($student_skills, $past_job_skills));

        $stmt_jobs = $this->pdo->prepare("
            SELECT j.*, u.name AS provider_name, u.email AS provider_email
            FROM job j
            LEFT JOIN users u ON j.provider_ID = u.user_ID
            WHERE j.status = 'active'
              AND (j.deadline IS NULL OR j.deadline >= NOW())
              AND j.job_ID NOT IN (
                  SELECT job_ID FROM application WHERE student_ID = ?
              )
            ORDER BY j.is_boosted DESC, j.created_at DESC
        ");
        $stmt_jobs->execute([$student_ID]);
        $jobs = $stmt_jobs->fetchAll(PDO::FETCH_ASSOC);

        $recommended = [];

        $stmt_max = $this->pdo->query("SELECT MAX(CAST(SUBSTRING(recommendation_ID, 4) AS UNSIGNED)) FROM recommendation");
        $next_rec_num = intval($stmt_max->fetchColumn()) + 1;

        foreach ($jobs as $job) {
            $job_skills = $this->parseSkills($job['skills'] ?? '');
            $job_type   = strtolower(trim($job['job_type'] ?? ''));
            $is_boosted = isset($job['is_boosted']) && $job['is_boosted'] == 1;

            $skill_score = $this->computeSkillMatch($effective_skills, $job_skills);
            $type_score = $this->computeJobTypeMatch($job_type, $explicit_pref, $past_job_types);
            $rating_score = $this->computeRatingScore($rating, $completed_count);

            if ($completed_count === 0) {
                $raw_score = ($skill_score * 0.65) + ($type_score * 0.35);
            } else {
                $raw_score = ($skill_score * 0.50)
                           + ($type_score  * 0.25)
                           + ($rating_score * 0.25);
            }

            if ($is_boosted) {
                $raw_score = min(1.0, $raw_score + 0.08);
            }

            $raw_score = max(0.0, $raw_score - ($no_shows * 0.05));
            $match_percentage = round($raw_score * 100, 1);
            $score_db = round($raw_score * 10, 2);

            $stmt_check = $this->pdo->prepare("SELECT recommendation_ID FROM recommendation WHERE student_ID = ? AND job_ID = ?");
            $stmt_check->execute([$student_ID, $job['job_ID']]);
            $existing_id = $stmt_check->fetchColumn();

            if ($existing_id) {
                $stmt_upd = $this->pdo->prepare("UPDATE recommendation SET match_score = ? WHERE recommendation_ID = ?");
                $stmt_upd->execute([$score_db, $existing_id]);
            } else {
                $rec_id = 'REC' . str_pad($next_rec_num, 3, '0', STR_PAD_LEFT);
                $stmt_ins = $this->pdo->prepare("INSERT INTO recommendation (recommendation_ID, student_ID, job_ID, match_score) VALUES (?, ?, ?, ?)");
                $stmt_ins->execute([$rec_id, $student_ID, $job['job_ID'], $score_db]);
                $next_rec_num++;
            }

            $reasons = [];
            if ($skill_score > 0.4)  $reasons[] = 'Skills match';
            if ($type_score > 0.3)   $reasons[] = ($completed_count > 0 ? 'Matches your job history' : 'Matches your preference');
            if ($is_boosted)         $reasons[] = 'Featured gig';
            if ($rating > 3.5)       $reasons[] = 'Top-rated student';
            if (empty($reasons))     $reasons[] = 'Available opportunity';

            $recommended[] = [
                "job_ID"          => $job['job_ID'],
                "title"           => $job['title'],
                "description"     => $job['description'],
                "skills"          => $job['skills'],
                "payment"         => floatval($job['payment']),
                "job_type"        => $job['job_type'],
                "deadline"        => $job['deadline'],
                "is_boosted"      => (int)($job['is_boosted'] ?? 0),
                "match_score"     => $match_percentage,
                "match_reasons"   => $reasons,
                "is_new_student"  => $completed_count === 0,
                "student_rating"  => $rating,
                "provider_name"   => $job['provider_name'] ?? 'GigConnect Partner',
                "provider_email"  => $job['provider_email'] ?? '',
                "job_date"        => $job['job_date'] ?? null,
                "start_time"      => $job['start_time'] ?? null,
                "end_time"        => $job['end_time'] ?? null,
                "category"        => $this->getCategory($job['title'], $job['skills'] ?? ''),
            ];
        }

        usort($recommended, function($a, $b) {
            if ($a['match_score'] == $b['match_score']) {
                return $b['is_boosted'] <=> $a['is_boosted'];
            }
            return $b['match_score'] <=> $a['match_score'];
        });

        $student_type = $completed_count === 0 ? 'new' : 'returning';
        $algo_label   = $completed_count === 0
            ? 'Based on your skills & preferences'
            : "Based on $completed_count completed gigs, your skills & rating";

        return [
            "success"         => true,
            "recommendations" => $recommended,
            "meta"            => [
                "student_type"    => $student_type,
                "completed_jobs"  => $completed_count,
                "student_rating"  => $rating,
                "explicit_pref"   => $explicit_pref,
                "skills_count"    => count($student_skills),
                "algo_label"      => $algo_label,
            ]
        ];
    }

    public function updateApplicant($data, $user) {
        if($user->role !== 'job_provider') {
            return ["error" => "Unauthorized!"];
        }

        $application_ID = $data['application_ID'];
        $action = $data['action'];

        $stmt = $this->pdo->prepare("
            SELECT a.*, j.provider_ID, j.title, j.payment_status
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            WHERE a.application_ID = ?
        ");
        $stmt->execute([$application_ID]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$application) {
            return ["error" => "Application not found!"];
        }

        $stmt = $this->pdo->prepare("SELECT * FROM job_provider WHERE user_ID = ? AND provider_ID = ?");
        $stmt->execute([$user->user_ID, $application['provider_ID']]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$provider) {
            return ["error" => "Unauthorized!"];
        }

        $status_map = [
            'shortlist' => 'shortlisted',
            'accept' => 'accepted',
            'reject' => 'rejected'
        ];

        $new_status = $status_map[$action];

        if ($action === 'accept') {
            // Check if job payment is paid
            if ($application['payment_status'] !== 'paid') {
                $new_status = 'pending_payment';
            }
        }

        $stmt = $this->pdo->prepare("UPDATE application SET status = ? WHERE application_ID = ?");
        $stmt->execute([$new_status, $application_ID]);

        if ($action === 'accept' && $new_status === 'accepted') {
            $stmt = $this->pdo->prepare("UPDATE job SET status = 'in_progress', assigned_time = NOW() WHERE job_ID = ?");
            $stmt->execute([$application['job_ID']]);
        }

        $stmt = $this->pdo->prepare("
            SELECT u.email, u.name
            FROM application a
            JOIN student s ON a.student_ID = s.student_ID
            JOIN users u ON s.user_ID = u.user_ID
            WHERE a.application_ID = ?
        ");
        $stmt->execute([$application_ID]);
        $student_info = $stmt->fetch(PDO::FETCH_ASSOC);

        $email_body = applicationStatusEmail(
            $student_info['name'],
            $application['title'],
            $new_status
        );
        sendEmail($student_info['email'], "GigConnect - Application Update", $email_body);

        return [
            "success" => "Application " . $new_status . " successfully!",
            "application_ID" => $application_ID,
            "status" => $new_status
        ];
    }

    public function updatePaymentStatus($data, $user) {
        if ($user->role !== 'job_provider') {
            return ["error" => "Unauthorized! Only job providers can update payment status."];
        }

        $job_ID = $data['job_ID'] ?? null;
        $status = $data['payment_status'] ?? 'paid';

        if (!$job_ID) {
            return ["error" => "Job ID is required!"];
        }

        $provider_ID = $this->ensureProviderProfile($user->user_ID);

        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = ?");
        $stmt->execute([$job_ID, $provider_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            return ["error" => "Job not found or unauthorized!"];
        }

        if ($status === 'paid') {
            $card_number = $data['card_number'] ?? null;
            $expiry_date = $data['expiry_date'] ?? null;
            $cvv = $data['cvv'] ?? null;

            if (!$card_number || !$expiry_date || !$cvv) {
                return ["error" => "Credit Card details (card_number, expiry_date, cvv) are required for payment processing!"];
            }

            // 1. Validate Card Number (Luhn's Algorithm)
            $clean_card = preg_replace('/\D/', '', $card_number);
            if (strlen($clean_card) !== 16) {
                return ["error" => "Invalid Card Number: Card number must be exactly 16 digits."];
            }

            $sum = 0;
            $should_double = false;
            for ($i = strlen($clean_card) - 1; $i >= 0; $i--) {
                $digit = (int)$clean_card[$i];
                if ($should_double) {
                    $digit *= 2;
                    if ($digit > 9) {
                        $digit -= 9;
                    }
                }
                $sum += $digit;
                $should_double = !$should_double;
            }

            if (($sum % 10) !== 0) {
                return ["error" => "Invalid Card Number: The card number failed the Luhn algorithm validation check."];
            }

            // 2. Validate Expiry Date
            if (!preg_match('/^(0[1-9]|1[0-2])\s*\/\s*([0-9]{2})$/', trim($expiry_date), $matches)) {
                return ["error" => "Invalid Expiry Date format: Must be MM / YY."];
            }

            $exp_month = (int)$matches[1];
            $exp_year = (int)("20" . $matches[2]);
            $current_year = (int)date('Y');
            $current_month = (int)date('n');

            if ($exp_year < $current_year || ($exp_year === $current_year && $exp_month < $current_month)) {
                return ["error" => "Invalid Expiry Date: This credit card has expired."];
            }

            // 3. Validate CVV
            $clean_cvv = preg_replace('/\D/', '', $cvv);
            if (strlen($clean_cvv) !== 3 && strlen($clean_cvv) !== 4) {
                return ["error" => "Invalid CVV: CVV must be 3 or 4 digits."];
            }
        }

        $stmt = $this->pdo->prepare("UPDATE job SET payment_status = ? WHERE job_ID = ?");
        $stmt->execute([$status, $job_ID]);

        if ($status === 'paid') {
            // Find all applications in 'pending_payment' status for this job
            $stmt = $this->pdo->prepare("
                SELECT a.application_ID, u.email, u.name, j.title
                FROM application a
                JOIN student s ON a.student_ID = s.student_ID
                JOIN users u ON s.user_ID = u.user_ID
                JOIN job j ON a.job_ID = j.job_ID
                WHERE a.job_ID = ? AND a.status = 'pending_payment'
            ");
            $stmt->execute([$job_ID]);
            $pending_apps = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($pending_apps) > 0) {
                // Update applications to 'accepted'
                $stmt = $this->pdo->prepare("UPDATE application SET status = 'accepted' WHERE job_ID = ? AND status = 'pending_payment'");
                $stmt->execute([$job_ID]);

                // Update job status to 'in_progress'
                $stmt = $this->pdo->prepare("UPDATE job SET status = 'in_progress', assigned_time = NOW() WHERE job_ID = ?");
                $stmt->execute([$job_ID]);

                // Send email notifications to students
                foreach ($pending_apps as $app) {
                    $email_body = applicationStatusEmail(
                        $app['name'],
                        $app['title'],
                        'accepted'
                    );
                    sendEmail($app['email'], "GigConnect - Application Update", $email_body);
                }
            }
        }

        return [
            "success" => "Job payment status updated successfully!",
            "job_ID" => $job_ID,
            "payment_status" => $status
        ];
    }

    public function getMyApplications($user) {
        if ($user->role !== 'student') {
            return ["error" => "Unauthorized! Only students can view their applications."];
        }

        $student_ID = $this->ensureStudentProfile($user->user_ID);

        $stmt = $this->pdo->prepare("
            SELECT a.application_ID, a.job_ID, a.status, a.applied_date, a.delivery_needed,
                   j.title as job_title, j.payment as job_payment, j.job_type, j.description as job_description, j.deadline as job_deadline, j.status as job_status, j.skills as job_skills, j.is_product_based,
                   u.name as client_name, u.user_ID as client_user_ID, jp.address as provider_address,
                   (SELECT ROUND(AVG(score), 1) FROM rate_review WHERE given_to = u.user_ID) AS provider_rating,
                   d.delivery_ID, d.status AS delivery_status, d.otp AS delivery_otp, d.otp_expiry AS delivery_otp_expiry, d.delivery_type, d.pickup_address, d.delivery_address,
                   u2.name AS delivery_staff_name, u2.phone AS delivery_staff_phone,
                   (SELECT COUNT(*) FROM rate_review WHERE job_ID = a.job_ID AND given_by = ? AND given_to = u.user_ID) AS student_reviewed
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            JOIN job_provider jp ON j.provider_ID = jp.provider_ID
            JOIN users u ON jp.user_ID = u.user_ID
            LEFT JOIN delivery d ON d.delivery_ID = (
                SELECT d2.delivery_ID 
                FROM delivery d2 
                WHERE d2.job_ID = a.job_ID AND d2.sender_std_ID = ? 
                ORDER BY d2.delivery_ID DESC 
                LIMIT 1
            )
            LEFT JOIN users u2 ON d.delivery_person_ID = u2.user_ID
            WHERE a.student_ID = ?
            ORDER BY a.applied_date DESC
        ");
        $stmt->execute([$user->user_ID, $user->user_ID, $student_ID]);
        $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($applications as &$app) {
            $app['job_category'] = $this->getCategory($app['job_title'], $app['job_skills'] ?? '');
        }

        return [
            "success" => true,
            "applications" => $applications
        ];
    }

    public function getJobs($filters, $currentUser = null) {
        $category = $filters['category'] ?? null;
        $job_type = $filters['job_type'] ?? null;
        $min_payment = $filters['min_payment'] ?? null;
        $max_payment = $filters['max_payment'] ?? null;
        $skills = $filters['skills'] ?? null;
        $all = $filters['all'] ?? null;
        $status = $filters['status'] ?? null;

        $provider_ID = null;
        if ($currentUser && $currentUser->role === 'job_provider') {
            $provider_ID = $this->ensureProviderProfile($currentUser->user_ID);
        }

        $query = "SELECT j.*, u.name AS provider_name, u.email AS provider_email, u.phone AS provider_phone,
                         jp.nic AS provider_nic, jp.business_reg_no AS provider_business_reg_no,
                         jp.type AS provider_business_type, jp.is_verified AS provider_is_verified,
                         jp.address AS provider_address,
                         (SELECT ROUND(AVG(score), 1) FROM rate_review WHERE given_to = u.user_ID) AS provider_rating
                  FROM job j 
                  LEFT JOIN job_provider jp ON j.provider_ID = jp.provider_ID
                  LEFT JOIN users u ON jp.user_ID = u.user_ID 
                  WHERE 1=1";

        if (!$all && !$status) {
            if ($provider_ID) {
                $query .= " AND (j.status = 'active' OR j.provider_ID = " . $this->pdo->quote($provider_ID) . ")";
            } else {
                $query .= " AND j.status = 'active'";
            }
        } else if ($status) {
            $query .= " AND j.status = '$status'";
        }

        if ($job_type) {
            $query .= " AND j.job_type = '$job_type'";
        }

        if ($min_payment) {
            $query .= " AND j.payment >= '$min_payment'";
        }

        if ($max_payment) {
            $query .= " AND j.payment <= '$max_payment'";
        }

        if ($skills) {
            $query .= " AND j.skills LIKE '%$skills%'";
        }

        $query .= " ORDER BY j.is_boosted DESC, j.created_at DESC";

        $stmt = $this->pdo->query($query);
        $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$jobs) {
            return ["message" => "No jobs found!"];
        }

        foreach ($jobs as &$job) {
            $job['category'] = $this->getCategory($job['title'], $job['skills'] ?? '');
        }

        return [
            "success" => true,
            "jobs" => $jobs
        ];
    }

    public function getApplicants($job_ID, $user) {
        if($user->role !== 'job_provider') {
            return ["error" => "Unauthorized!"];
        }

        if(!$job_ID) {
            return ["error" => "Job ID is required!"];
        }

        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND provider_ID = (SELECT provider_ID FROM job_provider WHERE user_ID = ?)");
        $stmt->execute([$job_ID, $user->user_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$job) {
            return ["error" => "Job not found!"];
        }

        $stmt = $this->pdo->prepare("
            SELECT a.application_ID, a.status, a.applied_date, a.job_ID,
                   s.student_ID, s.skills, s.rating, s.year, s.degree, s.bio, s.languages, s.gender,
                   (SELECT COUNT(*) FROM application a2 JOIN job j2 ON a2.job_ID = j2.job_ID WHERE a2.student_ID = s.student_ID AND (LOWER(a2.status) = 'completed' OR LOWER(j2.status) = 'completed')) AS completed_jobs_count,
                   (SELECT GROUP_CONCAT(j3.title SEPARATOR ', ') FROM application a3 JOIN job j3 ON a3.job_ID = j3.job_ID WHERE a3.student_ID = s.student_ID AND (LOWER(a3.status) = 'completed' OR LOWER(j3.status) = 'completed')) AS completed_jobs_list,
                   u.name, u.email, u.user_ID AS student_user_ID,
                   j.is_product_based,
                   (SELECT COUNT(*) FROM rate_review WHERE job_ID = a.job_ID AND given_by = ? AND given_to = u.user_ID) AS provider_reviewed
            FROM application a
            JOIN job j ON a.job_ID = j.job_ID
            JOIN student s ON a.student_ID = s.student_ID
            JOIN users u ON s.user_ID = u.user_ID
            WHERE a.job_ID = ?
        ");
        $stmt->execute([$user->user_ID, $job_ID]);
        $applicants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if(!$applicants) {
            return ["message" => "No applicants found!"];
        }

        // Rank applicants based on skill match score, response time, rating history, and past performance
        $job_skills = array_filter(array_map('trim', explode(',', strtolower($job['skills'] ?? ''))));
        $job_created_time = strtotime($job['created_at'] ?? $job['applied_date'] ?? date('Y-m-d H:i:s'));

        foreach ($applicants as &$app) {
            // 1. Skill Match Score (up to 40 points)
            $skill_score = 0;
            if (!empty($job_skills)) {
                $student_skills = array_filter(array_map('trim', explode(',', strtolower($app['skills'] ?? ''))));
                $matched_skills = array_intersect($job_skills, $student_skills);
                $match_ratio = count($matched_skills) / count($job_skills);
                $skill_score = $match_ratio * 40;
            } else {
                $skill_score = 40; // No specific skills required, full match score
            }

            // 2. Rating History (up to 30 points)
            $rating = floatval($app['rating'] ?? 0);
            if ($rating <= 0) {
                $rating = 4.0; // Default rating for new users to prevent unfair penalty
            }
            $rating_score = ($rating / 5) * 30;

            // 3. Past Performance / Completed Gigs (up to 20 points)
            $completed_count = intval($app['completed_jobs_count'] ?? 0);
            $performance_score = min($completed_count * 5, 20); // 5 points per gig, max 20 points

            // 4. Response Time (up to 10 points)
            // Time difference in hours between job creation and application date
            $app_time = strtotime($app['applied_date']);
            $diff_hours = max(0, ($app_time - $job_created_time) / 3600);
            if ($diff_hours <= 1) {
                $response_score = 10;
            } elseif ($diff_hours <= 6) {
                $response_score = 8;
            } elseif ($diff_hours <= 24) {
                $response_score = 6;
            } elseif ($diff_hours <= 72) {
                $response_score = 4;
            } else {
                $response_score = 2;
            }

            // Calculate final matching score
            $match_score = $skill_score + $rating_score + $performance_score + $response_score;
            $app['match_score'] = round($match_score, 1);
        }

        // Sort applicants by match_score descending, and secondarily by application date ascending
        usort($applicants, function($a, $b) {
            if (abs($a['match_score'] - $b['match_score']) < 0.001) {
                return strtotime($a['applied_date']) - strtotime($b['applied_date']);
            }
            return ($b['match_score'] - $a['match_score']) > 0 ? 1 : -1;
        });

        return [
            "success" => true,
            "applicants" => $applicants
        ];
    }

    public function applyJob($data, $user) {
        if ($user->role !== 'student') {
            return ["error" => "Only students can apply for jobs!"];
        }

        $job_ID = $data['job_ID'] ?? null;
        $delivery_needed = isset($data['delivery_needed']) ? $data['delivery_needed'] : null;

        if (!$job_ID) {
            return ["error" => "Job ID is required!"];
        }

        $stmt = $this->pdo->prepare("SELECT * FROM job WHERE job_ID = ? AND status = 'active'");
        $stmt->execute([$job_ID]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            return ["error" => "Job not found or not active!"];
        }

        if ($job['is_product_based'] == 1) {
            if ($delivery_needed === null || !in_array((int)$delivery_needed, [0, 1], true)) {
                return ["error" => "This is a product-based job. Please specify if delivery is needed."];
            }
            $delivery_needed = (int)$delivery_needed;
        } else {
            $delivery_needed = null;
        }

        $student_ID = $this->ensureStudentProfile($user->user_ID);

        $stmt = $this->pdo->prepare("SELECT * FROM application WHERE job_ID = ? AND student_ID = ?");
        $stmt->execute([$job_ID, $student_ID]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            return ["error" => "You already applied for this job!"];
        }

        $application_ID = $this->generateNextID('application', 'application_ID', 'APP');

        $stmt = $this->pdo->prepare(
            "INSERT INTO application (application_ID, job_ID, student_ID, status, delivery_needed) VALUES (?, ?, ?, 'applied', ?)"
        );
        $stmt->execute([
            $application_ID,
            $job_ID,
            $student_ID,
            $delivery_needed
        ]);

        return [
            "success"        => "Applied successfully!",
            "application_ID" => $application_ID,
            "is_product_based" => (bool)$job['is_product_based']
        ];
    }
}
?>
