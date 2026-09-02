INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('store_currency', 'USD')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
