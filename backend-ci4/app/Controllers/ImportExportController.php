<?php

namespace App\Controllers;

use App\Database\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use PDO;

class ImportExportController
{
    /**
     * POST /api/admin/import-students
     * Validates MIME type, file size, and sanitizes against Formula Injection (CWE-1236)
     */
    public static function importStudents(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin']);

        // 1. Check if file is uploaded
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'Berkas tidak ditemukan atau terjadi kesalahan saat mengunggah.'
            ]);
            return;
        }

        $file = $_FILES['file'];

        // 2. File size validation (Max 2MB)
        $maxBytes = 2 * 1024 * 1024;
        if ($file['size'] > $maxBytes) {
            http_response_code(413);
            echo json_encode([
                'status' => 413,
                'error' => 'Payload Too Large',
                'message' => 'Ukuran berkas melebihi batas maksimal 2MB.'
            ]);
            return;
        }

        // 3. MIME type validation using finfo (never trust client header)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'text/csv',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!in_array($mimeType, $allowedMimes, true)) {
            http_response_code(415);
            echo json_encode([
                'status' => 415,
                'error' => 'Unsupported Media Type',
                'message' => 'Tipe berkas tidak diizinkan. Hanya berkas Excel (.xlsx) atau CSV yang diperbolehkan.'
            ]);
            return;
        }

        // 4. Formula Injection Prevention (CWE-1236)
        // If a cell starts with =, +, -, @, \t, \r, it could execute dynamic commands if exported back
        $sanitizeCell = function (string $val): string {
            $val = trim($val);
            if (in_array(substr($val, 0, 1), ['=', '+', '-', '@', "\t", "\r"], true)) {
                // Prefix with single quote or strip to neutralize formula injection
                return "'" . $val;
            }
            return htmlspecialchars($val, ENT_QUOTES, 'UTF-8');
        };

        // Parse CSV or simulate parsed rows
        $rows = [];
        if (($handle = fopen($file['tmp_name'], 'r')) !== false) {
            $header = fgetcsv($handle, 1000, ',');
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                if (count($data) >= 3) {
                    $rows[] = [
                        'nisn' => $sanitizeCell($data[0] ?? ''),
                        'full_name' => $sanitizeCell($data[1] ?? ''),
                        'gender' => strtoupper(trim($data[2] ?? 'L')) === 'P' ? 'P' : 'L',
                        'nis' => $sanitizeCell($data[3] ?? '2425' . rand(1000, 9999)),
                    ];
                }
            }
            fclose($handle);
        }

        // 5. Preview Diff: Compare against existing database records
        $db = Database::connect();
        $existingNisns = $db->query("SELECT nisn FROM students")->fetchAll(PDO::FETCH_COLUMN);

        $diff = [
            'total_rows' => count($rows),
            'new_records' => [],
            'duplicate_records' => []
        ];

        foreach ($rows as $r) {
            if (in_array($r['nisn'], $existingNisns, true)) {
                $diff['duplicate_records'][] = $r;
            } else {
                $diff['new_records'][] = $r;
            }
        }

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Pratinjau import berhasil diproses. Berkas aman dari formula injection.',
            'diff' => $diff
        ]);
    }
}
