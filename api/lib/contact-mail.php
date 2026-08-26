<?php
/**
 * Contact form emails — support inbox + customer auto-reply.
 * @project MARVISPACE
 */
declare(strict_types=1);

require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/notification-mail.php';

function contact_mail_rate_limited(string $ip): bool
{
    $safeIp = preg_replace('/[^a-zA-Z0-9._:-]/', '_', $ip) ?: 'unknown';
    $dir = sys_get_temp_dir() . '/marvispace_contact_rl';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    $file = $dir . '/' . $safeIp . '.json';
    $now = time();
    $window = 600; // 10 minutes
    $max = 5;

    $hits = [];
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded)) {
            $hits = array_values(array_filter(
                $decoded,
                static fn ($t) => is_int($t) && ($now - $t) < $window
            ));
        }
    }

    if (count($hits) >= $max) {
        return true;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return false;
}

function contact_mail_send(string $name, string $email, string $message): bool
{
    $cfg = mail_config();
    $to = trim((string) ($cfg['support'] ?? 'support@marvispace.com'));
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        mail_set_last_error('Support email is not configured.');
        return false;
    }

    $safeName = mail_escape($name);
    $safeEmail = mail_escape($email);
    $safeMessage = nl2br(mail_escape($message), false);

    $body = '<p style="margin:0 0 18px;line-height:1.6;">New message from the MARVISPACE contact form.</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Name</p>'
        . '<p style="margin:0 0 16px;line-height:1.5;">' . $safeName . '</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Email</p>'
        . '<p style="margin:0 0 16px;font-family:monospace;font-size:14px;">'
        . '<a href="mailto:' . $safeEmail . '">' . $safeEmail . '</a></p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Message</p>'
        . '<p style="margin:0;line-height:1.7;">' . $safeMessage . '</p>'
        . '<p style="margin:22px 0 0;font-size:12px;color:#666;">Reply directly to this email to answer the customer.</p>';

    $html = notification_mail_wrap('Contact form message', $body);
    $subject = 'MARVISPACE contact — ' . $name;

    $ok = mail_send_html($to, $subject, $html, [
        'from_name' => 'MARVISPACE Contact',
        'reply_to' => $email,
    ]);

    if (!$ok) {
        return false;
    }

    contact_mail_auto_reply($name, $email);
    return true;
}

function contact_mail_auto_reply(string $name, string $email): void
{
    $cfg = mail_config();
    $support = (string) ($cfg['support'] ?? 'support@marvispace.com');
    $first = trim(explode(' ', $name)[0] ?: $name);
    $safeFirst = mail_escape($first !== '' ? $first : 'there');

    $body = '<p style="margin:0 0 16px;line-height:1.6;">Hi ' . $safeFirst . ',</p>'
        . '<p style="margin:0 0 16px;line-height:1.6;">Thanks for contacting MARVISPACE. We received your message and typically reply within 1–2 business days.</p>'
        . '<p style="margin:0 0 16px;line-height:1.6;">For order updates you can also use '
        . '<a href="' . mail_escape($cfg['site_url']) . '/order-status">Order Status</a>.</p>'
        . '<p style="margin:0;line-height:1.6;color:#666;">— MARVISPACE Support<br>'
        . '<a href="mailto:' . mail_escape($support) . '">' . mail_escape($support) . '</a></p>';

    $html = notification_mail_wrap('We received your message', $body);
    mail_send_html($email, 'MARVISPACE — we received your message', $html, [
        'from_name' => 'MARVISPACE Support',
        'reply_to' => $support,
    ]);
}
