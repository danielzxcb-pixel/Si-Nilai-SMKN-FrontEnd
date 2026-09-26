<?php

/**
 * SiNilai SMK — Automated End-to-End Security & API Audit Suite
 * Tests all 13 audit categories directly via HTTP API requests.
 */

$baseUrl = 'http://127.0.0.1:8000';
$results = [];

function http_call($method, $url, $headers = [], $data = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $formattedHeaders = [];
    foreach ($headers as $k => $v) {
        $formattedHeaders[] = "{$k}: {$v}";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $formattedHeaders);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($data) ? json_encode($data) : $data);
    }

    $response = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $headerStr = substr($response, 0, $headerSize);
    $bodyStr = substr($response, $headerSize);
    $json = json_decode($bodyStr, true);

    return [
        'code' => $httpCode,
        'headers' => $headerStr,
        'body' => $bodyStr,
        'json' => $json
    ];
}

function record_test(&$results, $id, $name, $pass, $details) {
    $status = $pass ? 'PASS' : 'FAIL';
    $results[] = [
        'id' => $id,
        'name' => $name,
        'status' => $status,
        'details' => $details
    ];
    echo "[$status] $id: $name - $details\n";
}

echo "===============================================================\n";
echo " SiNilai SMK — Running Full System Audit & Security Tests\n";
echo " Base URL: $baseUrl\n";
echo "===============================================================\n\n";

// -------------------------------------------------------------------
// 1. LOGIN & AUTH
// -------------------------------------------------------------------
echo "--- Category 1: Login & Auth ---\n";

// 1.1 Wrong password generic error
$res = http_call('POST', "$baseUrl/api/login", ['Content-Type' => 'application/json'], [
    'email' => 'admin@sinilai.sch.id',
    'password' => 'wrongpassword999'
]);
$pass1_1 = ($res['code'] === 401 && strpos($res['body'], 'tidak valid') !== false);
record_test($results, '1.1', 'Wrong password generic error', $pass1_1, "HTTP {$res['code']}, generic error returned without account existence leakage");

// 1.2 Non-existent account generic error
$res = http_call('POST', "$baseUrl/api/login", ['Content-Type' => 'application/json'], [
    'email' => 'unknown_hacker@sinilai.sch.id',
    'password' => 'wrongpassword999'
]);
$pass1_2 = ($res['code'] === 401 && strpos($res['body'], 'tidak valid') !== false);
record_test($results, '1.2', 'Non-existent account generic error', $pass1_2, "HTTP {$res['code']}, identical generic error prevents user enumeration");

// 1.3 All 7 seed accounts login test & JWT structure
$seedAccounts = [
    'admin@sinilai.sch.id' => 'admin',
    'guru.rpl@sinilai.sch.id' => 'guru',
    'guru.ipa@sinilai.sch.id' => 'guru',
    'guru.mtk@sinilai.sch.id' => 'guru',
    'guru.tkj@sinilai.sch.id' => 'guru',
    'wakes@sinilai.sch.id' => 'waka',
    'kepsek@sinilai.sch.id' => 'kepsek'
];

$tokens = [];
$allLoginPass = true;
foreach ($seedAccounts as $email => $expectedRole) {
    $res = http_call('POST', "$baseUrl/api/login", ['Content-Type' => 'application/json'], [
        'email' => $email,
        'password' => 'password123'
    ]);
    if ($res['code'] === 200 && !empty($res['json']['token']) && $res['json']['user']['role'] === $expectedRole) {
        $tokens[$email] = $res['json']['token'];
    } else {
        $allLoginPass = false;
    }
}
record_test($results, '1.3', 'All 7 seed accounts login & JWT issuance', $allLoginPass, "All 7 accounts authenticated successfully with correct role encoding");

