INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('ziraat_panel_url', 'https://sanalpos2.ziraatbank.com.tr'),
  ('ziraat_panel_user', 'marvisadmin'),
  ('ziraat_security_code', 'OTLN'),
  ('ziraat_support_phone', '0212 319 06 19'),
  ('ziraat_store_key', ''),
  ('ziraat_enabled', '1'),
  ('ziraat_merchant_id', '192868559'),
  ('store_currency', 'TRY')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
