<?php

namespace App\Middleware;

use App\Libraries\JWT;

class AuthMiddleware
{
    public static function authenticate(): ?array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 401,
                'error' => 'Unauthorized',
                'message' => 'Token otentikasi tidak ditemukan. Silakan login kembali.'
            ]);
            exit;
        }

        $token = trim($matches[1]);
        $decoded = JWT::validateToken($token);

        if (!$decoded || !isset($decoded['user'])) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 401,
                'error' => 'Unauthorized',
                'message' => 'Sesi Anda telah berakhir atau token tidak sah. Silakan login ulang.'
            ]);
            exit;
        }

        return (array)$decoded['user'];
    }
}
