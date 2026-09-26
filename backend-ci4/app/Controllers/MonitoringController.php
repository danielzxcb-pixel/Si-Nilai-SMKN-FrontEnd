<?php

namespace App\Controllers;

use App\Database\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use PDO;

class MonitoringController
{
    /**
     * GET /api/monitoring/stats?subject_id=X&class_id=Y
     * Restricted to Waka, Kepsek, Admin
     */
    public static function stats(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['waka', 'kepsek', 'admin']);

        $subjectId = (int)($_GET['subject_id'] ?? 0);
        $classId = (int)($_GET['class_id'] ?? 0);

        if ($subjectId <= 0 || $classId <= 0) {
            http_response_code(422);
            echo json_encode(['status' => 422, 'error' => 'subject_id dan class_id wajib diisi.']);
            return;
        }

        $db = Database::connect();

        // 1. Fetch class students and their scores
        $stmt = $db->prepare("
            SELECT g.final_score, s.kkm 
            FROM students st
            JOIN subjects s ON s.id = :sid
            LEFT JOIN grades g ON g.student_id = st.id AND g.subject_id = :sid AND g.class_id = :cid
            WHERE st.class_id = :cid
        ");
        $stmt->execute([':sid' => $subjectId, ':cid' => $classId]);
        $rows = $stmt->fetchAll();

        $scores = [];
        $tuntasCount = 0;
        $kkm = $rows[0]['kkm'] ?? 75.00;

        foreach ($rows as $r) {
            if ($r['final_score'] !== null) {
                $sc = (float)$r['final_score'];
                $scores[] = $sc;
                if ($sc >= $kkm) {
                    $tuntasCount++;
                }
            }
        }

        $totalStudents = count($rows);
        $highest = count($scores) > 0 ? max($scores) : 0;
        $lowest = count($scores) > 0 ? min($scores) : 0;
        $average = count($scores) > 0 ? round(array_sum($scores) / count($scores), 1) : 0;
        $absorptionRate = $totalStudents > 0 ? round(($tuntasCount / $totalStudents) * 100, 1) : 0;

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'stats' => [
                'total_students' => $totalStudents,
                'highest' => $highest,
                'lowest' => $lowest,
                'average' => $average,
                'tuntas_count' => $tuntasCount,
                'absorption_rate' => $absorptionRate,
            ]
        ]);
    }

    /**
     * POST /api/monitoring/deadline
     * RESTRICTED SERVER-SIDE TO WAKA, KEPSEK, ADMIN!
     * Guru calling this MUST BE REJECTED with 403 Forbidden!
     */
    public static function setDeadline(): void
    {
        $user = AuthMiddleware::authenticate();
        // Server-side enforcement: Rejects guru!
        RoleMiddleware::authorize($user, ['waka', 'kepsek', 'admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $subjectId = (int)($input['subject_id'] ?? 0);
        $deadline = trim($input['deadline'] ?? '');

        if ($subjectId <= 0 || empty($deadline)) {
            http_response_code(422);
            echo json_encode(['status' => 422, 'error' => 'subject_id dan deadline wajib diisi.']);
            return;
        }

        $db = Database::connect();
        $stmt = $db->prepare("
            INSERT INTO submission_deadlines (subject_id, semester, academic_year, deadline, set_by)
            VALUES (:sid, 'genap', '2024/2025', :dl, :by)
        ");
        $stmt->execute([
            ':sid' => $subjectId,
            ':dl' => $deadline,
            ':by' => $user['name'] . ' (' . strtoupper($user['role']) . ')',
        ]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Batas waktu penyerahan nilai berhasil ditetapkan oleh ' . $user['name'] . '.'
        ]);
    }

    /**
     * POST /api/monitoring/return-revision
     * "Kirim Balik": Flips submitted to 0, updates status to sedang_diisi, records note in grade_audit_logs
     */
    public static function returnRevision(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['waka', 'kepsek', 'admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $subjectId = (int)($input['subject_id'] ?? 0);
        $classId = (int)($input['class_id'] ?? 0);
        $reason = htmlspecialchars(trim($input['reason'] ?? ''), ENT_QUOTES, 'UTF-8');

        if ($subjectId <= 0 || $classId <= 0 || empty($reason)) {
            http_response_code(422);
            echo json_encode(['status' => 422, 'error' => 'subject_id, class_id, dan catatan revisi wajib diisi.']);
            return;
        }

        $db = Database::connect();

        // 1. Unlock grades
        $unlock = $db->prepare("
            UPDATE grades 
            SET submitted = 0, updated_at = CURRENT_TIMESTAMP 
            WHERE subject_id = :sid AND class_id = :cid
        ");
        $unlock->execute([':sid' => $subjectId, ':cid' => $classId]);

        // 2. Set submission status to sedang_diisi
        $status = $db->prepare("
            UPDATE submission_statuses 
            SET status = 'sedang_diisi', updated_at = CURRENT_TIMESTAMP 
            WHERE subject_id = :sid AND class_id = :cid
        ");
        $status->execute([':sid' => $subjectId, ':cid' => $classId]);

        // 3. Log into grade_audit_logs
        $audit = $db->prepare("
            INSERT INTO grade_audit_logs (
                changed_by, changed_by_role, student_name, subject_name, class_name,
                old_score, new_score, field, reason, changed_at
            ) VALUES (
                :by, :role, 'Seluruh Rombel', 
                (SELECT name FROM subjects WHERE id = :sid), 
                (SELECT name FROM classes WHERE id = :cid),
                NULL, NULL, 'Status Penyerahan Rapor', :reason, CURRENT_TIMESTAMP
            )
        ");
        $audit->execute([
            ':by' => $user['name'],
            ':role' => $user['role'],
            ':sid' => $subjectId,
            ':cid' => $classId,
            ':reason' => 'Dikembalikan untuk revisi: "' . $reason . '"'
        ]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Nilai berhasil dikembalikan ke Guru pengajar untuk direvisi.',
            'logged_reason' => $reason
        ]);
    }
}