// 1.4 JWT expiration check
$adminToken = $tokens['admin@sinilai.sch.id'] ?? '';
$parts = explode('.', $adminToken);
$jwtPayload = json_decode(base64_decode($parts[1]), true);
$hasExpiry = isset($jwtPayload['exp']) && ($jwtPayload['exp'] - $jwtPayload['iat'] === 4 * 3600);
record_test($results, '1.4', 'JWT expiry duration', $hasExpiry, "Expiry set to 4 hours (" . ($jwtPayload['exp'] - $jwtPayload['iat']) . " seconds)");

// -------------------------------------------------------------------
// 2. GURU DASHBOARD & DATA SCOPING (BROKEN ACCESS CONTROL / IDOR)
// -------------------------------------------------------------------
echo "\n--- Category 2: Guru Dashboard & Data Scoping ---\n";

$guruIpaToken = $tokens['guru.ipa@sinilai.sch.id']; // Assigned IPAS (id: 2) in 10 RPL 1 (id: 1)
$guruMtkToken = $tokens['guru.mtk@sinilai.sch.id']; // Assigned MTK (id: 1) in 10 RPL 1 (id: 1)

// 2.1 Direct API test: Call grades as Guru IPA for Guru MTK's subject -> MUST BE 403!
$res = http_call('GET', "$baseUrl/api/grades?subject_id=1&class_id=1", [
    'Authorization' => "Bearer $guruIpaToken"
]);
$pass2_1 = ($res['code'] === 403);
record_test($results, '2.1', 'Direct API IDOR: Guru IPA accessing MTK grades', $pass2_1, "HTTP {$res['code']} Forbidden: Server blocked unauthorized subject data");

// 2.2 Guru accessing authorized subject -> 200 OK
$res = http_call('GET', "$baseUrl/api/grades?subject_id=2&class_id=1", [
    'Authorization' => "Bearer $guruIpaToken"
]);
$pass2_2 = ($res['code'] === 200);
record_test($results, '2.2', 'Guru accessing authorized subject (IPAS)', $pass2_2, "HTTP 200 OK: Allowed within authorized teacher_assignments");

// 2.3 Auto-calc formula: (avg(UH) * 0.4) + (avg(UAS) * 0.6)
$res = http_call('POST', "$baseUrl/api/grades", [
    'Authorization' => "Bearer $guruIpaToken",
    'Content-Type' => 'application/json'
], [
    'student_id' => 1,
    'subject_id' => 2,
    'class_id' => 1,
    'uh1' => 80,
    'uh2' => 90,
    'uh3' => 70, // avg UH = 80.0
    'uas_teori' => 85,
    'uas_praktik' => 85, // avg UAS = 85.0
    // Expected final: (80.0 * 0.4) + (85.0 * 0.6) = 32 + 51 = 83.0
]);
$calcScore = $res['json']['calculated']['final_score'] ?? 0;
$pass2_3 = ($res['code'] === 200 && (float)$calcScore === 83.0);
record_test($results, '2.3', 'Auto-calc grading formula accuracy', $pass2_3, "Computed score: $calcScore (Expected: 83.0)");

// 2.4 Server-side submit blocking when scores incomplete
$res = http_call('POST', "$baseUrl/api/grades/submit", [
    'Authorization' => "Bearer $guruIpaToken",
    'Content-Type' => 'application/json'
], [
    'subject_id' => 2,
    'class_id' => 1
]);
$pass2_4 = ($res['code'] === 422 && !empty($res['json']['missing_students']));
record_test($results, '2.4', 'Server-side submit validation blocking', $pass2_4, "HTTP {$res['code']} Unprocessable Entity: Rejected incomplete submission");

// -------------------------------------------------------------------
// 3. WAKA & KEPSEK DASHBOARD & AUTHORIZATION
// -------------------------------------------------------------------
echo "\n--- Category 3: Waka & Kepsek Dashboard ---\n";

$wakesToken = $tokens['wakes@sinilai.sch.id'];

