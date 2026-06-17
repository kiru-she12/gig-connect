<?php
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include '../../config/db.php';
include '../../middleware/auth.php';

class SmartRecommendations {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    private function parseSkills($skills_str) {
        if (empty($skills_str)) return [];
        $decoded = json_decode($skills_str, true);
        if (is_array($decoded)) {
            return array_map('strtolower', array_map('trim', $decoded));
        }
        return array_filter(array_map('strtolower', array_map('trim', explode(',', $skills_str))));
    }

    /**
     * Compute skill match score between student skills and job skills.
     * Uses Jaccard-like overlap: intersection / max(student_skills, job_skills)
     * Returns 0.0–1.0
     */
    private function computeSkillMatch(array $student_skills, array $job_skills): float {
        if (empty($student_skills) || empty($job_skills)) return 0.0;
        $intersect = array_intersect($student_skills, $job_skills);
        $union = count(array_unique(array_merge($student_skills, $job_skills)));
        return $union > 0 ? count($intersect) / $union : 0.0;
    }

    /**
     * Compute job type preference match.
     * Checks explicit preference field AND inferred preference from past job history.
     * Returns 0.0–1.0
     */
    private function computeJobTypeMatch(string $job_type, string $explicit_pref, array $past_job_types): float {
        $job_type = strtolower(trim($job_type));
        $score = 0.0;

        // Explicit preference in profile (e.g. student set "Remote" in settings)
        if (!empty($explicit_pref)) {
            $pref_lower = strtolower(trim($explicit_pref));
            // preference might be a category like "Web Dev" or a type like "remote/onsite"
            if ($pref_lower === $job_type || 
                ($pref_lower === 'remote' && $job_type === 'remote') ||
                ($pref_lower === 'onsite' && $job_type === 'onsite')) {
                $score += 0.5;
            }
        }

        // Inferred preference from past application history
        if (!empty($past_job_types)) {
            $type_counts = array_count_values(array_map('strtolower', $past_job_types));
            $total = array_sum($type_counts);
            $match_count = $type_counts[$job_type] ?? 0;
            // Proportion of past jobs matching this type (up to 0.5)
            $score += ($total > 0) ? min(0.5, ($match_count / $total) * 0.5) : 0.0;
        }

        return min(1.0, $score);
    }

    /**
     * Compute rating-based score component.
     * Rating 0: penalty for new student. Rating 1-5: scaled contribution.
     * Returns 0.0–1.0
     */
    private function computeRatingScore(float $rating, int $completed_count): float {
        if ($completed_count === 0) return 0.5; // neutral for new students
        // For experienced students: normalize rating (0-5) to 0-1, with a floor of 0.2
        return max(0.2, $rating / 5.0);
    }

