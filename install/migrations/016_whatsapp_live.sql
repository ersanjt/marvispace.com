INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('whatsapp_enabled', '1'),
  ('whatsapp_phone', '905010676486'),
  ('whatsapp_message', 'Merhaba, MARVISPACE destek.')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
