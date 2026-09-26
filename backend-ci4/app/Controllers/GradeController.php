<?php

namespace App\Controllers;

use App\Database\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use PDO;

class GradeController
{
    /**
     * GET /api/grades?subject_id=X&class_id=Y
     * Server-side scoping: Guru can only access their assigned subject & class combos
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        $subjectId = (int)($_GET['subject_id'] ?? 0);
        $classId = (int)($_GET['class_id'] ?? 0);

        if ($subjectId <= 0 || $classId <= 0) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'Parameter subject_id dan class_id wajib diisi.'
            ]);
            return;
        }

        $db = Database::connect();

        // 1. DATA SCOPING CHECK FOR GURU (IDOR & Broken Access Control Prevention)
        if ($user['role'] === 'guru') {
            $scopeStmt = $db->prepare("
                SELECT id 
                FROM teacher_assignments 
                WHERE teacher_id = :tid AND subject_id = :sid AND class_id = :cid
            ");
            $scopeStmt->execute([
                ':tid' => $user['id'],
                ':sid' => $subjectId,
                ':cid' => $classId
            ]);

            if (!$scopeStmt->fetch()) {
                http_response_code(403);
                echo json_encode([
                    'status' => 403,
                    'error' => 'Forbidden',
                    'message' => 'Akses ditolak: Anda tidak memiliki wewenang mengajar pada mata pelajaran atau kelas ini.'
                ]);
                return;
            }
        }

        // 1.5 Ensure Default Categories (4 UH + 4 Tugas) exist for this subject + class
        self::ensureDefaultCategories($db, $subjectId, $classId, $user['id']);

        // Fetch grade_categories for this subject + class
        $catStmt = $db->prepare("
            SELECT id, category, label, sort_order 
            FROM grade_categories 
            WHERE subject_id = :sid AND class_id = :cid
            ORDER BY category DESC, sort_order ASC
        ");
        $catStmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $categories = $catStmt->fetchAll();

        // 2. Fetch students and grades for this subject + class
        $query = "
            SELECT 
                s.id as student_id,
                s.full_name,
                s.nisn,
                s.nis,
                s.gender,
                s.absen_number,
                g.id as grade_id,
                g.uh1,
                g.uh2,
                g.uh3,
                g.avg_uh,
                g.uas_teori,
                g.uas_praktik,
                g.final_score,
                g.status_kkm,
                g.competency_notes,
                g.submitted,
                g.updated_at
            FROM students s
            LEFT JOIN grades g ON g.student_id = s.id 
                AND g.subject_id = :sid 
                AND g.class_id = :cid
            WHERE s.class_id = :cid
            ORDER BY s.absen_number ASC, s.full_name ASC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $rows = $stmt->fetchAll();

        // Fetch grade entries mapping: student_id -> category_id -> score
        $entriesStmt = $db->prepare("
            SELECT ge.student_id, ge.grade_category_id, ge.score
            FROM grade_entries ge
            JOIN grade_categories gc ON ge.grade_category_id = gc.id
            WHERE gc.subject_id = :sid AND gc.class_id = :cid
        ");
        $entriesStmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $entriesRows = $entriesStmt->fetchAll();

        $entryMap = [];
        foreach ($entriesRows as $er) {
            $stId = $er['student_id'];
            $catId = $er['grade_category_id'];
            if (!isset($entryMap[$stId])) {
                $entryMap[$stId] = [];
            }
            $entryMap[$stId][$catId] = $er['score'] !== null ? (float)$er['score'] : null;
        }

        $weights = \App\Libraries\GradeCalculator::getWeights($db, $subjectId);

        // Attach category_scores and handle role-restricted NA calculation/stripping
        foreach ($rows as &$row) {
            $stId = $row['student_id'];
            $row['category_scores'] = $entryMap[$stId] ?? [];

            $catScores = $row['category_scores'];
            $uhScores = [];
            $tugasScores = [];
            foreach ($categories as $cat) {
                $cId = $cat['id'];
                if (isset($catScores[$cId]) && $catScores[$cId] !== null) {
                    if ($cat['category'] === 'ulangan_harian') {
                        $uhScores[] = (float)$catScores[$cId];
                    } else if ($cat['category'] === 'tugas') {
                        $tugasScores[] = (float)$catScores[$cId];
                    }
                }
            }

            $avgUh = count($uhScores) > 0 ? array_sum($uhScores) / count($uhScores) : null;
            $avgTugas = count($tugasScores) > 0 ? array_sum($tugasScores) / count($tugasScores) : null;
            $uasTeori = $row['uas_teori'] !== null ? (float)$row['uas_teori'] : null;
            $uasPraktik = $row['uas_praktik'] !== null ? (float)$row['uas_praktik'] : null;
            $uasArr = array_filter([$uasTeori, $uasPraktik], fn($v) => $v !== null);
            $avgUas = count($uasArr) > 0 ? array_sum($uasArr) / count($uasArr) : null;

            $computedNA = \App\Libraries\GradeCalculator::calculateNA($avgUh, $avgTugas, $avgUas, $weights);

            if ($user['role'] === 'guru') {
                // Guru role: strip final_score and na completely from API response
                unset($row['final_score']);
                unset($row['na']);
            } else {
                // Waka, Kepsek, Admin: attach computed NA
                $row['final_score'] = $computedNA;
                $row['na'] = $computedNA;
            }
        }
        unset($row);

        // Check overall submission status for this class & subject
        $statusStmt = $db->prepare("
            SELECT status, submitted_at, updated_at 
            FROM submission_statuses 
            WHERE subject_id = :sid AND class_id = :cid
        ");
        $statusStmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $statusRecord = $statusStmt->fetch();

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'subject_id' => $subjectId,
            'class_id' => $classId,
            'submission_status' => $statusRecord['status'] ?? 'belum_mulai',
            'is_submitted' => ($statusRecord['status'] ?? '') === 'terkirim',
            'categories' => $categories,
            'students' => $rows
        ]);
    }

    public static function ensureDefaultCategories(PDO $db, int $subjectId, int $classId, int $teacherId): void
    {
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM grade_categories WHERE subject_id = :sid AND class_id = :cid");
        $stmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $row = $stmt->fetch();

        if ((int)($row['cnt'] ?? 0) === 0) {
            // Default 4 UH
            for ($i = 1; $i <= 4; $i++) {
                $ins = $db->prepare("INSERT INTO grade_categories (subject_id, class_id, teacher_id, category, label, sort_order) VALUES (:sid, :cid, :tid, 'ulangan_harian', :label, :so)");
                $ins->execute([
                    ':sid' => $subjectId,
                    ':cid' => $classId,
                    ':tid' => $teacherId,
                    ':label' => "UH{$i}",
                    ':so' => $i
                ]);
            }
            // Default 4 Tugas
            for ($i = 1; $i <= 4; $i++) {
                $ins = $db->prepare("INSERT INTO grade_categories (subject_id, class_id, teacher_id, category, label, sort_order) VALUES (:sid, :cid, :tid, 'tugas', :label, :so)");
                $ins->execute([
                    ':sid' => $subjectId,
                    ':cid' => $classId,
                    ':tid' => $teacherId,
                    ':label' => "Tugas{$i}",
                    ':so' => $i
                ]);
            }
        }

        // Ensure all students in this class have grade entries for all categories
        $catsStmt = $db->prepare("SELECT id FROM grade_categories WHERE subject_id = :sid AND class_id = :cid");
        $catsStmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $cats = $catsStmt->fetchAll(PDO::FETCH_COLUMN);

        $studStmt = $db->prepare("SELECT id FROM students WHERE class_id = :cid");
        $studStmt->execute([':cid' => $classId]);
        $students = $studStmt->fetchAll(PDO::FETCH_COLUMN);

        $insEntry = $db->prepare("INSERT OR IGNORE INTO grade_entries (student_id, grade_category_id, score) VALUES (:stid, :catid, NULL)");
        foreach ($students as $stId) {
            foreach ($cats as $catId) {
                $insEntry->execute([':stid' => $stId, ':catid' => $catId]);
            }
        }
    }

    /**
     * POST /api/grade-categories
     * Adds a new column (UH or Tugas) dynamically
     */
    public static function addCategory(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['guru', 'admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $subjectId = (int)($input['subject_id'] ?? 0);
        $classId = (int)($input['class_id'] ?? 0);
        $category = trim($input['category'] ?? ''); // 'ulangan_harian' or 'tugas'

        if ($subjectId <= 0 || $classId <= 0 || !in_array($category, ['ulangan_harian', 'tugas'])) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'Parameter subject_id, class_id, dan category (ulangan_harian/tugas) wajib valid.'
            ]);
            return;
        }

        $db = Database::connect();

        if ($user['role'] === 'guru') {
            $scopeStmt = $db->prepare("SELECT id FROM teacher_assignments WHERE teacher_id = :tid AND subject_id = :sid AND class_id = :cid");
            $scopeStmt->execute([':tid' => $user['id'], ':sid' => $subjectId, ':cid' => $classId]);
            if (!$scopeStmt->fetch()) {
                http_response_code(403);
                echo json_encode(['status' => 403, 'error' => 'Forbidden', 'message' => 'Akses ditolak']);
                return;
            }
        }

        self::ensureDefaultCategories($db, $subjectId, $classId, $user['id']);

        $sortStmt = $db->prepare("SELECT COUNT(*) as cnt FROM grade_categories WHERE subject_id = :sid AND class_id = :cid AND category = :cat");
        $sortStmt->execute([':sid' => $subjectId, ':cid' => $classId, ':cat' => $category]);
        $row = $sortStmt->fetch();
        $nextSort = ((int)($row['cnt'] ?? 0)) + 1;
        $prefix = ($category === 'ulangan_harian') ? 'UH' : 'Tugas';
        $label = $prefix . $nextSort;

        $insCat = $db->prepare("INSERT INTO grade_categories (subject_id, class_id, teacher_id, category, label, sort_order) VALUES (:sid, :cid, :tid, :cat, :label, :so)");
        $insCat->execute([
            ':sid' => $subjectId,
            ':cid' => $classId,
            ':tid' => $user['id'],
            ':cat' => $category,
            ':label' => $label,
            ':so' => $nextSort
        ]);
        $newCatId = $db->lastInsertId();

        $studStmt = $db->prepare("SELECT id FROM students WHERE class_id = :cid");
        $studStmt->execute([':cid' => $classId]);
        $students = $studStmt->fetchAll(PDO::FETCH_COLUMN);

        $insEntry = $db->prepare("INSERT OR IGNORE INTO grade_entries (student_id, grade_category_id, score) VALUES (:stid, :catid, NULL)");
        foreach ($students as $stId) {
            $insEntry->execute([':stid' => $stId, ':catid' => $newCatId]);
        }

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => "Kolom $label berhasil ditambahkan",
            'category' => [
                'id' => (int)$newCatId,
                'subject_id' => $subjectId,
                'class_id' => $classId,
                'category' => $category,
                'label' => $label,
                'sort_order' => $nextSort
            ]
        ]);
    }

    /**
     * DELETE /api/grade-categories/{id}
     * Deletes a dynamic grade column category
     */
    public static function deleteCategory(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['guru', 'admin']);

        $db = Database::connect();
        $stmt = $db->prepare("DELETE FROM grade_categories WHERE id = :id");
        $stmt->execute([':id' => $id]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Kolom berhasil dihapus.'
        ]);
    }

    /**
     * POST /api/grades
     * Saves or updates a student's grade with auto-calculation & server-side validation
     */
    public static function save(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['guru', 'admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $studentId = (int)($input['student_id'] ?? 0);
        $subjectId = (int)($input['subject_id'] ?? 0);
        $classId = (int)($input['class_id'] ?? 0);

        if ($studentId <= 0 || $subjectId <= 0 || $classId <= 0) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'student_id, subject_id, dan class_id wajib valid.'
            ]);
            return;
        }

        $db = Database::connect();

        // 1. Data Scoping Check for Guru
        if ($user['role'] === 'guru') {
            $scopeStmt = $db->prepare("
                SELECT id 
                FROM teacher_assignments 
                WHERE teacher_id = :tid AND subject_id = :sid AND class_id = :cid
            ");
            $scopeStmt->execute([
                ':tid' => $user['id'],
                ':sid' => $subjectId,
                ':cid' => $classId
            ]);

            if (!$scopeStmt->fetch()) {
                http_response_code(403);
                echo json_encode([
                    'status' => 403,
                    'error' => 'Forbidden',
                    'message' => 'Akses ditolak: Anda tidak memiliki hak menginput nilai pada mata pelajaran atau kelas ini.'
                ]);
                return;
            }
        }

        // 2. Lock check: If already submitted, reject edits unless returned by waka
        $checkLock = $db->prepare("
            SELECT submitted 
            FROM grades 
            WHERE student_id = :stid AND subject_id = :sid AND class_id = :cid
        ");
        $checkLock->execute([':stid' => $studentId, ':sid' => $subjectId, ':cid' => $classId]);
        $existing = $checkLock->fetch();

        if ($existing && (int)$existing['submitted'] === 1 && $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'status' => 403,
                'error' => 'Forbidden',
                'message' => 'Nilai telah diserahkan dan terkunci (Read-Only). Hubungi Waka Kurikulum untuk pengajuan revisi.'
            ]);
            return;
        }

        // 3. Extract and Validate Input Scores (0 - 100 or null)
        $validateScore = function ($val) {
            if ($val === null || $val === '') return null;
            $num = (float)$val;
            return max(0, min(100, $num));
        };

        $uh1 = isset($input['uh1']) ? $validateScore($input['uh1']) : null;
        $uh2 = isset($input['uh2']) ? $validateScore($input['uh2']) : null;
        $uh3 = isset($input['uh3']) ? $validateScore($input['uh3']) : null;
        $uasTeori = isset($input['uas_teori']) ? $validateScore($input['uas_teori']) : null;
        $uasPraktik = isset($input['uas_praktik']) ? $validateScore($input['uas_praktik']) : null;
        $notes = htmlspecialchars(trim($input['competency_notes'] ?? ''), ENT_QUOTES, 'UTF-8');

        // 4. Auto-calculation: (avg(UH) * 0.4) + (avg(UAS) * 0.6)
        $uhArr = array_filter([$uh1, $uh2, $uh3], fn($v) => $v !== null);
        $avgUh = count($uhArr) > 0 ? array_sum($uhArr) / count($uhArr) : null;

        $uasArr = array_filter([$uasTeori, $uasPraktik], fn($v) => $v !== null);
        $avgUas = count($uasArr) > 0 ? array_sum($uasArr) / count($uasArr) : null;

        $finalScore = null;
        if ($avgUh !== null && $avgUas !== null) {
            $finalScore = round(($avgUh * 0.4) + ($avgUas * 0.6), 2);
        } elseif ($avgUh !== null) {
            $finalScore = round($avgUh, 2);
        } elseif ($avgUas !== null) {
            $finalScore = round($avgUas, 2);
        }

        // KKM check
        $subjStmt = $db->prepare("SELECT kkm, name FROM subjects WHERE id = :id");
        $subjStmt->execute([':id' => $subjectId]);
        $subj = $subjStmt->fetch();
        $kkm = $subj ? (float)$subj['kkm'] : 75.00;

        $statusKkm = 'Belum Dinilai';
        if ($finalScore !== null) {
            $statusKkm = $finalScore >= $kkm ? 'Tuntas' : 'Remedial';
        }

        // 5. Upsert into database
        $upsertStmt = $db->prepare("
            INSERT INTO grades (
                student_id, subject_id, teacher_id, class_id,
                uh1, uh2, uh3, avg_uh, uas_teori, uas_praktik,
                final_score, status_kkm, competency_notes, semester, academic_year, submitted, updated_at
            ) VALUES (
                :stid, :sid, :tid, :cid,
                :uh1, :uh2, :uh3, :avg_uh, :uas_t, :uas_p,
                :final, :status_kkm, :notes, 'genap', '2024/2025', 0, CURRENT_TIMESTAMP
            )
            ON CONFLICT(student_id, subject_id, semester, academic_year) DO UPDATE SET
                uh1 = excluded.uh1,
                uh2 = excluded.uh2,
                uh3 = excluded.uh3,
                avg_uh = excluded.avg_uh,
                uas_teori = excluded.uas_teori,
                uas_praktik = excluded.uas_praktik,
                final_score = excluded.final_score,
                status_kkm = excluded.status_kkm,
                competency_notes = excluded.competency_notes,
                teacher_id = excluded.teacher_id,
                updated_at = CURRENT_TIMESTAMP
        ");

        $upsertStmt->execute([
            ':stid' => $studentId,
            ':sid' => $subjectId,
            ':tid' => $user['id'],
            ':cid' => $classId,
            ':uh1' => $uh1,
            ':uh2' => $uh2,
            ':uh3' => $uh3,
            ':avg_uh' => $avgUh !== null ? round($avgUh, 2) : null,
            ':uas_t' => $uasTeori,
            ':uas_p' => $uasPraktik,
            ':final' => $finalScore,
            ':status_kkm' => $statusKkm,
            ':notes' => $notes,
        ]);

        // 6. Audit Logging if score changed
        if ($existing && $existing['final_score'] !== $finalScore) {
            $stStmt = $db->prepare("SELECT full_name FROM students WHERE id = :id");
            $stStmt->execute([':id' => $studentId]);
            $student = $stStmt->fetch();

            $clStmt = $db->prepare("SELECT name FROM classes WHERE id = :id");
            $clStmt->execute([':id' => $classId]);
            $cls = $clStmt->fetch();

            $auditStmt = $db->prepare("
                INSERT INTO grade_audit_logs (
                    changed_by, changed_by_role, student_name, subject_name, class_name,
                    old_score, new_score, field, reason, changed_at
                ) VALUES (
                    :by, :role, :st_name, :subj_name, :cls_name,
                    :old_s, :new_s, 'Komponen Nilai Formatif/Sumatif', 'Update nilai via REST API', CURRENT_TIMESTAMP
                )
            ");
            $auditStmt->execute([
                ':by' => $user['name'],
                ':role' => $user['role'],
                ':st_name' => $student['full_name'] ?? 'Siswa',
                ':subj_name' => $subj['name'] ?? 'Mapel',
                ':cls_name' => $cls['name'] ?? 'Kelas',
                ':old_s' => $existing['final_score'],
                ':new_s' => $finalScore,
            ]);
        }

        // Update submission status to 'sedang_diisi'
        $updateStatus = $db->prepare("
            INSERT INTO submission_statuses (teacher_id, subject_id, class_id, status, updated_at)
            VALUES (:tid, :sid, :cid, 'sedang_diisi', CURRENT_TIMESTAMP)
            ON CONFLICT(teacher_id, subject_id, class_id) DO UPDATE SET
                status = CASE WHEN submission_statuses.status != 'terkirim' THEN 'sedang_diisi' ELSE submission_statuses.status END,
                updated_at = CURRENT_TIMESTAMP
        ");
        $updateStatus->execute([':tid' => $user['id'], ':sid' => $subjectId, ':cid' => $classId]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Nilai berhasil disimpan.',
            'calculated' => [
                'avg_uh' => $avgUh !== null ? round($avgUh, 2) : null,
                'final_score' => $finalScore,
                'status_kkm' => $statusKkm,
            ]
        ]);
    }

    /**
     * POST /api/grades/submit
     * Blocks submit server-side if any score is missing
     */
    public static function submit(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['guru', 'admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $subjectId = (int)($input['subject_id'] ?? 0);
        $classId = (int)($input['class_id'] ?? 0);

        if ($subjectId <= 0 || $classId <= 0) {
            http_response_code(422);
            echo json_encode(['status' => 422, 'error' => 'subject_id dan class_id wajib diisi.']);
            return;
        }

        $db = Database::connect();

        // 1. Data scoping check
        if ($user['role'] === 'guru') {
            $scope = $db->prepare("
                SELECT id 
                FROM teacher_assignments 
                WHERE teacher_id = :tid AND subject_id = :sid AND class_id = :cid
            ");
            $scope->execute([':tid' => $user['id'], ':sid' => $subjectId, ':cid' => $classId]);
            if (!$scope->fetch()) {
                http_response_code(403);
                echo json_encode([
                    'status' => 403,
                    'error' => 'Forbidden',
                    'message' => 'Akses ditolak: Anda tidak ditugaskan pada rombel ini.'
                ]);
                return;
            }
        }

        // 2. SERVER-SIDE VALIDATION: Check for blank/missing student scores
        $checkStmt = $db->prepare("
            SELECT s.full_name, s.nisn, g.uh1, g.uh2, g.uh3, g.uas_teori, g.uas_praktik
            FROM students s
            LEFT JOIN grades g ON g.student_id = s.id 
                AND g.subject_id = :sid 
                AND g.class_id = :cid
            WHERE s.class_id = :cid
        ");
        $checkStmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $students = $checkStmt->fetchAll();

        $missingStudents = [];
        foreach ($students as $st) {
            if (
                $st['uh1'] === null || $st['uh2'] === null || $st['uh3'] === null ||
                $st['uas_teori'] === null || $st['uas_praktik'] === null
            ) {
                $missingStudents[] = "{$st['full_name']} (NISN: {$st['nisn']})";
            }
        }

        if (!empty($missingStudents)) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'Penyerahan nilai ditolak: Terdapat ' . count($missingStudents) . ' siswa dengan nilai belum lengkap.',
                'missing_students' => $missingStudents
            ]);
            return;
        }

        // 3. Lock all grades for this subject & class
        $lockStmt = $db->prepare("
            UPDATE grades 
            SET submitted = 1, updated_at = CURRENT_TIMESTAMP 
            WHERE subject_id = :sid AND class_id = :cid
        ");
        $lockStmt->execute([':sid' => $subjectId, ':cid' => $classId]);

        // 4. Update submission status to 'terkirim'
        $statusStmt = $db->prepare("
            INSERT INTO submission_statuses (teacher_id, subject_id, class_id, status, submitted_at, updated_at)
            VALUES (:tid, :sid, :cid, 'terkirim', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(teacher_id, subject_id, class_id) DO UPDATE SET
                status = 'terkirim',
                submitted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
        ");
        $statusStmt->execute([':tid' => $user['id'], ':sid' => $subjectId, ':cid' => $classId]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Nilai rapor berhasil dikirim dan terkunci untuk verifikasi Waka Kurikulum.',
            'submitted_at' => date('d M Y H:i:s') . ' WIB'
        ]);
    }
}
