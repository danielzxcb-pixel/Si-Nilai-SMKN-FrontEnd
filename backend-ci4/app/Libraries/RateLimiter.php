<?php

namespace App\Libraries;

use App\Database\Database;
use PDO;

class RateLimiter
{
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_MINUTES = 15;

    public static function check(string $ip, string $identifier): array
    {
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT attempts, locked_until 
            FROM login_attempts 
            WHERE ip_address = :ip AND identifier = :id
        ");
        $stmt->execute([':ip' => $ip, ':id' => $identifier]);
        $record = $stmt->fetch();

        if ($record && !empty($record['locked_until'])) {
            $lockTime = strtotime($record['locked_until']);
            if (time() < $lockTime) {
                $waitSecs = $lockTime - time();
                return [
                    'allowed' => false,
                    'message' => "Terlalu banyak percobaan gagal. Silakan coba lagi dalam " . ceil($waitSecs / 60) . " menit.",
                    'retry_after' => $waitSecs
                ];
            } else {
                // Lock expired, reset
                self::clear($ip, $identifier);
            }
        }

        return ['allowed' => true];
    }

    public static function recordFailedAttempt(string $ip, string $identifier): void
    {
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT attempts 
            FROM login_attempts 
            WHERE ip_address = :ip AND identifier = :id
        ");
        $stmt->execute([':ip' => $ip, ':id' => $identifier]);
        $record = $stmt->fetch();

        if ($record) {
            $newAttempts = $record['attempts'] + 1;
            $lockedUntil = null;
            if ($newAttempts >= self::MAX_ATTEMPTS) {
                $lockedUntil = date('Y-m-d H:i:s', time() + (self::LOCKOUT_MINUTES * 60));
            }

            $update = $db->prepare("
                UPDATE login_attempts 
                SET attempts = :attempts, locked_until = :locked, last_attempt_at = CURRENT_TIMESTAMP 
                WHERE ip_address = :ip AND identifier = :id
            ");
            $update->execute([
                ':attempts' => $newAttempts,
                ':locked' => $lockedUntil,
                ':ip' => $ip,
                ':id' => $identifier
            ]);
        } else {
            $insert = $db->prepare("
                INSERT INTO login_attempts (ip_address, identifier, attempts, last_attempt_at) 
                VALUES (:ip, :id, 1, CURRENT_TIMESTAMP)
            ");
            $insert->execute([':ip' => $ip, ':id' => $identifier]);
        }
    }

    public static function clear(string $ip, string $identifier): void
    {
        $db = Database::connect();
        $stmt = $db->prepare("
            DELETE FROM login_attempts 
            WHERE ip_address = :ip AND identifier = :id
        ");
        $stmt->execute([':ip' => $ip, ':id' => $identifier]);
    }
}
