<?php
declare(strict_types=1);

require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/settings-repo.php';

function notification_mail_wrap(string $title, string $bodyHtml): string
{
    $year = gmdate('Y');
    return '<!doctype html><html><head><meta charset="utf-8"></head>'
        . '<body style="margin:0;background:#f6f6f5;font-family:Arial,Helvetica,sans-serif;color:#111;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f5;padding:24px 12px;">'
        . '<tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #ddd;">'
        . '<tr><td style="padding:24px 28px;border-bottom:1px solid #111;">'
        . '<strong style="letter-spacing:0.16em;font-size:12px;">MARVISPACE</strong></td></tr>'
        . '<tr><td style="padding:28px;">'
        . '<h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">' . mail_escape($title) . '</h1>'
        . $bodyHtml
        . '</td></tr>'
        . '<tr><td style="padding:16px 28px;border-top:1px solid #ececec;font-size:12px;color:#666;">'
        . '© ' . $year . ' MARVISPACE · Admin notification</td></tr>'
        . '</table></td></tr></table></body></html>';
}

function notification_mail_newsletter_signup(PDO $pdo, string $email, string $source = 'footer'): bool
{
    $notify = mail_notify_settings($pdo);
    if (empty($notify['notifyNewsletter'])) {
        return false;
    }

    $adminEmail = $notify['adminEmail'] ?? '';
    if ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $safeEmail = mail_escape($email);
    $safeSource = mail_escape($source);
    $body = '<p style="margin:0 0 18px;line-height:1.6;">Someone joined your mailing list.</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Email</p>'
        . '<p style="margin:0 0 20px;font-family:monospace;font-size:15px;">' . $safeEmail . '</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Source</p>'
        . '<p style="margin:0;line-height:1.6;">' . $safeSource . '</p>';

    $html = notification_mail_wrap('New newsletter subscriber', $body);
    return mail_send_html($adminEmail, 'New MARVISPACE subscriber — ' . $email, $html, [
        'reply_to' => $email,
    ]);
}

function notification_mail_test(PDO $pdo): bool
{
    $notify = mail_notify_settings($pdo);
    $adminEmail = $notify['adminEmail'] ?? '';
    if ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        mail_set_last_error('Set a valid admin notification email first.');
        return false;
    }

    $body = '<p style="margin:0 0 18px;line-height:1.6;">This is a test alert from your MARVISPACE admin panel.</p>'
        . '<p style="margin:0;line-height:1.6;color:#666;">If you received this, order and newsletter notifications will reach this inbox.</p>';

    $html = notification_mail_wrap('Test notification', $body);
    return mail_send_html($adminEmail, 'MARVISPACE — test admin notification', $html);
}
