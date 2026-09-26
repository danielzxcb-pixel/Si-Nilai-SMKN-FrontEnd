<?php

namespace App\Middleware;

class RoleMiddleware
{
    public static function authorize(array $user, array $allowedRoles): void
    {
        $role = $user['role'] ?? '';

        // Admin bypasses all checks
        if ($role === 'admin') {
            return;
        }

        if (!in_array($role, $allowedRoles, true)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 403,
                'error' => 'Forbidden',
                'message' => 'Akses ditolak: Peran akun Anda (' . strtoupper($role) . ') tidak diizinkan mengakses modul ini.'
            ]);
            exit;
        }
    }
}
