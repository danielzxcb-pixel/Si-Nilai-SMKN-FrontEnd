<?php

namespace App\Controllers;

use App\Database\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use PDO;

class ArchiveController
{
    /**
     * GET /api/archive/student-grades?student_id=X&semester=Y
     * Semester History: Genap-only yearly calculation
     */
    public static function studentGrades(): void
    {
        $user = AuthMiddleware::authenticate();
        $studentId = (int)($_GET['student_id'] ?? 0);
        $semester = strtolower(trim($_GET['semester'] ?? 'genap'));

        if ($studentId <= 0) {
            http_response_code(422);
            echo json_encode(['status' => 422, 'error' => 'student_id wajib diisi.']);
            return;
        }

        $db = Database::connect();

        // Fetch current semester grades
        $stmt = $db->prepare("
            SELECT g.*, s.name as subject_name, s.code as subject_code
            FROM grades g
            JOIN subjects s ON s.id = g.subject_id
            WHERE g.student_id = :id AND g.semester = :sem
        ");
        $stmt->execute([':id' => $studentId, ':sem' => $semester]);
        $currentGrades = $stmt->fetchAll();

        $results = [];

        foreach ($currentGrades as $cg) {
            $yearlyAvg = null;
            $ganjilStatus = 'Tersedia';

            if ($semester === 'ganjil') {
                // Rule 10: While semester = 'ganjil': API returns no yearly/combined average
                $yearlyAvg = null;
                $ganjilStatus = 'Semester Ganjil Berjalan';
            } else {
                // Rule 10: While semester = 'genap': API joins matching academic_year + ganjil grades
                $gStmt = $db->prepare("
                    SELECT final_score 
                    FROM grades 
                    WHERE student_id = :id AND subject_id = :sid AND semester = 'ganjil'
                ");
                $gStmt->execute([':id' => $studentId, ':sid' => $cg['subject_id']]);
                $ganjilRec = $gStmt->fetch();

                if (!$ganjilRec || $ganjilRec['final_score'] === null) {
                    $yearlyAvg = null;
                    $ganjilStatus = 'Data ganjil belum tersedia';
                } else {
                    $yearlyAvg = round(((float)$ganjilRec['final_score'] + (float)$cg['final_score']) / 2, 2);
                }
            }

            $results[] = [
                'subject_id' => $cg['subject_id'],
                'subject_name' => $cg['subject_name'],
                'subject_code' => $cg['subject_code'],
                'current_score' => $cg['final_score'],
                'semester' => $semester,
                'yearly_average' => $yearlyAvg,
                'ganjil_status' => $ganjilStatus,
            ];
        }

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'student_id' => $studentId,
            'semester' => $semester,
            'grades' => $results
        ]);
    }

    /**
     * GET /api/archive/graduated
     * Browsable graduated archive
     */
    public static function graduatedList(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['waka', 'kepsek', 'admin']);

        $db = Database::connect();
        $stmt = $db->query("
            SELECT ga.*, s.full_name as student_name, s.nisn, sub.name as subject_name
            FROM graduated_archive ga
            JOIN students s ON s.id = ga.student_id
            JOIN subjects sub ON sub.id = ga.subject_id
            ORDER BY ga.angkatan DESC, ga.archived_at DESC
        ");
        $archives = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'graduated_archive' => $archives
        ]);
    }
}
