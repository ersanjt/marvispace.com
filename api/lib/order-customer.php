<?php
declare(strict_types=1);

function order_customer_from_input(array $customer): array
{
    return [
        'email' => strtolower(trim((string) ($customer['email'] ?? ''))),
        'firstName' => trim((string) ($customer['firstName'] ?? '')),
        'lastName' => trim((string) ($customer['lastName'] ?? '')),
        'phone' => trim((string) ($customer['phone'] ?? '')),
        'address' => trim((string) ($customer['address'] ?? '')),
        'address2' => trim((string) ($customer['address2'] ?? '')),
        'city' => trim((string) ($customer['city'] ?? '')),
        'state' => trim((string) ($customer['state'] ?? '')),
        'zip' => trim((string) ($customer['zip'] ?? '')),
        'country' => trim((string) ($customer['country'] ?? '')),
        'payment' => trim((string) ($customer['payment'] ?? '')),
        'taxId' => trim((string) ($customer['taxId'] ?? '')),
        'subscribe' => !empty($customer['subscribe']),
        'billingSame' => !empty($customer['billingSame']),
    ];
}

function order_validate_customer(array $customer): void
{
    $c = order_customer_from_input($customer);

    if ($c['email'] === '' || !filter_var($c['email'], FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Valid customer email is required');
    }
    if ($c['firstName'] === '' || $c['lastName'] === '') {
        throw new InvalidArgumentException('Customer first and last name are required');
    }
    if ($c['address'] === '' || $c['city'] === '' || $c['zip'] === '' || $c['country'] === '') {
        throw new InvalidArgumentException('Complete shipping address is required');
    }
    if ($c['phone'] === '') {
        throw new InvalidArgumentException('Customer phone number is required');
    }
    if ($c['payment'] === '') {
        throw new InvalidArgumentException('Payment method is required');
    }
}

function order_customer_to_legacy_json(array $customer): string
{
    return json_encode(order_customer_from_input($customer), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function order_row_customer(array $row): array
{
    $customer = json_decode($row['customer'] ?? '{}', true);
    if (!is_array($customer)) {
        $customer = [];
    }

    if (!empty($row['customer_email'])) {
        $customer = array_merge([
            'email' => $row['customer_email'],
            'firstName' => $row['customer_first_name'] ?? '',
            'lastName' => $row['customer_last_name'] ?? '',
            'phone' => $row['customer_phone'] ?? '',
            'address' => $row['shipping_address1'] ?? '',
            'address2' => $row['shipping_address2'] ?? '',
            'city' => $row['shipping_city'] ?? '',
            'state' => $row['shipping_state'] ?? '',
            'zip' => $row['shipping_zip'] ?? '',
            'country' => $row['shipping_country'] ?? '',
            'payment' => $row['payment_method'] ?? '',
            'taxId' => $row['tax_id'] ?? '',
            'subscribe' => !empty($row['customer_subscribed']),
        ], $customer);
    }

    return $customer;
}

function order_has_professional_columns(PDO $pdo): bool
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM orders LIKE 'customer_email'");
    $cache = (bool) $stmt->fetch();
    return $cache;
}
