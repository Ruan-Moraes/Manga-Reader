-- The reader now uses automatic image loading for every account.
ALTER TABLE user_system_settings DROP COLUMN reader_quality;
