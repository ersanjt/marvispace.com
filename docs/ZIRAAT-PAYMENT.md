# Ziraat Bank Sanal POS — MARVISPACE setup

## 1. Bank panel (one-time)

1. Open https://sanalpos2.ziraatbank.com.tr  
2. Log in with **marvisadmin** and your password (call **0212 319 06 19** with security code **OTLN** for a temporary password if needed).
3. **Yönetim → Güvenlik Anahtarı Değiştirme** — create your **store key** (güvenlik anahtarı).
4. **Yönetim → Yeni Kullanıcı Ekle** — optional API user for reports/refunds.
5. Tell the bank your **server IP** (cPanel → Server Information) so payments are allowed.

## 2. Server config (secrets only in git-ignored file)

Edit `/home/marvispace/api_config.php`:

```php
'ziraat' => [
    'merchant_password' => 'YOUR_STORE_KEY_FROM_PANEL',
    'merchant_id' => '192868559',
],
```

Never commit the store key to git.

## 3. Database migration

```bash
php install/migrate.php
```

## 4. Admin panel

1. https://marvispace.com/admin#settings-payments  
2. Enable **Ziraat Bank Sanal POS**  
3. Merchant number: `192868559`  
4. Currency: **TRY**  
5. Save  

Status should show: `Store key configured · Checkout ready`.

## 5. Test checkout

1. Add a product to cart → Checkout  
2. Fill shipping form → pay with a real card (small amount)  
3. Complete 3D Secure OTP on your phone  
4. Confirm order in admin and in Ziraat panel under **İşlemler**

## API endpoints

| Step | URL |
|------|-----|
| Initialize | `POST /api/v1/payments/ziraat/initialize` |
| Bank return | `POST /api/v1/payments/ziraat/callback` |

Live gateway: `https://sanalpos.ziraatbank.com.tr/v4/v3/VposThreeDPay.aspx`

## Troubleshooting

| Error | Fix |
|-------|-----|
| HashData geçersiz | Wrong store key in `api_config.php` |
| IP not allowed | Send server IP to Ziraat |
| Card payments unavailable | Enable Ziraat in admin + store key on server |
| İşyeri kullanım tipi | Ask bank to set account to **3D Pay** |
