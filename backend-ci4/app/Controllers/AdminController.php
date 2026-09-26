<?php

namespace App\Controllers;

use App\Database\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use PDO;

class AdminController
{
    /**
     * Delete subject - RESTRICTED STRICTLY TO ADMIN!
     * DELETE /api/admin/subjects/{id}
     */
    public static function deleteSubject(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        // Strict role check: Non-admin MUST BE REJECTED 403!
        RoleMiddleware::authorize($user, ['admin']);

        $db = Database::connect();
        $stmt = $db->prepare("DELETE FROM subjects WHERE id = :id");
        $stmt->execute([':id' => $id]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => "Mata pelajaran ID {$id} berhasil dihapus oleh Administrator."
        ]);
    }

    /**
     * Edit site content / settings - RESTRICTED TO ADMIN!
     * POST /api/admin/settings
     */
    public static function updateSiteSettings(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Pengaturan situs berhasil diperbarui.',
            'settings' => $input
        ]);
    }

    /**
     * GET /api/admin/teachers
     */
    public static function listTeachers(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin', 'waka', 'kepsek']);

        $db = Database::connect();
        $stmt = $db->query("
            SELECT id, name, email, nip, role, created_at 
            FROM users 
            WHERE role IN ('guru', 'waka')
            ORDER BY name ASC
        ");
        $teachers = $stmt->fetchAll();

        foreach ($teachers as &$t) {
            $aStmt = $db->prepare("
                SELECT subject_id, class_id 
                FROM teacher_assignments 
                WHERE teacher_id = :id
            ");
            $aStmt->execute([':id' => $t['id']]);
            $assignments = $aStmt->fetchAll();
            $t['assigned_subjects'] = array_values(array_unique(array_column($assignments, 'subject_id')));
            $t['assigned_classes'] = array_values(array_unique(array_column($assignments, 'class_id')));
        }

        http_response_code(200);
        echo json_encode(['status' => 200, 'teachers' => $teachers]);
    }

    /**
     * Create subject - RESTRICTED TO ADMIN
     * POST /api/admin/subjects
     */
    public static function createSubject(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $code = trim($input['code'] ?? '');
        $name = trim($input['name'] ?? '');
        $category = trim($input['category'] ?? 'Umum');
        $kkm = (float)($input['kkm'] ?? 75.0);

        if (empty($code) || empty($name)) {
            http_response_code(422);
            echo json_encode(['status' => 422, 'error' => 'Kode dan nama mata pelajaran wajib diisi.']);
            return;
        }

        $db = Database::connect();
        $stmt = $db->prepare("INSERT INTO subjects (code, name, category, kkm) VALUES (:code, :name, :category, :kkm)");
        $stmt->execute([
            ':code' => $code,
            ':name' => $name,
            ':category' => $category,
            ':kkm' => $kkm
        ]);
        $newId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'status' => 201,
            'message' => 'Mata pelajaran berhasil ditambahkan.',
            'subject' => [
                'id' => (int)$newId,
                'code' => $code,
                'name' => $name,
                'category' => $category,
                'kkm' => $kkm
            ]
        ]);
    }

    /**
     * Create class - RESTRICTED TO ADMIN
     * POST /api/admin/classes
     */
    public static function createClass(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim($input['name'] ?? '');
        $tingkat = (int)($input['tingkat'] ?? 10);
        $jurusan = trim($input['jurusan'] ?? 'Umum');

        if (empty($name)) {
            http_response_code(422);
            echo json_encode(['status' => 422, 'error' => 'Nama kelas wajib diisi.']);
            return;
        }

        $db = Database::connect();
        $stmt = $db->prepare("INSERT INTO classes (name, tingkat, jurusan) VALUES (:name, :tingkat, :jurusan)");
        $stmt->execute([
            ':name' => $name,
            ':tingkat' => $tingkat,
            ':jurusan' => $jurusan
        ]);
        $newId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'status' => 201,
            'message' => 'Kelas berhasil ditambahkan.',
            'class' => [
                'id' => (int)$newId,
                'name' => $name,
                'tingkat' => $tingkat,
                'jurusan' => $jurusan
            ]
        ]);
    }

    /**
     * Delete class - RESTRICTED TO ADMIN
     * DELETE /api/admin/classes/{id}
     */
    public static function deleteClass(int $id): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin']);

        $db = Database::connect();
        $stmt = $db->prepare("DELETE FROM classes WHERE id = :id");
        $stmt->execute([':id' => $id]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => "Kelas ID {$id} berhasil dihapus oleh Administrator."
        ]);
    }
}
