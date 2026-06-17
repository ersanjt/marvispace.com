<?php
declare(strict_types=1);

/** @var string|null */
$GLOBALS['marvispace_mail_last_error'] = null;

function mail_set_last_error(string $message): void
{
    $GLOBALS['marvispace_mail_last_error'] = $message;
    error_log('MARVISPACE mail: ' . $message);
}

function mail_last_error(): string
{
    return (string) ($GLOBALS['marvispace_mail_last_error'] ?? '');
}

function mail_host_resolves(string $host): bool
{
    if ($host === 'localhost' || $host === '127.0.0.1') {
        return true;
    }

    return gethostbyname($host) !== $host;
}

/** cPanel: send via local Exim on localhost when mail.domain has no DNS yet */
function mail_recommended_smtp(): array
{
    $domain = 'marvispace.com';
    $mailHost = 'mail.' . $domain;

    if (mail_host_resolves($mailHost)) {
        return ['host' => $mailHost, 'port' => 465, 'secure' => 'ssl'];
    }

    return ['host' => 'localhost', 'port' => 587, 'secure' => 'tls'];
}

function mail_config(): array
{
    $config = app_config();
    $mail = $config['mail'] ?? [];
    $site = $config['site'] ?? [];
    $smtp = $mail['smtp'] ?? [];

    return [
        'from' => (string) ($mail['from'] ?? 'orders@marvispace.com'),
        'from_name' => (string) ($mail['from_name'] ?? 'MARVISPACE'),
        'admin_notify' => (string) ($mail['admin_notify'] ?? 'admin@marvispace.com'),
        'site_url' => rtrim((string) ($site['url'] ?? 'https://marvispace.com'), '/'),
        'support' => (string) ($mail['support'] ?? 'support@marvispace.com'),
        'smtp' => [
            'host' => (string) ($smtp['host'] ?? mail_recommended_smtp()['host']),
            'port' => (int) ($smtp['port'] ?? mail_recommended_smtp()['port']),
            'secure' => (string) ($smtp['secure'] ?? mail_recommended_smtp()['secure']),
            'user' => (string) ($smtp['user'] ?? ($mail['from'] ?? 'orders@marvispace.com')),
            'pass' => (string) ($smtp['pass'] ?? ''),
        ],
    ];
}

function mail_format_address(string $email, string $name = ''): string
{
    if ($name === '') {
        return $email;
    }

    return sprintf('%s <%s>', mb_encode_mimeheader($name, 'UTF-8'), $email);
}

function mail_build_headers(string $from, string $fromName, string $replyTo, string $messageId): array
{
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . mail_format_address($from, $fromName),
        'Date: ' . gmdate('D, d M Y H:i:s') . ' +0000',
        'Message-ID: ' . $messageId,
        'X-Mailer: MARVISPACE',
    ];

    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    return $headers;
}

function mail_send_html(string $to, string $subject, string $html, array $opts = []): bool
{
    $to = trim($to);
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $cfg = mail_config();
    $from = (string) ($opts['from'] ?? $cfg['from']);
    $fromName = (string) ($opts['from_name'] ?? $cfg['from_name']);
    $replyTo = (string) ($opts['reply_to'] ?? $cfg['support']);
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $messageId = '<' . bin2hex(random_bytes(16)) . '@marvispace.com>';
    $headers = mail_build_headers($from, $fromName, $replyTo, $messageId);

    if (!empty($cfg['smtp']['pass'])) {
        mail_set_last_error('');
        return mail_send_smtp($to, $encodedSubject, $html, $headers, $from, $cfg['smtp']);
    }

    mail_set_last_error('');
    $params = '-f' . escapeshellarg($from);
    $ok = @mail($to, $encodedSubject, $html, implode("\r\n", $headers), $params);
    if (!$ok) {
        mail_set_last_error('PHP mail() returned false');
    }
    return $ok;
}

/**
 * Test SMTP connection/auth (for install/test-mail.php --probe).
 */
