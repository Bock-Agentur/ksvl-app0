-- Initialize Monday.com settings if not exists
INSERT INTO monday_settings (board_id, auto_sync_enabled, api_key_set)
VALUES (NULL, false, true)
ON CONFLICT (id) DO NOTHING;