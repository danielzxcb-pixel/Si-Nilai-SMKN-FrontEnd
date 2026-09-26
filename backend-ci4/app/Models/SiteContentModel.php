<?php

namespace App\Models;

use App\Database\Database;
use PDO;

class SiteContentModel
{
    /**
     * Get all content keys & values as a flat map and full structured list
     */
    public static function getAll(): array
    {
        $db = Database::connect();
        $stmt = $db->query("
            SELECT sc.*, u.name as updated_by_name 
            FROM site_content sc
            LEFT JOIN users u ON u.id = sc.updated_by
            ORDER BY sc.page_group ASC, sc.content_key ASC
        ");
        $rows = $stmt->fetchAll();

        $map = [];
        $items = [];
        $lastUpdatedBy = 'Administrator';
        $lastUpdatedAt = '';

        foreach ($rows as $row) {
            $map[$row['content_key']] = $row['content_value'];
            $items[] = [
                'id' => (int)$row['id'],
                'content_key' => $row['content_key'],
                'page_group' => $row['page_group'],
                'content_value' => $row['content_value'],
                'updated_by' => (int)$row['updated_by'],
                'updated_by_name' => $row['updated_by_name'] ?? 'Admin',
                'updated_at' => $row['updated_at']
            ];
            $lastUpdatedBy = $row['updated_by_name'] ?? $lastUpdatedBy;
            $lastUpdatedAt = $row['updated_at'];
        }

        return [
            'content_map' => $map,
            'items' => $items,
            'last_updated_by' => $lastUpdatedBy,
            'last_updated_at' => $lastUpdatedAt
        ];
    }

    /**
     * Update single key by content_key
     */
    public static function updateByKey(string $key, string $value, int $userId): bool
    {
        $db = Database::connect();
        $stmt = $db->prepare("
            UPDATE site_content 
            SET content_value = :val, updated_by = :ub, updated_at = CURRENT_TIMESTAMP
            WHERE content_key = :key
        ");
        return $stmt->execute([
            ':val' => $value,
            ':ub' => $userId,
            ':key' => $key
        ]);
    }

    /**
     * Bulk update multiple keys at once
     */
    public static function bulkUpdate(array $keyValues, int $userId): void
    {
        $db = Database::connect();
        $stmt = $db->prepare("
            UPDATE site_content 
            SET content_value = :val, updated_by = :ub, updated_at = CURRENT_TIMESTAMP
            WHERE content_key = :key
        ");

        foreach ($keyValues as $key => $val) {
            $stmt->execute([
                ':val' => (string)$val,
                ':ub' => $userId,
                ':key' => (string)$key
            ]);
        }
    }
}