function mail_probe_smtp(?array $smtp = null): array
{
    $cfg = mail_config();
    $smtp = $smtp ?? $cfg['smtp'];
    $host = (string) ($smtp['host'] ?? 'mail.marvispace.com');
    $port = (int) ($smtp['port'] ?? 465);
    $secure = strtolower((string) ($smtp['secure'] ?? 'ssl'));
    $user = (string) ($smtp['user'] ?? $cfg['from']);
    $pass = (string) ($smtp['pass'] ?? '');
    $from = (string) $cfg['from'];

    $result = [
        'ok' => false,
        'host' => $host,
        'port' => $port,
        'secure' => $secure,
        'user' => $user,
        'steps' => [],
    ];

    if ($pass === '') {
        $result['error'] = 'SMTP password is empty';
        return $result;
    }

    try {
        $fp = mail_smtp_connect($host, $port, $secure);
        $result['steps'][] = 'connected';

        mail_smtp_expect($fp, [220]);
        $result['steps'][] = 'greeting';

        mail_smtp_cmd($fp, 'EHLO marvispace.com', [250]);
        $result['steps'][] = 'ehlo';

        if ($secure === 'tls') {
            mail_smtp_cmd($fp, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS failed');
            }
            mail_smtp_cmd($fp, 'EHLO marvispace.com', [250]);
            $result['steps'][] = 'starttls';
        }

        mail_smtp_authenticate($fp, $user, $pass);
        $result['steps'][] = 'auth';

        mail_smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', [250]);
        $result['steps'][] = 'mail_from';

        mail_smtp_cmd($fp, 'QUIT', [221]);
        fclose($fp);

        $result['ok'] = true;
        return $result;
    } catch (Throwable $e) {
        $result['error'] = $e->getMessage();
        if (isset($fp) && is_resource($fp)) {
            fclose($fp);
        }
        return $result;
    }
}

function mail_send_smtp(
    string $to,
    string $encodedSubject,
    string $html,
    array $headers,
    string $from,
    array $smtp
): bool {
    $host = $smtp['host'] ?? 'mail.marvispace.com';
    $port = (int) ($smtp['port'] ?? 465);
    $secure = strtolower((string) ($smtp['secure'] ?? 'ssl'));
    $user = (string) ($smtp['user'] ?? $from);
    $pass = (string) ($smtp['pass'] ?? '');

    if ($pass === '') {
        mail_set_last_error('SMTP password is empty');
        return false;
    }

    try {
        $fp = mail_smtp_connect($host, $port, $secure);
        mail_smtp_expect($fp, [220]);
        mail_smtp_cmd($fp, 'EHLO marvispace.com', [250]);

        if ($secure === 'tls') {
            mail_smtp_cmd($fp, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS failed');
            }
            mail_smtp_cmd($fp, 'EHLO marvispace.com', [250]);
        }

        mail_smtp_authenticate($fp, $user, $pass);

        mail_smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', [250]);
        mail_smtp_cmd($fp, 'RCPT TO:<' . $to . '>', [250, 251]);
        mail_smtp_cmd($fp, 'DATA', [354]);

        $body = implode("\r\n", $headers)
            . "\r\nSubject: {$encodedSubject}\r\n"
            . "\r\n"
            . mail_smtp_dot_stuff($html)
            . "\r\n.";

        fwrite($fp, $body . "\r\n");
        mail_smtp_expect($fp, [250]);
        mail_smtp_cmd($fp, 'QUIT', [221]);
        fclose($fp);
        mail_set_last_error('');
        return true;
    } catch (Throwable $e) {
        mail_set_last_error($e->getMessage());
        if (isset($fp) && is_resource($fp)) {
            fclose($fp);
        }
        return false;
    }
}

function mail_smtp_connect(string $host, int $port, string $secure)
{
    $remote = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ]);

    $fp = @stream_socket_client(
        $remote,
        $errno,
        $errstr,
        25,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$fp) {
        throw new RuntimeException("SMTP connect failed to {$remote}: {$errstr} ({$errno})");
    }

    stream_set_timeout($fp, 25);
    return $fp;
}

function mail_smtp_authenticate($fp, string $user, string $pass): void
{
    try {
        mail_smtp_cmd($fp, 'AUTH LOGIN', [334]);
        mail_smtp_cmd($fp, base64_encode($user), [334]);
        mail_smtp_cmd($fp, base64_encode($pass), [235]);
        return;
    } catch (Throwable $loginError) {
        /* fall through to PLAIN */
    }

    $plain = base64_encode("\0{$user}\0{$pass}");
    mail_smtp_cmd($fp, 'AUTH PLAIN ' . $plain, [235]);
}

function mail_smtp_dot_stuff(string $body): string
{
    $lines = preg_split("/\r\n|\n|\r/", $body) ?: [];
    $out = [];
    foreach ($lines as $line) {
        if ($line !== '' && $line[0] === '.') {
            $line = '.' . $line;
        }
        $out[] = $line;
    }
    return implode("\r\n", $out);
}

function mail_smtp_cmd($fp, string $cmd, array $okCodes): void
{
    fwrite($fp, $cmd . "\r\n");
    mail_smtp_expect($fp, $okCodes);
}

function mail_smtp_expect($fp, array $okCodes): string
{
    $line = '';
    while (($chunk = fgets($fp, 515)) !== false) {
        $line .= $chunk;
        if (isset($chunk[3]) && $chunk[3] === ' ') {
            break;
        }
    }

    $code = (int) substr(trim($line), 0, 3);
    if (!in_array($code, $okCodes, true)) {
        throw new RuntimeException('SMTP unexpected response: ' . trim($line));
    }

    return $line;
}

function mail_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function mail_money(float $value): string
{
    return '$' . number_format($value, 2);
}
