<?php

/**
 * SiNilai SMK — Hardened Realtime WebSocket Broadcast Daemon
 * - Authenticates JWT before allowing subscription to sensitive channels
 * - Role-based channel access (e.g. tracker channel restricted to waka/kepsek/admin)
 * - Sanitizes all broadcasted payloads
 * Run with: php backend-ci4/websocket-server.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Libraries\JWT;

$host = '127.0.0.1';
$port = 8080;

$server = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if (!$server) {
    die("Failed to create socket: " . socket_strerror(socket_last_error()) . "\n");
}

socket_set_option($server, SOL_SOCKET, SO_REUSEADDR, 1);
if (!@socket_bind($server, $host, $port)) {
    die("Failed to bind socket to {$host}:{$port}\n");
}
socket_listen($server);

echo "=======================================================\n";
echo " SiNilai SMK — Hardened WebSocket Daemon Active\n";
echo " Listening on: ws://{$host}:{$port}\n";
echo " Security: Mandatory JWT Auth & Role-Based Scoping\n";
echo "=======================================================\n";

$clients = [$server];
$clientSessions = []; // client_id => ['authenticated' => bool, 'user' => array, 'channels' => array]

while (true) {
    $read = $clients;
    $write = null;
    $except = null;

    if (socket_select($read, $write, $except, 0, 10) < 1) {
        continue;
    }

    if (in_array($server, $read)) {
        $newClient = socket_accept($server);
        $clients[] = $newClient;
        $clientId = (int)$newClient;

        $header = socket_read($newClient, 1024);
        performHandshake($header, $newClient, $host, $port);

        $clientSessions[$clientId] = [
            'authenticated' => false,
            'user' => null,
            'channels' => []
        ];

        echo "[" . date('H:i:s') . " WIB] Client connected: #{$clientId} (Pending JWT Auth)\n";
        unset($read[array_search($server, $read)]);
    }

    foreach ($read as $client) {
        $clientId = (int)$client;
        $data = @socket_read($client, 4096, PHP_BINARY_READ);

        if ($data === false || $data === '') {
            $key = array_search($client, $clients);
            unset($clients[$key]);
            unset($clientSessions[$clientId]);
            @socket_close($client);
            echo "[" . date('H:i:s') . " WIB] Client disconnected: #{$clientId}\n";
            continue;
        }

        $decoded = unmask($data);
        if (empty($decoded)) continue;

        $payload = json_decode($decoded, true);
        if (!$payload) continue;

        $action = $payload['action'] ?? '';

        // 1. JWT Authentication Handshake
        if ($action === 'authenticate') {
            $token = $payload['token'] ?? '';
            $tokenData = JWT::validateToken($token);

            if ($tokenData && isset($tokenData['user'])) {
                $clientSessions[$clientId]['authenticated'] = true;
                $clientSessions[$clientId]['user'] = (array)$tokenData['user'];
                $userRole = $clientSessions[$clientId]['user']['role'];
                $userName = $clientSessions[$clientId]['user']['name'];

                $response = [
                    'event' => 'AUTH_SUCCESS',
                    'message' => "Autentikasi berhasil sebagai {$userName} ({$userRole}).",
                    'timestamp' => date('d M Y H:i:s') . ' WIB'
                ];
                @socket_write($client, mask(json_encode($response)));
                echo "[" . date('H:i:s') . " WIB] Client #{$clientId} authenticated as {$userName} ({$userRole})\n";
            } else {
                $response = [
                    'event' => 'AUTH_FAILED',
                    'message' => 'Token JWT tidak valid atau kedaluwarsa. Koneksi ditolak.',
                ];
                @socket_write($client, mask(json_encode($response)));
                // Disconnect unauthenticated client
                $key = array_search($client, $clients);
                unset($clients[$key]);
                unset($clientSessions[$clientId]);
                @socket_close($client);
                echo "[" . date('H:i:s') . " WIB] Client #{$clientId} dropped due to invalid JWT.\n";
            }
            continue;
        }

        // 2. Channel Subscription with Role Authorization
        if ($action === 'subscribe') {
            if (empty($clientSessions[$clientId]['authenticated'])) {
                $err = ['event' => 'ERROR', 'message' => 'Harap lakukan autentikasi JWT terlebih dahulu.'];
                @socket_write($client, mask(json_encode($err)));
                continue;
            }

            $channel = $payload['channel'] ?? '';
            $userRole = $clientSessions[$clientId]['user']['role'] ?? '';

            // Security Rule: Sensitive 'tracker' channel restricted to wakes/kepsek/admin!
            if ($channel === 'tracker' && !in_array($userRole, ['waka', 'kepsek', 'admin'], true)) {
                $err = [
                    'event' => 'FORBIDDEN',
                    'message' => "Akses channel 'tracker' ditolak untuk peran {$userRole}."
                ];
                @socket_write($client, mask(json_encode($err)));
                echo "[" . date('H:i:s') . " WIB] Blocked client #{$clientId} ({$userRole}) from channel 'tracker'\n";
                continue;
            }

            $clientSessions[$clientId]['channels'][] = $channel;
            $res = ['event' => 'SUBSCRIBED', 'channel' => $channel];
            @socket_write($client, mask(json_encode($res)));
            continue;
        }

        // 3. Broadcast Event (Sanitizing user input)
        if ($action === 'broadcast') {
            if (empty($clientSessions[$clientId]['authenticated'])) continue;

            $eventData = $payload['data'] ?? [];
            // Sanitize all strings in payload
            array_walk_recursive($eventData, function (&$val) {
                if (is_string($val)) {
                    $val = htmlspecialchars($val, ENT_QUOTES, 'UTF-8');
                }
            });

            $broadcastMsg = json_encode([
                'event' => htmlspecialchars($payload['event'] ?? 'UPDATE', ENT_QUOTES, 'UTF-8'),
                'data' => $eventData,
                'broadcast_at' => date('d M Y H:i:s') . ' WIB'
            ]);

            foreach ($clients as $targetClient) {
                if ($targetClient !== $server) {
                    $targetId = (int)$targetClient;
                    // Only broadcast to authenticated clients
                    if (!empty($clientSessions[$targetId]['authenticated'])) {
                        @socket_write($targetClient, mask($broadcastMsg));
                    }
                }
            }
        }
    }
}

function performHandshake($header, $client, $host, $port)
{
    $headers = [];
    $lines = preg_split("/\r\n/", $header);
    foreach ($lines as $line) {
        $line = chop($line);
        if (preg_match('/\A(\S+): (.*)\z/', $line, $matches)) {
            $headers[$matches[1]] = $matches[2];
        }
    }

    if (isset($headers['Sec-WebSocket-Key'])) {
        $secKey = $headers['Sec-WebSocket-Key'];
        $secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
        $buffer = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
                  "Upgrade: websocket\r\n" .
                  "Connection: Upgrade\r\n" .
                  "WebSocket-Origin: $host\r\n" .
                  "WebSocket-Location: ws://$host:$port\r\n" .
                  "Sec-WebSocket-Accept:$secAccept\r\n\r\n";
        socket_write($client, $buffer, strlen($buffer));
    }
}

function unmask($text)
{
    $length = ord($text[1]) & 127;
    if ($length == 126) {
        $masks = substr($text, 4, 4);
        $data = substr($text, 8);
    } elseif ($length == 127) {
        $masks = substr($text, 10, 4);
        $data = substr($text, 14);
    } else {
        $masks = substr($text, 2, 4);
        $data = substr($text, 6);
    }
    $text = "";
    for ($i = 0; $i < strlen($data); ++$i) {
        $text .= $data[$i] ^ $masks[$i % 4];
    }
    return $text;
}

function mask($text)
{
    $b1 = 0x80 | (0x1 & 0x0f);
    $length = strlen($text);

    if ($length <= 125) {
        $header = pack('CC', $b1, $length);
    } elseif ($length > 125 && $length < 65536) {
        $header = pack('CCn', $b1, 126, $length);
    } else {
        $header = pack('CCNN', $b1, 127, $length);
    }
    return $header . $text;
}
