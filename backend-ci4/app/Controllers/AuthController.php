<?php

namespace App\Controllers;

use App\Database\Database;
use App\Libraries\JWT;
use App\Libraries\RateLimiter;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use PDO;

class AuthController
{
    /**
     * POST /api/login
     */
    public static function login(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $identifier = trim($input['identifier'] ?? $input['email'] ?? $input['nip'] ?? '');
        $password = $input['password'] ?? '';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        // 1. Validation: required fields
        if (empty($identifier) || empty($password)) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'Email/NIP dan kata sandi wajib diisi.'
            ]);
            return;
        }

        // 2. Rate limiting check (Brute-Force Protection)
        $rateCheck = RateLimiter::check($ip, $identifier);
        if (!$rateCheck['allowed']) {
            http_response_code(429);
            echo json_encode([
                'status' => 429,
                'error' => 'Too Many Requests',
                'message' => $rateCheck['message'],
                'retry_after' => $rateCheck['retry_after'] ?? 900
            ]);
            return;
        }

        // 3. Parameterized Query (SQL Injection Prevention)
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT id, name, email, nip, password_hash, role 
            FROM users 
            WHERE LOWER(email) = LOWER(:id) OR nip = :id OR REPLACE(nip, ' ', '') = REPLACE(:id, ' ', '')
            LIMIT 1
        ");
        $stmt->execute([':id' => $identifier]);
        $user = $stmt->fetch();

        // 4. Constant-Time Verification & Generic Error Message
        // Prevents user enumeration attacks (never leaks if email exists or not)
        $dummyHash = '$2y$10$wK1F5N8bQ9M8A8G9K0L1Z.X9Y8W7V6U5T4S3R2Q1P0O9N8M7L6K5J';
        $hashToVerify = $user ? $user['password_hash'] : $dummyHash;
        $isPasswordValid = password_verify($password, $hashToVerify);

        if (!$user || !$isPasswordValid) {
            RateLimiter::recordFailedAttempt($ip, $identifier);
            http_response_code(401);
            echo json_encode([
                'status' => 401,
                'error' => 'Unauthorized',
                'message' => 'Email/NIP atau kata sandi tidak valid. Periksa kembali kredensial Anda.'
            ]);
            return;
        }

        // Clear rate limiter upon successful login
        RateLimiter::clear($ip, $identifier);

        // 5. Fetch assigned subjects and classes
        $assignStmt = $db->prepare("
            SELECT subject_id, class_id 
            FROM teacher_assignments 
            WHERE teacher_id = :tid
        ");
        $assignStmt->execute([':tid' => $user['id']]);
        $assignments = $assignStmt->fetchAll();

        $assignedSubjects = array_values(array_unique(array_column($assignments, 'subject_id')));
        $assignedClasses = array_values(array_unique(array_column($assignments, 'class_id')));

        // If admin, waka, or kepsek, they have access to all
        if (in_array($user['role'], ['admin', 'waka', 'kepsek'])) {
            $allSubj = $db->query("SELECT id FROM subjects")->fetchAll(PDO::FETCH_COLUMN);
            $allCls = $db->query("SELECT id FROM classes")->fetchAll(PDO::FETCH_COLUMN);
            $assignedSubjects = $allSubj;
            $assignedClasses = $allCls;
        }

        // 6. Issue signed JWT with 4-hour expiry
        $token = JWT::generateToken([
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'nip' => $user['nip']
        ], 4);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Login berhasil.',
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => 4 * 3600,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'nip' => $user['nip'],
                'assigned_subjects' => $assignedSubjects,
                'assigned_classes' => $assignedClasses,
            ]
        ]);
    }

    /**
     * GET /api/me
     */
    public static function me(): void
    {
        $user = AuthMiddleware::authenticate();
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT id, name, email, nip, role 
            FROM users 
            WHERE id = :id
        ");
        $stmt->execute([':id' => $user['id']]);
        $profile = $stmt->fetch();

        if (!$profile) {
            http_response_code(404);
            echo json_encode(['status' => 404, 'error' => 'User not found']);
            return;
        }

        $assignStmt = $db->prepare("
            SELECT subject_id, class_id 
            FROM teacher_assignments 
            WHERE teacher_id = :tid
        ");
        $assignStmt->execute([':tid' => $user['id']]);
        $assignments = $assignStmt->fetchAll();

        $assignedSubjects = array_values(array_unique(array_column($assignments, 'subject_id')));
        $assignedClasses = array_values(array_unique(array_column($assignments, 'class_id')));

        if (in_array($profile['role'], ['admin', 'waka', 'kepsek'])) {
            $assignedSubjects = $db->query("SELECT id FROM subjects")->fetchAll(PDO::FETCH_COLUMN);
            $assignedClasses = $db->query("SELECT id FROM classes")->fetchAll(PDO::FETCH_COLUMN);
        }

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'user' => array_merge($profile, [
                'assigned_subjects' => $assignedSubjects,
                'assigned_classes' => $assignedClasses,
            ])
        ]);
    }

    /**
     * POST /api/admin/reset-password (Write-Only, Admin only)
     */
    public static function resetPassword(): void
    {
        $currentUser = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($currentUser, ['admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $targetUserId = (int)($input['user_id'] ?? 0);
        $newPassword = $input['new_password'] ?? '';

        if ($targetUserId <= 0 || strlen($newPassword) < 6) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'User ID wajib valid dan kata sandi baru minimal 6 karakter.'
            ]);
            return;
        }

        $db = Database::connect();
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);

        $stmt = $db->prepare("UPDATE users SET password_hash = :hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        $stmt->execute([':hash' => $hash, ':id' => $targetUserId]);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Kata sandi berhasil diatur ulang (Write-only, hash tersimpan aman).'
        ]);
    }
}
