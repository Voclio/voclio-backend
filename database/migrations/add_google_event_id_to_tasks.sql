-- Migration to add google_event_id to tasks table
ALTER TABLE tasks ADD COLUMN google_event_id VARCHAR(255) NULL;