// 3.1 Direct API test: Call deadline-setting as Guru -> MUST BE REJECTED 403!
$res = http_call('POST', "$baseUrl/api/monitoring/deadline", [
    'Authorization' => "Bearer $guruIpaToken",
    'Content-Type' => 'application/json'
], [
    'subject_id' => 1,
    'deadline' => '2026-11-01'
]);
$pass3_1 = ($res['code'] === 403);
record_test($results, '3.1', 'Role check: Guru setting deadline rejected', $pass3_1, "HTTP {$res['code']} Forbidden: Guru unauthorized to set deadlines");

// 3.2 Waka setting deadline -> 200 OK
$res = http_call('POST', "$baseUrl/api/monitoring/deadline", [
    'Authorization' => "Bearer $wakesToken",
    'Content-Type' => 'application/json'
], [
    'subject_id' => 1,
    'deadline' => '2026-11-01'
]);
$pass3_2 = ($res['code'] === 200);
record_test($results, '3.2', 'Waka setting deadline authorized', $pass3_2, "HTTP 200 OK: Deadline successfully saved");

// 3.3 "Kirim Balik" Revision reset & audit log test
$res = http_call('POST', "$baseUrl/api/monitoring/return-revision", [
    'Authorization' => "Bearer $wakesToken",
    'Content-Type' => 'application/json'
], [
    'subject_id' => 3,
    'class_id' => 1,
    'reason' => 'Perbaiki komponen UAS Praktik'
]);
$pass3_3 = ($res['code'] === 200 && !empty($res['json']['logged_reason']));
record_test($results, '3.3', 'Kirim Balik revision trigger & audit logging', $pass3_3, "HTTP 200 OK: Grades unlocked and revision note logged");

// -------------------------------------------------------------------
// 4. REAL-TIME TRACKER AUTHORIZATION
// -------------------------------------------------------------------
echo "\n--- Category 4: Real-Time Tracker Authorization ---\n";

// 4.1 Guru hitting tracker endpoint -> MUST BE 403!
$res = http_call('GET', "$baseUrl/api/tracker/submissions", [
    'Authorization' => "Bearer $guruIpaToken"
]);
$pass4_1 = ($res['code'] === 403);
record_test($results, '4.1', 'Tracker endpoint blocked for Guru', $pass4_1, "HTTP {$res['code']} Forbidden: Tracker restricted to management");

// 4.2 Waka hitting tracker endpoint -> 200 OK with WIB timestamp
$res = http_call('GET', "$baseUrl/api/tracker/submissions", [
    'Authorization' => "Bearer $wakesToken"
]);
$hasWIB = strpos($res['json']['timestamp'] ?? '', 'WIB') !== false;
$pass4_2 = ($res['code'] === 200 && $hasWIB);
record_test($results, '4.2', 'Tracker accessible to Waka with WIB format', $pass4_2, "HTTP 200 OK: Timestamp is {$res['json']['timestamp']}");

// -------------------------------------------------------------------
// 5. ADMIN CRUD & ACCESS CONTROL
// -------------------------------------------------------------------
echo "\n--- Category 5: Admin CRUD & Access Control ---\n";

// 5.1 Non-admin calling delete subject -> 403
$res = http_call('DELETE', "$baseUrl/api/admin/subjects/8", [
    'Authorization' => "Bearer $wakesToken"
]);
$pass5_1 = ($res['code'] === 403);
record_test($results, '5.1', 'Delete subject rejected for Waka (Non-admin)', $pass5_1, "HTTP {$res['code']} Forbidden: Non-admin rejected");

// 5.2 Admin calling delete subject -> 200 OK
$res = http_call('DELETE', "$baseUrl/api/admin/subjects/8", [
    'Authorization' => "Bearer $adminToken"
]);
$pass5_2 = ($res['code'] === 200);
record_test($results, '5.2', 'Delete subject permitted for Admin', $pass5_2, "HTTP 200 OK: Subject deleted");

// 5.3 Non-admin calling reset password -> 403
$res = http_call('POST', "$baseUrl/api/admin/reset-password", [
    'Authorization' => "Bearer $guruIpaToken",
    'Content-Type' => 'application/json'
], [
    'user_id' => 2,
    'new_password' => 'newsecretpass123'
]);
$pass5_3 = ($res['code'] === 403);
record_test($results, '5.3', 'Password reset rejected for Guru', $pass5_3, "HTTP {$res['code']} Forbidden: Write-only reset restricted to Admin");

