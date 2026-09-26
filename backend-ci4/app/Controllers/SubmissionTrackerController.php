<?php

namespace App\Controllers;

use App\Database\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use PDO;

class SubmissionTrackerController
{
    /**
     * GET /api/tracker/submissions
     * RESTRICTED TO WAKA, KEPSEK, ADMIN!
     * Guru hitting this MUST BE REJECTED with 403 Forbidden!
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        // Strict role check: Guru cannot access tracker!
        RoleMiddleware::authorize($user, ['waka', 'kepsek', 'admin']);

        $db = Database::connect();
        $query = "
            SELECT 
                st.id,
                st.teacher_id,
                u.name as teacher_name,
                st.subject_id,
                sub.name as subject_name,
                sub.code as subject_code,
                st.class_id,
                cls.name as class_name,
                st.status,
                st.submitted_at,
                st.updated_at
            FROM submission_statuses st
            JOIN users u ON u.id = st.teacher_id
            JOIN subjects sub ON sub.id = st.subject_id
            JOIN classes cls ON cls.id = st.class_id
            ORDER BY st.updated_at DESC
        ";

        $stmt = $db->query($query);
        $records = $stmt->fetchAll();

        $formatted = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'teacher_id' => (int)$r['teacher_id'],
                'teacher_name' => $r['teacher_name'],
                'subject_id' => (int)$r['subject_id'],
                'subject_name' => $r['subject_name'],
                'class_id' => (int)$r['class_id'],
                'class_name' => $r['class_name'],
                'status' => $r['status'],
                'submitted_at' => $r['submitted_at'] ? date('d M Y H:i:s', strtotime($r['submitted_at'])) . ' WIB' : null,
                'updated_at' => date('d M Y H:i:s', strtotime($r['updated_at'])) . ' WIB',
            ];
        }, $records);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'tracker' => $formatted,
            'timestamp' => date('d M Y H:i:s') . ' WIB'
        ]);
    }
}
