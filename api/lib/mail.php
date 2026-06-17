<?php
declare(strict_types=1);

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
            'host' => (string) ($smtp['host'] ?? 'mail.marvispace.com'),
            'port' => (int) ($smtp['port'] ?? 465),
            'secure' => (string) ($smtp['secure'] ?? 'ssl'),
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
        return mail_send_smtp($to, $encodedSubject, $html, $headers, $from, $cfg['smtp']);
    }

    $params = '-f' . escapeshellarg($from);
    return @mail($to, $encodedSubject, $html, implode("\r\n", $headers), $params);
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
        return false;
    }

    $remote = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 20);
    if (!$fp) {
        error_log("MARVISPACE SMTP connect failed: {$errstr} ({$errno})");
        return false;
    }

    stream_set_timeout($fp, 20);

    try {
        mail_smtp_expect($fp, [220]);
        mail_smtp_cmd($fp, 'EHLO marvispace.com', [250]);

        if ($secure === 'tls') {
            mail_smtp_cmd($fp, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS failed');
            }
            mail_smtp_cmd($fp, 'EHLO marvispace.com', [250]);
        }

        mail_smtp_cmd($fp, 'AUTH LOGIN', [334]);
        mail_smtp_cmd($fp, base64_encode($user), [334]);
        mail_smtp_cmd($fp, base64_encode($pass), [235]);

        mail_smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', [250]);
        mail_smtp_cmd($fp, 'RCPT TO:<' . $to . '>', [250, 251]);
        mail_smtp_cmd($fp, 'DATA', [354]);

        $body = implode("\r\n", $headers)
            . "\r\nSubject: {$encodedSubject}\r\n"
            . "\r\n"
            . $html
            . "\r\n.";

        fwrite($fp, $body . "\r\n");
        mail_smtp_expect($fp, [250]);
        mail_smtp_cmd($fp, 'QUIT', [221]);
        fclose($fp);
        return true;
    } catch (Throwable $e) {
        error_log('MARVISPACE SMTP error: ' . $e->getMessage());
        fclose($fp);
        return false;
    }
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
