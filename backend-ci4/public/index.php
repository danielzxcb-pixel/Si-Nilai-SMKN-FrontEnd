<?php

// Front Controller & Security Hardening Router for SiNilai SMK
require_once __DIR__ . '/../vendor/autoload.php';

// Disable error display in production to prevent leaking sensitive system paths
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// 1. Security Headers (OWASP Recommended)
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Type: application/json; charset=UTF-8');

// 2. Strict CORS Configuration (Only allow trusted frontend origin, never wildcard '*')
$allowedOrigin = 'http://localhost:5173';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin === $allowedOrigin) {
    header("Access-Control-Allow-Origin: {$allowedOrigin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 3. Routing
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Health check
    if ($uri === '/api/health' && $method === 'GET') {
        echo json_encode(['status' => 'ok', 'timestamp' => date('Y-m-d H:i:s')]);
        exit;
    }

    // Auth Routes
    if ($uri === '/api/login' && $method === 'POST') {
        App\Controllers\AuthController::login();
        exit;
    }
    if ($uri === '/api/me' && $method === 'GET') {
        App\Controllers\AuthController::me();
        exit;
    }
    if ($uri === '/api/admin/reset-password' && $method === 'POST') {
        App\Controllers\AuthController::resetPassword();
        exit;
    }

    // Grade Routes
    if ($uri === '/api/grades' && $method === 'GET') {
        App\Controllers\GradeController::index();
        exit;
    }
    if ($uri === '/api/grades' && $method === 'POST') {
        App\Controllers\GradeController::save();
        exit;
    }
    if ($uri === '/api/grades/submit' && $method === 'POST') {
        App\Controllers\GradeController::submit();
        exit;
    }
    if (preg_match('#^/api/grade-categories/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        App\Controllers\GradeController::deleteCategory((int)$matches[1]);
        exit;
    }
    if ($uri === '/api/grade-formula-settings' && $method === 'GET') {
        App\Controllers\FormulaSettingsController::index();
        exit;
    }
    if ($uri === '/api/grade-formula-settings' && ($method === 'POST' || $method === 'PUT')) {
        App\Controllers\FormulaSettingsController::save();
        exit;
    }

    // Site Content Routes
    if ($uri === '/api/site-content' && $method === 'GET') {
        App\Controllers\Api\SiteContentController::index();
        exit;
    }
    if ($uri === '/api/site-content/bulk' && $method === 'POST') {
        App\Controllers\Api\SiteContentController::bulkUpdate();
        exit;
    }
    if (preg_match('#^/api/site-content/([^/]+)$#', $uri, $matches) && $method === 'PUT') {
        App\Controllers\Api\SiteContentController::updateSingle(urldecode($matches[1]));
        exit;
    }

    // Monitoring Routes
    if ($uri === '/api/monitoring/stats' && $method === 'GET') {
        App\Controllers\MonitoringController::stats();
        exit;
    }
    if ($uri === '/api/monitoring/deadline' && $method === 'POST') {
        App\Controllers\MonitoringController::setDeadline();
        exit;
    }
    if ($uri === '/api/monitoring/return-revision' && $method === 'POST') {
        App\Controllers\MonitoringController::returnRevision();
        exit;
    }

    // Tracker Routes
    if ($uri === '/api/tracker/submissions' && $method === 'GET') {
        App\Controllers\SubmissionTrackerController::index();
        exit;
    }

    // Admin & Teacher Assignment Routes
    if (preg_match('#^/api/teachers/(\d+)/permissions$#', $uri, $matches) && $method === 'POST') {
        $controller = new App\Controllers\Api\TeacherAssignmentController();
        $controller->updatePermissions((int)$matches[1]);
        exit;
    }
    if ($uri === '/api/admin/subjects' && $method === 'POST') {
        App\Controllers\AdminController::createSubject();
        exit;
    }
    if (preg_match('#^/api/admin/subjects/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        App\Controllers\AdminController::deleteSubject((int)$matches[1]);
        exit;
    }
    if ($uri === '/api/admin/classes' && $method === 'POST') {
        App\Controllers\AdminController::createClass();
        exit;
    }
    if (preg_match('#^/api/admin/classes/(\d+)$#', $uri, $matches) && $method === 'DELETE') {
        App\Controllers\AdminController::deleteClass((int)$matches[1]);
        exit;
    }
    if ($uri === '/api/admin/settings' && $method === 'POST') {
        App\Controllers\AdminController::updateSiteSettings();
        exit;
    }
    if ($uri === '/api/admin/teachers' && $method === 'GET') {
        App\Controllers\AdminController::listTeachers();
        exit;
    }
    if ($uri === '/api/admin/import-students' && $method === 'POST') {
        App\Controllers\ImportExportController::importStudents();
        exit;
    }

    // Archive Routes
    if ($uri === '/api/archive/student-grades' && $method === 'GET') {
        App\Controllers\ArchiveController::studentGrades();
        exit;
    }
    if ($uri === '/api/archive/graduated' && $method === 'GET') {
        App\Controllers\ArchiveController::graduatedList();
        exit;
    }

    // 404 Route Not Found
    http_response_code(404);
    echo json_encode([
        'status' => 404,
        'error' => 'Not Found',
        'message' => "Endpoint API '{$uri}' tidak ditemukan."
    ]);
} catch (\Throwable $e) {
    // Production Error Handling: Never leak stack trace, file path, or DB schema details
    error_log("Unhandled exception [{$e->getCode()}]: {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}");
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'error' => 'Internal Server Error',
        'message' => 'Terjadi kesalahan internal pada server. Silakan hubungi administrator.'
    ]);
}
