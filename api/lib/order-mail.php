<?php
declare(strict_types=1);

require_once __DIR__ . '/mail.php';

function order_mail_customer_name(array $customer): string
{
    $name = trim(($customer['firstName'] ?? '') . ' ' . ($customer['lastName'] ?? ''));
    return $name !== '' ? $name : 'Customer';
}

function order_mail_format_address(array $customer): string
{
    $lines = [];
    $street = trim(($customer['address'] ?? '') . (!empty($customer['address2']) ? ', ' . $customer['address2'] : ''));
    if ($street !== '') {
        $lines[] = $street;
    }

    $cityLine = trim(implode(', ', array_filter([
        $customer['city'] ?? '',
        $customer['state'] ?? '',
        $customer['zip'] ?? '',
    ])));
    if ($cityLine !== '') {
        $lines[] = $cityLine;
    }

    if (!empty($customer['country'])) {
        $lines[] = (string) $customer['country'];
    }

    return implode("\n", $lines);
}

function order_mail_items_html(array $items): string
{
    $rows = '';
    foreach ($items as $item) {
        $label = mail_escape((string) ($item['label'] ?? 'Item'));
        $size = mail_escape((string) ($item['size'] ?? ''));
        $qty = (int) ($item['qty'] ?? 1);
        $price = mail_money((float) ($item['price'] ?? 0) * $qty);
        $rows .= '<tr>'
            . '<td style="padding:10px 0;border-bottom:1px solid #ececec;">' . $label . '</td>'
            . '<td style="padding:10px 0;border-bottom:1px solid #ececec;">' . $size . '</td>'
            . '<td style="padding:10px 0;border-bottom:1px solid #ececec;text-align:center;">' . $qty . '</td>'
            . '<td style="padding:10px 0;border-bottom:1px solid #ececec;text-align:right;">' . $price . '</td>'
            . '</tr>';
    }

    return $rows;
}

function order_mail_wrap(string $title, string $bodyHtml): string
{
  $year = gmdate('Y');
  return '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#f6f6f5;font-family:Arial,Helvetica,sans-serif;color:#111;">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f5;padding:24px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #ddd;">'
    . '<tr><td style="padding:24px 28px;border-bottom:1px solid #111;"><strong style="letter-spacing:0.16em;font-size:12px;">MARVISPACE</strong></td></tr>'
    . '<tr><td style="padding:28px;">'
    . '<h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">' . mail_escape($title) . '</h1>'
    . $bodyHtml
    . '</td></tr>'
    . '<tr><td style="padding:16px 28px;border-top:1px solid #ececec;font-size:12px;color:#666;">'
    . '© ' . $year . ' MARVISPACE · <a href="https://marvispace.com" style="color:#666;">marvispace.com</a>'
    . '</td></tr>'
    . '</table></td></tr></table></body></html>';
}

