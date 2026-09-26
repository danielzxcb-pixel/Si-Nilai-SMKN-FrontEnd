<?php

namespace App\Controllers\Api;

use App\Models\SiteContentModel;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

class SiteContentController
{
    /**
     * GET /api/site-content
     * Returns all content keys and values. Open to all authenticated/public roles.
     */
    public static function index(): void
    {
        $data = SiteContentModel::getAll();

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'content' => $data['content_map'],
            'items' => $data['items'],
            'last_updated_by' => $data['last_updated_by'],
            'last_updated_at' => $data['last_updated_at']
        ]);
    }

    /**
     * PUT /api/site-content/{key}
     * Admin-only: update single key
     */
    public static function updateSingle(string $key): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $val = trim($input['content_value'] ?? '');

        if ($val === '') {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'content_value tidak boleh kosong.'
            ]);
            return;
        }

        SiteContentModel::updateByKey($key, $val, (int)$user['id']);
        $updatedData = SiteContentModel::getAll();

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => "Konten '$key' berhasil diperbarui.",
            'content' => $updatedData['content_map']
        ]);
    }

    /**
     * POST /api/site-content/bulk
     * Admin-only: update multiple keys at once
     */
    public static function bulkUpdate(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::authorize($user, ['admin']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $items = $input['items'] ?? [];

        if (empty($items) || !is_array($items)) {
            http_response_code(422);
            echo json_encode([
                'status' => 422,
                'error' => 'Unprocessable Entity',
                'message' => 'Format items tidak valid.'
            ]);
            return;
        }

        SiteContentModel::bulkUpdate($items, (int)$user['id']);
        $updatedData = SiteContentModel::getAll();

        http_response_code(200);
        echo json_encode([
            'status' => 200,
            'message' => 'Seluruh perubahan konten website berhasil disimpan.',
            'content' => $updatedData['content_map'],
            'last_updated_by' => $updatedData['last_updated_by'],
            'last_updated_at' => $updatedData['last_updated_at']
        ]);
    }
}
