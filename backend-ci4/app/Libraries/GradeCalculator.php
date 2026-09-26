<?php

namespace App\Libraries;

use PDO;

class GradeCalculator
{
    /**
     * Get formula weight settings for a subject (or global default if no override exists)
     */
    public static function getWeights(PDO $db, ?int $subjectId = null): array
    {
        if ($subjectId !== null && $subjectId > 0) {
            $stmt = $db->prepare("
                SELECT gfs.*, u.name as updated_by_name 
                FROM grade_formula_settings gfs
                LEFT JOIN users u ON u.id = gfs.updated_by
                WHERE gfs.subject_id = :sid 
                ORDER BY gfs.id DESC LIMIT 1
            ");
            $stmt->execute([':sid' => $subjectId]);
            $res = $stmt->fetch();
            if ($res) {
                return [
                    'id' => (int)$res['id'],
                    'subject_id' => (int)$res['subject_id'],
                    'ulangan_harian_weight' => (float)$res['ulangan_harian_weight'],
                    'tugas_weight' => (float)$res['tugas_weight'],
                    'uas_weight' => (float)$res['uas_weight'],
                    'updated_by' => (int)$res['updated_by'],
                    'updated_by_name' => $res['updated_by_name'] ?? 'Admin',
                    'updated_at' => $res['updated_at']
                ];
            }
        }

        // Global default
        $stmt = $db->prepare("
            SELECT gfs.*, u.name as updated_by_name 
            FROM grade_formula_settings gfs
            LEFT JOIN users u ON u.id = gfs.updated_by
            WHERE gfs.subject_id IS NULL 
            ORDER BY gfs.id DESC LIMIT 1
        ");
        $stmt->execute();
        $res = $stmt->fetch();

        if ($res) {
            return [
                'id' => (int)$res['id'],
                'subject_id' => null,
                'ulangan_harian_weight' => (float)$res['ulangan_harian_weight'],
                'tugas_weight' => (float)$res['tugas_weight'],
                'uas_weight' => (float)$res['uas_weight'],
                'updated_by' => (int)$res['updated_by'],
                'updated_by_name' => $res['updated_by_name'] ?? 'Admin',
                'updated_at' => $res['updated_at']
            ];
        }

        return [
            'id' => null,
            'subject_id' => null,
            'ulangan_harian_weight' => 40.00,
            'tugas_weight' => 0.00,
            'uas_weight' => 60.00,
            'updated_by' => 1,
            'updated_by_name' => 'Administrator',
            'updated_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Compute NA based on weights and scores
     */
    public static function calculateNA(?float $avgUh, ?float $avgTugas, ?float $avgUas, array $weights): ?float
    {
        $wUh = (float)($weights['ulangan_harian_weight'] ?? 40.0);
        $wTugas = (float)($weights['tugas_weight'] ?? 0.0);
        $wUas = (float)($weights['uas_weight'] ?? 60.0);

        $partUh = ($avgUh !== null) ? ($avgUh * ($wUh / 100.0)) : 0.0;
        $partTugas = ($avgTugas !== null) ? ($avgTugas * ($wTugas / 100.0)) : 0.0;
        $partUas = ($avgUas !== null) ? ($avgUas * ($wUas / 100.0)) : 0.0;

        $hasAnyScore = ($avgUh !== null || $avgTugas !== null || $avgUas !== null);
        if (!$hasAnyScore) {
            return null;
        }

        return round($partUh + $partTugas + $partUas, 2);
    }
}