function order_mail_customer_confirmation(array $order): bool
{
    $customer = $order['customer'] ?? [];
    $email = trim((string) ($customer['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $cfg = mail_config();
    $orderId = mail_escape((string) ($order['id'] ?? ''));
    $name = mail_escape(order_mail_customer_name($customer));
    $total = mail_money((float) ($order['total'] ?? 0));
    $statusUrl = mail_escape($cfg['site_url'] . '/order-status?id=' . rawurlencode((string) ($order['id'] ?? '')));
    $address = nl2br(mail_escape(order_mail_format_address($customer)));

    $body = '<p style="margin:0 0 18px;line-height:1.6;">Hi ' . $name . ',</p>'
        . '<p style="margin:0 0 18px;line-height:1.6;">Thank you for your order. We received it and will process it shortly.</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Order ID</p>'
        . '<p style="margin:0 0 20px;font-family:monospace;font-size:15px;">' . $orderId . '</p>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:14px;">'
        . '<tr><th align="left" style="padding:10px 0;border-bottom:1px solid #111;">Item</th>'
        . '<th align="left" style="padding:10px 0;border-bottom:1px solid #111;">Size</th>'
        . '<th align="center" style="padding:10px 0;border-bottom:1px solid #111;">Qty</th>'
        . '<th align="right" style="padding:10px 0;border-bottom:1px solid #111;">Total</th></tr>'
        . order_mail_items_html($order['items'] ?? [])
        . '</table>'
        . '<p style="margin:0 0 20px;text-align:right;font-size:16px;"><strong>Order total: ' . $total . '</strong></p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Shipping address</p>'
        . '<p style="margin:0 0 20px;line-height:1.6;">' . $address . '</p>'
        . '<p style="margin:0 0 20px;line-height:1.6;">Track your order anytime:</p>'
        . '<p style="margin:0 0 20px;"><a href="' . $statusUrl . '" style="color:#111;">' . $statusUrl . '</a></p>'
        . '<p style="margin:0;line-height:1.6;color:#666;font-size:13px;">Questions? Reply to this email or contact ' . mail_escape($cfg['support']) . '.</p>';

    $html = order_mail_wrap('Order confirmation', $body);
    $subject = 'Your MARVISPACE order ' . (string) ($order['id'] ?? '');

    return mail_send_html($email, $subject, $html);
}

function order_mail_admin_notification(array $order): bool
{
    $cfg = mail_config();
    $adminEmail = trim($cfg['admin_notify']);
    if ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $customer = $order['customer'] ?? [];
    $orderId = mail_escape((string) ($order['id'] ?? ''));
    $name = mail_escape(order_mail_customer_name($customer));
    $email = mail_escape((string) ($customer['email'] ?? ''));
    $phone = mail_escape((string) ($customer['phone'] ?? ''));
    $total = mail_money((float) ($order['total'] ?? 0));
    $address = nl2br(mail_escape(order_mail_format_address($customer)));
    $payment = mail_escape((string) ($customer['payment'] ?? '—'));
    $taxId = mail_escape((string) ($customer['taxId'] ?? '—'));

    $body = '<p style="margin:0 0 18px;line-height:1.6;">A new order was placed on MARVISPACE.</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Order ID</p>'
        . '<p style="margin:0 0 20px;font-family:monospace;font-size:15px;">' . $orderId . '</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Customer</p>'
        . '<p style="margin:0 0 20px;line-height:1.6;">' . $name . '<br>' . $email . '<br>' . $phone . '</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Shipping</p>'
        . '<p style="margin:0 0 20px;line-height:1.6;">' . $address . '</p>'
        . '<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666;">Payment / Tax ID</p>'
        . '<p style="margin:0 0 20px;line-height:1.6;">' . $payment . ' · Tax ID: ' . $taxId . '</p>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:14px;">'
        . '<tr><th align="left" style="padding:10px 0;border-bottom:1px solid #111;">Item</th>'
        . '<th align="left" style="padding:10px 0;border-bottom:1px solid #111;">Size</th>'
        . '<th align="center" style="padding:10px 0;border-bottom:1px solid #111;">Qty</th>'
        . '<th align="right" style="padding:10px 0;border-bottom:1px solid #111;">Total</th></tr>'
        . order_mail_items_html($order['items'] ?? [])
        . '</table>'
        . '<p style="margin:0;text-align:right;font-size:16px;"><strong>Total: ' . $total . '</strong></p>';

    $html = order_mail_wrap('New order received', $body);
    $subject = 'New MARVISPACE order ' . (string) ($order['id'] ?? '');

    return mail_send_html($adminEmail, $subject, $html, [
        'reply_to' => (string) ($customer['email'] ?? $cfg['support']),
    ]);
}

function order_send_purchase_emails(PDO $pdo, array $order): array
{
    $result = [
        'customer' => order_mail_customer_confirmation($order),
        'admin' => order_mail_admin_notification($order),
    ];

    $orderId = (string) ($order['id'] ?? 'unknown');

    if ($result['customer']) {
        order_mark_email_sent($pdo, $orderId, true, false);
    } else {
        $detail = mail_last_error();
        error_log('MARVISPACE: customer order email failed for ' . $orderId
            . ($detail !== '' ? ' — ' . $detail : ''));
    }

    if ($result['admin']) {
        order_mark_email_sent($pdo, $orderId, false, true);
    } else {
        $detail = mail_last_error();
        error_log('MARVISPACE: admin order email failed for ' . $orderId
            . ($detail !== '' ? ' — ' . $detail : ''));
    }

    return $result;
}
