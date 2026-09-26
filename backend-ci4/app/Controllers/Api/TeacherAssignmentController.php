<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class TeacherAssignmentController extends ResourceController
{
    use ResponseTrait;

    protected $format = 'json';

    /**
     * Update teacher's assigned subjects and classes in real-time
     * POST /api/teachers/{id}/permissions
     */
    public function updatePermissions($teacherId = null)
    {
        $db = \Config\Database::connect();
        $builder = $db->table('teacher_assignments');

        $json = $this->request->getJSON(true);
        $subjectIds = $json['subjects'] ?? []; // e.g. ['SUB-MTK', 'SUB-RPL', 'SUB-IPAS']
        $classIds = $json['classes'] ?? [];    // e.g. ['CLS-10RPL1', 'CLS-10TKJ', 'CLS-10PM']

        $db->transStart();

        // 1. Clear existing assignments for this teacher
        $builder->where('teacher_id', $teacherId)->delete();

        // 2. Insert new assignment combinations
        $insertBatch = [];
        $now = date('Y-m-d H:i:s');

        foreach ($subjectIds as $subjId) {
            foreach ($classIds as $clsId) {
                $insertBatch[] = [
                    'teacher_id' => $teacherId,
                    'subject_id' => $subjId,
                    'class_id' => $clsId,
                    'created_at' => $now,
                ];
            }
        }

        if (!empty($insertBatch)) {
            $builder->insertBatch($insertBatch);
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->failServerError('Gagal memperbarui alokasi mengajar guru.');
        }

        // 3. Broadcast Real-Time Event via WebSocket Server
        $this->broadcastRealtimeEvent([
            'event' => 'TEACHER_PERMISSIONS_UPDATED',
            'data' => [
                'teacher_id' => $teacherId,
                'assigned_subjects' => $subjectIds,
                'assigned_classes' => $classIds,
                'updated_at' => date('d M Y H:i:s') . ' WIB',
            ]
        ]);

        return $this->respond([
            'status' => 'success',
            'message' => 'Hak akses dan penugasan mengajar berhasil diperbarui seketika (Live Synced).',
            'data' => [
                'teacher_id' => $teacherId,
                'assigned_subjects' => $subjectIds,
                'assigned_classes' => $classIds,
                'updated_at' => date('d M Y H:i:s') . ' WIB',
            ]
        ]);
    }

    /**
     * Broadcasts event to local Ratchet / ReactPHP WebSocket daemon (Port 8080)
     */
    private function broadcastRealtimeEvent(array $payload)
    {
        try {
            $socket = @fsockopen('127.0.0.1', 8080, $errno, $errstr, 0.5);
            if ($socket) {
                fwrite($socket, json_encode($payload) . "\n");
                fclose($socket);
            }
        } catch (\Throwable $e) {
            // Silently continue if daemon is running asynchronously
        }
    }
}
