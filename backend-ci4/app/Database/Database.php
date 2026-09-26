<?php

namespace App\Database;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function connect(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        // ============================================================
        // AUTO-DETECT: MySQL (Railway Production) vs SQLite (Local Dev)
        // Railway sets MYSQL_HOST, MYSQL_URL, or MYSQLHOST automatically.
        // If any of those exist, use MySQL. Otherwise fall back to SQLite.
        // ============================================================
        $mysqlHost = getenv('MYSQL_HOST') ?: getenv('MYSQLHOST') ?: getenv('DB_HOST') ?: '';
        $mysqlUrl  = getenv('MYSQL_URL') ?: getenv('MYSQL_PUBLIC_URL') ?: '';

        if (!empty($mysqlHost) || !empty($mysqlUrl)) {
            self::$instance = self::connectMySQL($mysqlHost, $mysqlUrl);
        } else {
            self::$instance = self::connectSQLite();
        }

        return self::$instance;
    }

    // ── MySQL Connection (Railway Production) ─────────────────────────
    private static function connectMySQL(string $host, string $url): PDO
    {
        try {
            // Prefer individual env vars (internal private network = faster)
            if (!empty($host)) {
                $port   = (int)(getenv('MYSQL_PORT') ?: getenv('MYSQLPORT') ?: 3306);
                $dbname = getenv('MYSQL_DATABASE') ?: getenv('MYSQLDATABASE') ?: 'railway';
                $user   = getenv('MYSQL_USER') ?: getenv('MYSQLUSER') ?: 'root';
                $pass   = getenv('MYSQL_PASSWORD') ?: getenv('MYSQLPASSWORD') ?: getenv('MYSQL_ROOT_PASSWORD') ?: '';
                $dsn    = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            } else {
                // Parse from connection URL: mysql://user:pass@host:port/dbname
                $parsed = parse_url($url);
                $host   = $parsed['host'] ?? '127.0.0.1';
                $port   = $parsed['port'] ?? 3306;
                $dbname = ltrim($parsed['path'] ?? '/railway', '/');
                $user   = urldecode($parsed['user'] ?? 'root');
                $pass   = urldecode($parsed['pass'] ?? '');
                $dsn    = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            }

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT         => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                // Reconnect on timeout (important for Railway's idle connection drops)
                PDO::ATTR_TIMEOUT            => 10,
            ];

            $pdo = new PDO($dsn, $user, $pass, $options);

            // Check if DB is freshly empty → seed it
            $tables = $pdo->query("SHOW TABLES LIKE 'users'")->fetchAll();
            if (empty($tables)) {
                error_log('[SiNilai] MySQL DB empty — initializing schema and seed data...');
                self::initializeSchemaMySQL($pdo);
                self::seedData($pdo);
                error_log('[SiNilai] MySQL DB initialized successfully.');
            }

            return $pdo;

        } catch (PDOException $e) {
            error_log('[SiNilai] MySQL connection error: ' . $e->getMessage());
            // Fallback to SQLite if MySQL is unreachable (development safety net)
            error_log('[SiNilai] Falling back to SQLite...');
            return self::connectSQLite();
        }
    }

    // ── SQLite Connection (Local Development) ─────────────────────────
    private static function connectSQLite(): PDO
    {
        $writableDir = __DIR__ . '/../../writable';
        if (!is_dir($writableDir)) {
            mkdir($writableDir, 0755, true);
        }

        $dbPath = $writableDir . '/database.sqlite';
        $isNew  = !file_exists($dbPath);

        try {
            $pdo = new PDO('sqlite:' . $dbPath);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $pdo->exec('PRAGMA foreign_keys = ON;');
            $pdo->exec('PRAGMA journal_mode = WAL;');

            if ($isNew) {
                self::initializeSchema($pdo);
                self::seedData($pdo);
            }

            return $pdo;
        } catch (PDOException $e) {
            error_log('[SiNilai] SQLite connection error: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['status' => 500, 'error' => 'Internal server error']);
            exit;
        }
    }



    // ── MySQL Schema (Railway Production) ─────────────────────────────
    private static function initializeSchemaMySQL(PDO $db): void
    {
        $statements = [
            "CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                nip VARCHAR(50),
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin','guru','waka','kepsek') NOT NULL DEFAULT 'guru',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                category ENUM('Kejuruan','Umum','Muatan Lokal') DEFAULT 'Umum',
                kkm DECIMAL(5,2) DEFAULT 75.00
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                tingkat INT NOT NULL,
                jurusan VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS teacher_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                subject_id INT NOT NULL,
                class_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_assignment (teacher_id, subject_id, class_id),
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(150) NOT NULL,
                nisn VARCHAR(20) UNIQUE NOT NULL,
                nis VARCHAR(20) NOT NULL,
                nik VARCHAR(20),
                gender ENUM('L','P') DEFAULT 'L',
                class_id INT NOT NULL,
                absen_number INT DEFAULT 1,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS grades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                subject_id INT NOT NULL,
                teacher_id INT NOT NULL,
                class_id INT NOT NULL,
                uh1 DECIMAL(5,2),
                uh2 DECIMAL(5,2),
                uh3 DECIMAL(5,2),
                avg_uh DECIMAL(5,2),
                uas_teori DECIMAL(5,2),
                uas_praktik DECIMAL(5,2),
                final_score DECIMAL(5,2),
                status_kkm ENUM('Tuntas','Remedial','Belum Dinilai') DEFAULT 'Belum Dinilai',
                competency_notes TEXT,
                semester ENUM('ganjil','genap') DEFAULT 'genap',
                academic_year VARCHAR(20) DEFAULT '2024/2025',
                submitted TINYINT(1) DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_grade (student_id, subject_id, semester, academic_year),
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS grade_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_id INT NOT NULL,
                class_id INT NOT NULL,
                teacher_id INT NOT NULL,
                category ENUM('ulangan_harian','tugas') NOT NULL,
                label VARCHAR(50) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS grade_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                grade_category_id INT NOT NULL,
                score DECIMAL(5,2),
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_entry (student_id, grade_category_id),
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (grade_category_id) REFERENCES grade_categories(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS grade_formula_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_id INT NULL,
                ulangan_harian_weight DECIMAL(5,2) NOT NULL DEFAULT 40.00,
                tugas_weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                uas_weight DECIMAL(5,2) NOT NULL DEFAULT 60.00,
                updated_by INT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS site_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content_key VARCHAR(150) UNIQUE NOT NULL,
                page_group VARCHAR(50) NOT NULL,
                content_value TEXT NOT NULL,
                updated_by INT NOT NULL DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS grade_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                grade_id INT,
                changed_by VARCHAR(100) NOT NULL,
                changed_by_role VARCHAR(20) NOT NULL,
                student_name VARCHAR(150),
                subject_name VARCHAR(150),
                class_name VARCHAR(50),
                old_score DECIMAL(5,2),
                new_score DECIMAL(5,2),
                field VARCHAR(100),
                reason TEXT,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS submission_deadlines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_id INT NOT NULL,
                semester ENUM('ganjil','genap') DEFAULT 'genap',
                academic_year VARCHAR(20) DEFAULT '2024/2025',
                deadline DATE NOT NULL,
                set_by VARCHAR(100) NOT NULL,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS submission_statuses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                subject_id INT NOT NULL,
                class_id INT NOT NULL,
                status ENUM('belum_mulai','sedang_diisi','terkirim') DEFAULT 'belum_mulai',
                submitted_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_status (teacher_id, subject_id, class_id),
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS recap_windows (
                id INT AUTO_INCREMENT PRIMARY KEY,
                semester ENUM('ganjil','genap'),
                academic_year VARCHAR(20),
                opens_at DATETIME NOT NULL,
                closes_at DATETIME NOT NULL,
                set_by VARCHAR(100) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS graduated_archive (
                id INT AUTO_INCREMENT PRIMARY KEY,
                angkatan INT NOT NULL,
                class_id INT NOT NULL,
                student_id INT NOT NULL,
                subject_id INT NOT NULL,
                final_grades TEXT,
                archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS login_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45) NOT NULL,
                identifier VARCHAR(100) NOT NULL,
                attempts INT DEFAULT 1,
                locked_until DATETIME,
                last_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_attempt (ip_address, identifier)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        ];

        foreach ($statements as $sql) {
            $db->exec($sql);
        }
    }

    // ── SQLite Schema (Local Development) ─────────────────────────────
    private static function initializeSchema(PDO $db): void
    {

        $sql = "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            nip VARCHAR(50),
            password_hash VARCHAR(255) NOT NULL,
            role TEXT CHECK(role IN ('admin','guru','waka','kepsek')) NOT NULL DEFAULT 'guru',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(150) NOT NULL,
            category TEXT CHECK(category IN ('Kejuruan','Umum','Muatan Lokal')) DEFAULT 'Umum',
            kkm DECIMAL(5,2) DEFAULT 75.00
        );

        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) NOT NULL,
            tingkat INTEGER NOT NULL,
            jurusan VARCHAR(50) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS teacher_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(teacher_id, subject_id, class_id),
            FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name VARCHAR(150) NOT NULL,
            nisn VARCHAR(20) UNIQUE NOT NULL,
            nis VARCHAR(20) NOT NULL,
            nik VARCHAR(20),
            gender TEXT CHECK(gender IN ('L','P')) DEFAULT 'L',
            class_id INTEGER NOT NULL,
            absen_number INTEGER DEFAULT 1,
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            teacher_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            uh1 DECIMAL(5,2),
            uh2 DECIMAL(5,2),
            uh3 DECIMAL(5,2),
            avg_uh DECIMAL(5,2),
            uas_teori DECIMAL(5,2),
            uas_praktik DECIMAL(5,2),
            final_score DECIMAL(5,2),
            status_kkm TEXT CHECK(status_kkm IN ('Tuntas','Remedial','Belum Dinilai')) DEFAULT 'Belum Dinilai',
            competency_notes TEXT,
            semester TEXT CHECK(semester IN ('ganjil','genap')) DEFAULT 'genap',
            academic_year VARCHAR(20) DEFAULT '2024/2025',
            submitted INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, subject_id, semester, academic_year),
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS grade_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            teacher_id INTEGER NOT NULL,
            category TEXT CHECK(category IN ('ulangan_harian','tugas')) NOT NULL,
            label VARCHAR(50) NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS grade_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            grade_category_id INTEGER NOT NULL,
            score DECIMAL(5,2),
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, grade_category_id),
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY(grade_category_id) REFERENCES grade_categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS grade_formula_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NULL,
            ulangan_harian_weight DECIMAL(5,2) NOT NULL DEFAULT 40.00,
            tugas_weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            uas_weight DECIMAL(5,2) NOT NULL DEFAULT 60.00,
            updated_by INTEGER NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS site_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_key VARCHAR(150) UNIQUE NOT NULL,
            page_group VARCHAR(50) NOT NULL,
            content_value TEXT NOT NULL,
            updated_by INTEGER NOT NULL DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS grade_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grade_id INTEGER,
            changed_by VARCHAR(100) NOT NULL,
            changed_by_role VARCHAR(20) NOT NULL,
            student_name VARCHAR(150),
            subject_name VARCHAR(150),
            class_name VARCHAR(50),
            old_score DECIMAL(5,2),
            new_score DECIMAL(5,2),
            field VARCHAR(100),
            reason TEXT,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS submission_deadlines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            semester TEXT CHECK(semester IN ('ganjil','genap')) DEFAULT 'genap',
            academic_year VARCHAR(20) DEFAULT '2024/2025',
            deadline DATE NOT NULL,
            set_by VARCHAR(100) NOT NULL,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS submission_statuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('belum_mulai','sedang_diisi','terkirim')) DEFAULT 'belum_mulai',
            submitted_at DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(teacher_id, subject_id, class_id),
            FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS recap_windows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            semester TEXT CHECK(semester IN ('ganjil','genap')),
            academic_year VARCHAR(20),
            opens_at DATETIME NOT NULL,
            closes_at DATETIME NOT NULL,
            set_by VARCHAR(100) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS graduated_archive (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            angkatan INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            final_grades TEXT,
            archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address VARCHAR(45) NOT NULL,
            identifier VARCHAR(100) NOT NULL,
            attempts INTEGER DEFAULT 1,
            locked_until DATETIME,
            last_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ip_address, identifier)
        );
        ";

        $db->exec($sql);
    }

    private static function seedData(PDO $db): void
    {
        // Detect driver to use correct ignore syntax
        $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME); // 'mysql' or 'sqlite'
        $insertIgnore = ($driver === 'mysql') ? 'INSERT IGNORE' : 'INSERT OR IGNORE';

        // 1. Seed Users (7 seed accounts, hashed with bcrypt)
        $defaultPassword = password_hash('password123', PASSWORD_BCRYPT);
        $userStmt = $db->prepare("
            {$insertIgnore} INTO users (name, email, nip, password_hash, role)
            VALUES (:name, :email, :nip, :password_hash, :role)
        ");

        $users = [
            ['Administrator SiNilai', 'admin@sinilai.sch.id', '19850101 200801 1 001', 'admin'],
            ['Budi Santoso, S.Kom', 'guru.rpl@sinilai.sch.id', '19840211 200903 1 004', 'guru'],
            ['Siti Rahmawati, S.Pd', 'guru.ipa@sinilai.sch.id', '19880512 201101 2 007', 'guru'],
            ['Ahmad Dahlan, M.Pd', 'guru.mtk@sinilai.sch.id', '19790315 200501 1 002', 'guru'],
            ['Fauzi Rahman, S.T', 'guru.tkj@sinilai.sch.id', '19871104 201001 1 003', 'guru'],
            ['Drs. Hendra Setiawan', 'wakes@sinilai.sch.id', '19710820 199702 1 001', 'waka'],
            ['Dra. Sri Rahayu, M.Pd.', 'kepsek@sinilai.sch.id', '19680415 199303 2 002', 'kepsek'],
        ];

        foreach ($users as $u) {
            $userStmt->execute([
                ':name' => $u[0],
                ':email' => $u[1],
                ':nip' => $u[2],
                ':password_hash' => $defaultPassword,
                ':role' => $u[3],
            ]);
        }

        // 2. Seed Subjects
        $subjStmt = $db->prepare("
            {$insertIgnore} INTO subjects (code, name, category, kkm)
            VALUES (:code, :name, :category, :kkm)
        ");

        $subjects = [
            ['MTK', 'Matematika Terapan', 'Umum', 75.00],
            ['IPAS', 'Proyek IPAS (Sains & Sosial)', 'Umum', 75.00],
            ['RPL', 'Pemrograman Web & Perangkat Bergerak', 'Kejuruan', 75.00],
            ['TKJ', 'Administrasi Infrastruktur Jaringan', 'Kejuruan', 75.00],
            ['PM', 'Pemasaran Digital & E-Commerce', 'Kejuruan', 75.00],
            ['BIND', 'Bahasa Indonesia', 'Umum', 75.00],
            ['BING', 'Bahasa Inggris Kejuruan', 'Umum', 75.00],
            ['PAI', 'Pendidikan Agama & Budi Pekerti', 'Umum', 75.00],
        ];

        foreach ($subjects as $s) {
            $subjStmt->execute([
                ':code' => $s[0],
                ':name' => $s[1],
                ':category' => $s[2],
                ':kkm' => $s[3],
            ]);
        }

        // 3. Seed Classes
        $classStmt = $db->prepare("
            {$insertIgnore} INTO classes (name, tingkat, jurusan)
            VALUES (:name, :tingkat, :jurusan)
        ");

        $classes = [
            ['10 RPL 1', 10, 'RPL'],
            ['10 RPL 2', 10, 'RPL'],
            ['10 TKJ', 10, 'TKJ'],
            ['10 PM', 10, 'PM'],
            ['11 RPL', 11, 'RPL'],
            ['12 RPL', 12, 'RPL'],
        ];

        foreach ($classes as $c) {
            $classStmt->execute([
                ':name' => $c[0],
                ':tingkat' => $c[1],
                ':jurusan' => $c[2],
            ]);
        }

        // 4. Seed Teacher Assignments (ID 2=Budi Santoso (RPL), ID 3=Siti (IPAS), ID 4=Ahmad (MTK))
        $assignStmt = $db->prepare("
            {$insertIgnore} INTO teacher_assignments (teacher_id, subject_id, class_id)
            VALUES (:teacher_id, :subject_id, :class_id)
        ");

        $assignments = [
            // Budi Santoso (teacher_id: 2) -> RPL (subj: 3) in 10 RPL 1 (cls: 1), 10 RPL 2 (cls: 2), 11 RPL (cls: 5)
            [2, 3, 1], [2, 3, 2], [2, 3, 5],
            // Siti Rahmawati (teacher_id: 3) -> IPAS (subj: 2) in 10 RPL 1 (cls: 1), 10 TKJ (cls: 3), 10 PM (cls: 4)
            [3, 2, 1], [3, 2, 3], [3, 2, 4],
            // Ahmad Dahlan (teacher_id: 4) -> MTK (subj: 1) in 10 RPL 1 (cls: 1), 10 TKJ (cls: 3), 10 PM (cls: 4)
            [4, 1, 1], [4, 1, 3], [4, 1, 4],
            // Fauzi Rahman (teacher_id: 5) -> TKJ (subj: 4) in 10 TKJ (cls: 3)
            [5, 4, 3],
        ];

        foreach ($assignments as $a) {
            $assignStmt->execute([
                ':teacher_id' => $a[0],
                ':subject_id' => $a[1],
                ':class_id' => $a[2],
            ]);
        }

        // 5. Seed Students
        $studentStmt = $db->prepare("
            {$insertIgnore} INTO students (full_name, nisn, nis, gender, class_id, absen_number)
            VALUES (:full_name, :nisn, :nis, :gender, :class_id, :absen_number)
        ");

        $students = [
            ['Aditya Pratama', '0061298411', '242510001', 'L', 1, 1],
            ['Annisa Putri Rahmadani', '0061298412', '242510002', 'P', 1, 2],
            ['Bayu Saputra', '0061298413', '242510003', 'L', 1, 3],
            ['Cantika Dewi Maharani', '0061298414', '242510004', 'P', 1, 4],
            ['Dimas Kurniawan', '0061298415', '242510005', 'L', 1, 5],
            // 10 TKJ
            ['Joko Susilo', '0062399101', '242520001', 'L', 3, 1],
            ['Karina Amanda', '0062399102', '242520002', 'P', 3, 2],
            // 10 PM
            ['Oki Setiawan', '0063499201', '242530001', 'L', 4, 1],
            ['Putri Handayani', '0063499202', '242530002', 'P', 4, 2],
        ];

        foreach ($students as $st) {
            $studentStmt->execute([
                ':full_name' => $st[0],
                ':nisn' => $st[1],
                ':nis' => $st[2],
                ':gender' => $st[3],
                ':class_id' => $st[4],
                ':absen_number' => $st[5],
            ]);
        }

        // 6. Seed Initial Grades for Aditya, Annisa, Bayu
        $gradeStmt = $db->prepare("
            INSERT INTO grades (student_id, subject_id, teacher_id, class_id, uh1, uh2, uh3, avg_uh, uas_teori, uas_praktik, final_score, status_kkm, competency_notes, semester, academic_year, submitted)
            VALUES (:student_id, :subject_id, :teacher_id, :class_id, :uh1, :uh2, :uh3, :avg_uh, :uas_teori, :uas_praktik, :final_score, :status_kkm, :competency_notes, 'genap', '2024/2025', 0)
        ");

        $gradeStmt->execute([
            ':student_id' => 1,
            ':subject_id' => 3, // RPL
            ':teacher_id' => 2, // Budi Santoso
            ':class_id' => 1,   // 10 RPL 1
            ':uh1' => 84.0,
            ':uh2' => 88.0,
            ':uh3' => 80.0,
            ':avg_uh' => 84.0,
            ':uas_teori' => 85.0,
            ':uas_praktik' => 86.0,
            ':final_score' => 84.8,
            ':status_kkm' => 'Tuntas',
            ':competency_notes' => 'Sangat menguasai sintaks JavaScript modern dan layout Tailwind CSS.',
        ]);

        // 7. Seed Deadlines
        $ddlStmt = $db->prepare("
            INSERT INTO submission_deadlines (subject_id, semester, academic_year, deadline, set_by)
            VALUES (:subject_id, 'genap', '2024/2025', :deadline, 'Waka Kurikulum')
        ");
        $ddlStmt->execute([':subject_id' => 3, ':deadline' => '2026-10-15']);
        $ddlStmt->execute([':subject_id' => 1, ':deadline' => '2026-10-18']);
        $ddlStmt->execute([':subject_id' => 2, ':deadline' => '2026-10-20']);

        // 8. Seed Initial Submission Statuses
        $statusStmt = $db->prepare("
            INSERT INTO submission_statuses (teacher_id, subject_id, class_id, status, updated_at)
            VALUES (:teacher_id, :subject_id, :class_id, :status, CURRENT_TIMESTAMP)
        ");
        $statusStmt->execute([':teacher_id' => 2, ':subject_id' => 3, ':class_id' => 1, ':status' => 'sedang_diisi']);
        $statusStmt->execute([':teacher_id' => 4, ':subject_id' => 1, ':class_id' => 3, ':status' => 'terkirim']);

        // 9. Seed Site Content defaults
        $contentStmt = $db->prepare("
            {$insertIgnore} INTO site_content (content_key, page_group, content_value, updated_by)
            VALUES (:key, :group, :val, 1)
        ");

        $defaultContent = [
            ['login.title', 'login', 'Portal Masuk SiNilai SMK'],
            ['login.subtitle', 'login', 'Silakan masuk dengan akun terdaftar Anda'],
            ['dashboard_guru.welcome', 'dashboard_guru', 'Selamat datang, {nama_guru}'],
            ['dashboard_guru.deadline_label', 'dashboard_guru', 'Batas Waktu Pengumpulan Nilai'],
            ['dashboard_waka.tracker_title', 'dashboard_waka', 'Status Pengumpulan Nilai Rapor'],
            ['dashboard_kepsek.header_title', 'dashboard_kepsek', 'Dashboard Akademik SMK'],
            ['dashboard_admin.header_title', 'dashboard_admin', 'Panel Kontrol Administrator'],
            ['global.footer_note', 'global', 'SMKN 1 Tanjungpandan'],
            ['global.app_title', 'global', 'SiNilai SMK'],
        ];

        foreach ($defaultContent as $c) {
            $contentStmt->execute([
                ':key' => $c[0],
                ':group' => $c[1],
                ':val' => $c[2],
            ]);
        }
    }
}
