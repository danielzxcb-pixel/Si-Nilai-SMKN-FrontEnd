<?php

namespace App\Libraries;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;
use Exception;

class JWT
{
    private static function getSecretKey(): string
    {
        // 1. Try getenv / $_ENV
        $secret = getenv('JWT_SECRET_KEY');
        if (!empty($secret)) {
            return $secret;
        }

        // 2. Read from .env file
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (str_starts_with(trim($line), 'JWT_SECRET_KEY')) {
                    $parts = explode('=', $line, 2);
                    if (count($parts) === 2) {
                        return trim(trim($parts[1]), "'\"");
                    }
                }
            }
        }

        // Hardened fallback (at least 64 chars)
        return 'sinilai_smk_sec_7a89f02c4b1e5d6a3f8c9b0e1d2a4f6e8b7c9a0d2f4e6b8a1c3e5';
    }

    public static function generateToken(array $userData, int $expiryHours = 4): string
    {
        $issuedAt = time();
        $expire = $issuedAt + ($expiryHours * 3600);
        $secret = self::getSecretKey();

        $payload = [
            'iss' => 'sinilai-smk-auth',
            'aud' => 'sinilai-smk-client',
            'iat' => $issuedAt,
            'exp' => $expire,
            'sub' => $userData['id'],
            'user' => [
                'id' => (int)$userData['id'],
                'name' => $userData['name'],
                'email' => $userData['email'],
                'role' => $userData['role'],
                'nip' => $userData['nip'] ?? null,
            ]
        ];

        return FirebaseJWT::encode($payload, $secret, 'HS256');
    }

    public static function validateToken(string $token): ?array
    {
        try {
            $secret = self::getSecretKey();
            $decoded = FirebaseJWT::decode($token, new Key($secret, 'HS256'));
            return (array)$decoded;
        } catch (Exception $e) {
            return null;
        }
    }
}
