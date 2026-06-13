-- Migration: Add legacy productivity streak columns
-- Some deployments created productivity_streaks with streak_date only.
-- The API model expects last_activity_date and total_points as well.

ALTER TABLE productivity_streaks
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

UPDATE productivity_streaks
SET last_activity_date = streak_date
WHERE last_activity_date IS NULL
  AND streak_date IS NOT NULL;

COMMENT ON COLUMN productivity_streaks.last_activity_date IS 'Last day the user logged productivity activity';
COMMENT ON COLUMN productivity_streaks.total_points IS 'Cumulative productivity points for the streak record';
