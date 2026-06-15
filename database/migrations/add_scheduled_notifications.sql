CREATE TABLE IF NOT EXISTS scheduled_notifications (
  scheduled_notification_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  template_key VARCHAR(100),
  title VARCHAR(255),
  message TEXT,
  notification_type VARCHAR(50) DEFAULT 'system',
  priority VARCHAR(20) DEFAULT 'normal',
  audience VARCHAR(50) DEFAULT 'all_active',
  target_user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  recurrence VARCHAR(20) DEFAULT 'once',
  scheduled_at TIMESTAMPTZ NOT NULL,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  send_push BOOLEAN DEFAULT true,
  run_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_next_run
  ON scheduled_notifications (next_run_at)
  WHERE is_active = true;
