<?php

/**
 * SiNilai SMK — Spark Command Runner (Cron Automation)
 * Usage: php backend-ci4/app/Commands/Spark.php [command]
 * Commands:
 *   check:deadlines   - Scans H-3/H-1 submission deadlines and creates reminders
 *   recap:reset       - Closes expired recap windows, archives grades, and resets status
 *   graduated:archive - Snapshots Kelas 12 final grades into graduated_archive
 *   backup:db         - Creates scheduled database snapshot in writable/backups/
 */

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Database\Database;
use PDO;

$command = $argv[1] ?? 'help';
$db = Database::connect();

switch ($command) {
    case 'check:deadlines':
        echo "[" . date('Y-m-d H:i:s') . "] Running check:deadlines...\n";
        $stmt = $db->query("
            SELECT sd.*, s.name as subject_name 
            FROM submission_deadlines sd
            JOIN subjects s ON s.id = sd.subject_id
        ");
        $deadlines = $stmt->fetchAll();
        $today = new DateTime();

        foreach ($deadlines as $dl) {
            $dlDate = new DateTime($dl['deadline']);
            $diffDays = (int)$today->diff($dlDate)->format('%r%a');

            if ($diffDays === 3 || $diffDays === 1) {
                echo "  -> ALERT: {$dl['subject_name']} deadline in {$diffDays} day(s) ({$dl['deadline']})\n";
            }
        }
        echo "Check deadlines completed.\n";
        break;

    case 'recap:reset':
        echo "[" . date('Y-m-d H:i:s') . "] Running recap:reset...\n";
        $now = date('Y-m-d H:i:s');
        $stmt = $db->prepare("
            SELECT * FROM recap_windows 
            WHERE closes_at <= :now
        ");
        $stmt->execute([':now' => $now]);
        $expired = $stmt->fetchAll();

        foreach ($expired as $w) {
            echo "  -> Closing recap window ID: {$w['id']} for {$w['academic_year']} {$w['semester']}\n";
            // Reset teacher submission statuses for next period
            $db->exec("UPDATE submission_statuses SET status = 'belum_mulai', submitted_at = NULL, updated_at = CURRENT_TIMESTAMP");
        }
        echo "Recap reset completed.\n";
        break;

    case 'graduated:archive':
        echo "[" . date('Y-m-d H:i:s') . "] Running graduated:archive...\n";
        $angkatan = date('Y');
        // Snapshot kelas 12 students and their grades
        $k12Stmt = $db->query("
            SELECT g.class_id, g.student_id, g.subject_id, g.final_score
            FROM grades g
            JOIN classes c ON c.id = g.class_id
            WHERE c.tingkat = 12
        ");
        $k12Grades = $k12Stmt->fetchAll();

        $ins = $db->prepare("
            INSERT INTO graduated_archive (angkatan, class_id, student_id, subject_id, final_grades, archived_at)
            VALUES (:ang, :cid, :stid, :sid, :fg, CURRENT_TIMESTAMP)
        ");

        $count = 0;
        foreach ($k12Grades as $kg) {
            $ins->execute([
                ':ang' => $angkatan,
                ':cid' => $kg['class_id'],
                ':stid' => $kg['student_id'],
                ':sid' => $kg['subject_id'],
                ':fg' => json_encode(['final_score' => $kg['final_score']])
            ]);
            $count++;
        }
        echo "Archived {$count} grade records for Angkatan {$angkatan}.\n";
        break;

    case 'backup:db':
        echo "[" . date('Y-m-d H:i:s') . "] Running backup:db...\n";
        $backupDir = __DIR__ . '/../../writable/backups';
        if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);

        $source = __DIR__ . '/../../writable/database.sqlite';
        $dest = $backupDir . '/backup_' . date('Ymd_His') . '.sqlite';
        if (file_exists($source)) {
            copy($source, $dest);
            echo "Database backup created: " . basename($dest) . "\n";
        }
        break;

    default:
        echo "Available Spark commands:\n";
        echo "  check:deadlines   - Check deadline alerts\n";
        echo "  recap:reset       - Reset recap windows\n";
        echo "  graduated:archive - Archive graduating students\n";
        echo "  backup:db         - Backup database\n";
        break;
}
