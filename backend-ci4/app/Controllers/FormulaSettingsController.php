<?php

namespace App\Controllers;

use App\Database\Database;
use App\Libraries\GradeCalculator;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class FormulaSettingsController
{
    /**
     * GET /api/grade-formula-settings?subject_id=X
     * Restricted to Admin & Kepsek roles only
     */
    public static function index(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin', 'kepsek']);

        $db = Database::connect();
        $subjectId = isset($_GET['subject_id']) && $_GET['subject_id'] !== '' ? (int)$_GET['subject_id'] : null;

        $weights = GradeCalculator::getWeights($db, $subjectId);

        // Fetch subjects list for dropdown selection
        $subjStmt = $db->query("SELECT id, code, name FROM subjects ORDER BY code ASC");
        $subjects = $subjStmt->fetchAll();

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'weights' => $weights,
            'subjects' => $subjects
        ]);
    }

    /**
     * POST /api/grade-formula-settings
     * Save/update weight formula. Restricted to Admin & Kepsek.
     * Server-side validation ensures total weights sum to exactly 100%.
     */
    public static function save(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin', 'kepsek']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $subjectId = isset($input['subject_id']) && $input['subject_id'] !== '' && $input['subject_id'] !== null
            ? (int)$input['subject_id']
            : null;

        $uhWeight = isset($input['ulangan_harian_weight']) ? (float)$input['ulangan_harian_weight'] : 0.0;
        $tugasWeight = isset($input['tugas_weight']) ? (float)$input['tugas_weight'] : 0.0;
        $uasWeight = isset($input['uas_weight']) ? (float)$input['uas_weight'] : 0.0;

        // Server-side validation: sum must be exactly 100%
        $total = round($uhWeight + $tugasWeight + $uasWeight, 2);
        if ($total !== 100.00) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => "Total bobot harus tepat 100%. Total saat ini: {$total}%."
            ]);
            return;
        }

        $db = Database::connect();

        if ($subjectId !== null) {
            // Per-subject override
            $checkStmt = $db->prepare("SELECT id FROM grade_formula_settings WHERE subject_id = :sid");
            $checkStmt->execute([':sid' => $subjectId]);
            $existing = $checkStmt->fetch();

            if ($existing) {
                $stmt = $db->prepare("
                    UPDATE grade_formula_settings 
                    SET ulangan_harian_weight = :uh, tugas_weight = :tg, uas_weight = :uas, updated_by = :ub, updated_at = CURRENT_TIMESTAMP
                    WHERE subject_id = :sid
                ");
                $stmt->execute([
                    ':uh' => $uhWeight,
                    ':tg' => $tugasWeight,
                    ':uas' => $uasWeight,
                    ':ub' => $user['id'],
                    ':sid' => $subjectId
                ]);
            } else {
                $stmt = $db->prepare("
                    INSERT INTO grade_formula_settings (subject_id, ulangan_harian_weight, tugas_weight, uas_weight, updated_by)
                    VALUES (:sid, :uh, :tg, :uas, :ub)
                ");
                $stmt->execute([
                    ':sid' => $subjectId,
                    ':uh' => $uhWeight,
                    ':tg' => $tugasWeight,
                    ':uas' => $uasWeight,
                    ':ub' => $user['id']
                ]);
            }
        } else {
            // Global default (subject_id IS NULL)
            $checkStmt = $db->query("SELECT id FROM grade_formula_settings WHERE subject_id IS NULL");
            $existing = $checkStmt->fetch();

            if ($existing) {
                $stmt = $db->prepare("
                    UPDATE grade_formula_settings 
                    SET ulangan_harian_weight = :uh, tugas_weight = :tg, uas_weight = :uas, updated_by = :ub, updated_at = CURRENT_TIMESTAMP
                    WHERE subject_id IS NULL
                ");
                $stmt->execute([
                    ':uh' => $uhWeight,
                    ':tg' => $tugasWeight,
                    ':uas' => $uasWeight,
                    ':ub' => $user['id']
                ]);
            } else {
                $stmt = $db->prepare("
                    INSERT INTO grade_formula_settings (subject_id, ulangan_harian_weight, tugas_weight, uas_weight, updated_by)
                    VALUES (NULL, :uh, :tg, :uas, :ub)
                ");
                $stmt->execute([
                    ':uh' => $uhWeight,
                    ':tg' => $tugasWeight,
                    ':uas' => $uasWeight,
                    ':ub' => $user['id']
                ]);
            }
        }

        $updatedWeights = GradeCalculator::getWeights($db, $subjectId);

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Pengaturan bobot nilai berhasil disimpan.',
            'weights' => $updatedWeights
        ]);
    }
}