    public function getRecommendations($data, $user) {
        if ($user->role !== 'student') {
            return ["error" => "Unauthorized! Only students can receive recommendations."];
        }

        // ── 1. FETCH STUDENT PROFILE ──────────────────────────────────────────────
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
        $is_new_student  = ($student['year'] === '' || $student['year'] === null);

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
                // Track preferred types even from accepted (not yet completed)
                $past_job_types[] = strtolower($h['job_type']);
            }
            if ($h['status'] === 'no_show') {
                $no_shows++;
            }
        }

        // Merge past job skills into effective student skills for richer matching
        $effective_skills = array_unique(array_merge($student_skills, $past_job_skills));

        // ── 3. FETCH ACTIVE UNAPPLIED JOBS ───────────────────────────────────────
        $stmt_jobs = $this->pdo->prepare("
            SELECT j.*
            FROM job j
            WHERE j.status = 'active'
              AND (j.deadline IS NULL OR j.deadline >= NOW())
              AND j.job_ID NOT IN (
                  SELECT job_ID FROM application WHERE student_ID = ?
              )
            ORDER BY j.is_boosted DESC, j.created_at DESC
        ");
        $stmt_jobs->execute([$student_ID]);
        $jobs = $stmt_jobs->fetchAll(PDO::FETCH_ASSOC);

        // ── 4. WEIGHT CONFIGURATION ──────────────────────────────────────────────
        //
        //  NEW STUDENT  (0 completed jobs):
        //    60% skill match  +  30% preference/type match  +  10% boost bonus
        //
        //  RETURNING STUDENT  (1+ completed):
        //    45% skill match  +  25% job-type history match  +  20% rating  +  10% preference  +  bonus
        //
        $recommended = [];

        foreach ($jobs as $job) {
            $job_skills = $this->parseSkills($job['skills'] ?? '');
            $job_type   = strtolower(trim($job['job_type'] ?? ''));
            $is_boosted = isset($job['is_boosted']) && $job['is_boosted'] == 1;

            // Skill match (uses effective_skills = student skills + past job skills)
            $skill_score = $this->computeSkillMatch($effective_skills, $job_skills);

            // Job-type preference match
            $type_score = $this->computeJobTypeMatch($job_type, $explicit_pref, $past_job_types);

            // Rating contribution
            $rating_score = $this->computeRatingScore($rating, $completed_count);

            // Compose final weighted score
            if ($completed_count === 0) {
                // New student – no rating weight, rely on skills + preferences
                $raw_score = ($skill_score * 0.65) + ($type_score * 0.35);
            } else {
                // Returning student – bring rating into the mix
                $raw_score = ($skill_score * 0.50)
                           + ($type_score  * 0.25)
                           + ($rating_score * 0.25);
            }

            // Boost bonus: featured jobs get +8% lift
            if ($is_boosted) {
                $raw_score = min(1.0, $raw_score + 0.08);
            }

            // No-show penalty: –5% per no-show, floored at 0
            $raw_score = max(0.0, $raw_score - ($no_shows * 0.05));

            // Convert to percentage (0–100)
            $match_percentage = round($raw_score * 100, 1);

            // ── 5. PERSIST TO recommendation TABLE ───────────────────────────────
            $score_db = round($raw_score * 10, 2); // keep DB value on 0-10 scale

            $stmt_check = $this->pdo->prepare("SELECT recommendation_ID FROM recommendation WHERE student_ID = ? AND job_ID = ?");
            $stmt_check->execute([$student_ID, $job['job_ID']]);
            $existing_id = $stmt_check->fetchColumn();

            if ($existing_id) {
                $stmt_upd = $this->pdo->prepare("UPDATE recommendation SET match_score = ? WHERE recommendation_ID = ?");
                $stmt_upd->execute([$score_db, $existing_id]);
            } else {
                $stmt_cnt = $this->pdo->query("SELECT COUNT(*) FROM recommendation");
                $cnt = $stmt_cnt->fetchColumn();
                $rec_id = 'REC' . str_pad($cnt + 1, 3, '0', STR_PAD_LEFT);
                $stmt_ins = $this->pdo->prepare("INSERT INTO recommendation (recommendation_ID, student_ID, job_ID, match_score) VALUES (?, ?, ?, ?)");
                $stmt_ins->execute([$rec_id, $student_ID, $job['job_ID'], $score_db]);
            }

            // Determine recommendation reason label
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
                "match_score"     => $match_percentage,      // 0–100 %
                "match_reasons"   => $reasons,
                "is_new_student"  => $completed_count === 0,
                "student_rating"  => $rating,
            ];
        }

        // ── 6. SORT: by match_score DESC, boosted first on ties ──────────────────
        usort($recommended, function($a, $b) {
            if ($a['match_score'] == $b['match_score']) {
                return $b['is_boosted'] <=> $a['is_boosted'];
            }
            return $b['match_score'] <=> $a['match_score'];
        });

        // Meta info for the frontend
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
}

$user   = authenticate();
$data   = json_decode(file_get_contents("php://input"), true) ?? [];
$obj    = new SmartRecommendations($pdo);
$result = $obj->getRecommendations($data, $user);
echo json_encode($result);
?>