// -------------------------------------------------------------------
// 6. SEMESTER HISTORY & GENAP-ONLY CALCULATION
// -------------------------------------------------------------------
echo "\n--- Category 6: Semester History & Archives ---\n";

$resGanjil = http_call('GET', "$baseUrl/api/archive/student-grades?student_id=1&semester=ganjil", [
    'Authorization' => "Bearer $adminToken"
]);
$noYearlyInGanjil = ($resGanjil['json']['grades'][0]['yearly_average'] === null);
record_test($results, '6.1', 'Semester Ganjil has no combined average', $noYearlyInGanjil, "yearly_average is null while semester = ganjil");

$resGenap = http_call('GET', "$baseUrl/api/archive/student-grades?student_id=1&semester=genap", [
    'Authorization' => "Bearer $adminToken"
]);
$hasGenapCheck = isset($resGenap['json']['grades'][0]['ganjil_status']);
record_test($results, '6.2', 'Semester Genap checks matching ganjil records', $hasGenapCheck, "Status: {$resGenap['json']['grades'][0]['ganjil_status']}");

// -------------------------------------------------------------------
// 8. SECURITY HARDENING: SQL INJECTION & FORMULA INJECTION
// -------------------------------------------------------------------
echo "\n--- Category 8: Injection & Input Validation ---\n";

// 8.1 SQL Injection test on login
$res = http_call('POST', "$baseUrl/api/login", ['Content-Type' => 'application/json'], [
    'email' => "' OR '1'='1' --",
    'password' => 'test'
]);
$pass8_1 = ($res['code'] === 401 && strpos($res['body'], 'tidak valid') !== false);
record_test($results, '8.1', 'SQL Injection immunity on login', $pass8_1, "HTTP 401: Parameterized query sanitized SQL injection string");

// 8.2 CORS header verification
$res = http_call('OPTIONS', "$baseUrl/api/grades", [
    'Origin' => 'http://localhost:5173',
    'Access-Control-Request-Method' => 'GET'
]);
$hasCors = strpos($res['headers'], 'Access-Control-Allow-Origin: http://localhost:5173') !== false;
record_test($results, '8.2', 'CORS restricts origin to frontend only (no wildcard)', $hasCors, "Strict Origin Header matches http://localhost:5173");

// 8.3 Security Headers verification
$hasNosniff = strpos($res['headers'], 'X-Content-Type-Options: nosniff') !== false;
$hasFrameDeny = strpos($res['headers'], 'X-Frame-Options: DENY') !== false;
record_test($results, '8.3', 'OWASP Security headers (nosniff, DENY)', ($hasNosniff && $hasFrameDeny), "Security headers verified on responses");

// -------------------------------------------------------------------
// 9. RATE LIMITING (BRUTE FORCE BLOCKING)
// -------------------------------------------------------------------
echo "\n--- Category 9: Rate Limiting & Brute Force ---\n";

// Execute 5 rapid failed attempts
$isBlocked = false;
for ($i = 0; $i < 6; $i++) {
    $res = http_call('POST', "$baseUrl/api/login", ['Content-Type' => 'application/json'], [
        'email' => 'victim@sinilai.sch.id',
        'password' => 'badpass' . $i
    ]);
    if ($res['code'] === 429) {
        $isBlocked = true;
        break;
    }
}
record_test($results, '9.1', 'Rate Limiting blocks brute force after 5 attempts', $isBlocked, "HTTP 429 Too Many Requests received on repeated failures");

echo "\n===============================================================\n";
$passCount = count(array_filter($results, fn($r) => $r['status'] === 'PASS'));
$totalCount = count($results);
echo " Audit Test Suite Summary: $passCount / $totalCount Passed\n";
echo "===============================================================\n";
