<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSinilaiSchema extends Migration
{
    public function up()
    {
        // 1. USERS TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 150],
            'email' => ['type' => 'VARCHAR', 'constraint' => 100, 'unique' => true],
            'password_hash' => ['type' => 'VARCHAR', 'constraint' => 255],
            'role' => ['type' => 'ENUM', 'constraint' => ['admin', 'guru', 'waka', 'kepsek'], 'default' => 'guru'],
            'nip' => ['type' => 'VARCHAR', 'constraint' => 50, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('users', true);

        // 2. SUBJECTS TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'code' => ['type' => 'VARCHAR', 'constraint' => 20, 'unique' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 150],
            'category' => ['type' => 'ENUM', 'constraint' => ['Kejuruan', 'Umum', 'Muatan Lokal'], 'default' => 'Umum'],
            'kkm' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'default' => 75.00],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('subjects', true);

        // 3. CLASSES TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 50],
            'tingkat' => ['type' => 'TINYINT', 'constraint' => 2],
            'jurusan' => ['type' => 'VARCHAR', 'constraint' => 50],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('classes', true);

        // 4. TEACHER ASSIGNMENTS TABLE (Mapel & Kelas yang dapat diakses Guru)
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'teacher_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'subject_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'class_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['teacher_id', 'subject_id', 'class_id']);
        $this->forge->addForeignKey('teacher_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('subject_id', 'subjects', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('teacher_assignments', true);

        // 5. STUDENTS TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'full_name' => ['type' => 'VARCHAR', 'constraint' => 150],
            'nisn' => ['type' => 'VARCHAR', 'constraint' => 20, 'unique' => true],
            'nis' => ['type' => 'VARCHAR', 'constraint' => 20],
            'nik' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true],
            'gender' => ['type' => 'ENUM', 'constraint' => ['L', 'P'], 'default' => 'L'],
            'class_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'absen_number' => ['type' => 'INT', 'constraint' => 4, 'default' => 1],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'CASCADE', 'RESTRICT');
        $this->forge->createTable('students', true);

        // 6. GRADES TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'student_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'subject_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'teacher_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'class_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'uh1' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'uh2' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'uh3' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'avg_uh' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'uas_teori' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'uas_praktik' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'final_score' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'status_kkm' => ['type' => 'ENUM', 'constraint' => ['Tuntas', 'Remedial', 'Belum Dinilai'], 'default' => 'Belum Dinilai'],
            'competency_notes' => ['type' => 'TEXT', 'null' => true],
            'semester' => ['type' => 'ENUM', 'constraint' => ['ganjil', 'genap'], 'default' => 'genap'],
            'academic_year' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => '2024/2025'],
            'submitted' => ['type' => 'BOOLEAN', 'default' => 0],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('student_id', 'students', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('subject_id', 'subjects', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('teacher_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('grades', true);

        // 7. GRADE AUDIT LOGS TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'grade_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'changed_by' => ['type' => 'VARCHAR', 'constraint' => 100],
            'old_score' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'new_score' => ['type' => 'DECIMAL', 'constraint' => '5,2', 'null' => true],
            'field' => ['type' => 'VARCHAR', 'constraint' => 100],
            'reason' => ['type' => 'TEXT', 'null' => true],
            'changed_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('grade_audit_logs', true);

        // 8. SUBMISSION TRACKER & STATUSES TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'teacher_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'subject_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'class_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'status' => ['type' => 'ENUM', 'constraint' => ['belum_mulai', 'sedang_diisi', 'terkirim'], 'default' => 'belum_mulai'],
            'submitted_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['teacher_id', 'subject_id', 'class_id']);
        $this->forge->createTable('submission_statuses', true);

        // 9. SUBMISSION DEADLINES TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'subject_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'semester' => ['type' => 'ENUM', 'constraint' => ['ganjil', 'genap'], 'default' => 'genap'],
            'academic_year' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => '2024/2025'],
            'deadline' => ['type' => 'DATE'],
            'set_by' => ['type' => 'VARCHAR', 'constraint' => 100],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('submission_deadlines', true);

        // 10. RECAP WINDOWS TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'semester' => ['type' => 'ENUM', 'constraint' => ['ganjil', 'genap']],
            'academic_year' => ['type' => 'VARCHAR', 'constraint' => 20],
            'opens_at' => ['type' => 'DATETIME'],
            'closes_at' => ['type' => 'DATETIME'],
            'set_by' => ['type' => 'VARCHAR', 'constraint' => 100],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('recap_windows', true);

        // 11. GRADUATED ARCHIVE TABLE
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'angkatan' => ['type' => 'INT', 'constraint' => 6],
            'class_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'student_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'subject_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'final_grades' => ['type' => 'JSON'],
            'archived_at' => ['type' => 'DATETIME'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('graduated_archive', true);
    }

    public function down()
    {
        $this->forge->dropTable('graduated_archive', true);
        $this->forge->dropTable('recap_windows', true);
        $this->forge->dropTable('submission_deadlines', true);
        $this->forge->dropTable('submission_statuses', true);
        $this->forge->dropTable('grade_audit_logs', true);
        $this->forge->dropTable('grades', true);
        $this->forge->dropTable('students', true);
        $this->forge->dropTable('teacher_assignments', true);
        $this->forge->dropTable('classes', true);
        $this->forge->dropTable('subjects', true);
        $this->forge->dropTable('users', true);
    }
}
