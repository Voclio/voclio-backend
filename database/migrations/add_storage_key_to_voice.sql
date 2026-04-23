-- Migration: Add cloud storage_key to voice_recordings
-- Run: psql $DATABASE_URL < database/migrations/add_storage_key_to_voice.sql

ALTER TABLE voice_recordings
  ADD COLUMN IF NOT EXISTS storage_key VARCHAR(500),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'uploaded';

CREATE INDEX IF NOT EXISTS idx_voice_recordings_storage_key
  ON voice_recordings(storage_key);

COMMENT ON COLUMN voice_recordings.file_path   IS 'Cloud storage public URL (or legacy local path)';
COMMENT ON COLUMN voice_recordings.storage_key IS 'S3/R2 object key used for cloud operations';
COMMENT ON COLUMN voice_recordings.status      IS 'uploaded | processing | transcribed | completed | failed';
