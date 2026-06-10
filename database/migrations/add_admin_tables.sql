-- Admin dashboard tables (api_keys, activity_logs, app_config)

CREATE TABLE IF NOT EXISTS api_keys (
    key_id SERIAL PRIMARY KEY,
    api_type VARCHAR(50) NOT NULL,
    provider VARCHAR(100),
    name VARCHAR(255),
    access_token TEXT NOT NULL,
    rate_limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    admin_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_category VARCHAR(100),
    severity VARCHAR(50) DEFAULT 'info',
    ip_address VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_config (
    config_id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

INSERT INTO app_config (config_key, config_value, description) VALUES
    ('app_name', 'Voclio', 'Application name'),
    ('focus_mode_enabled', 'true', 'Enable/disable focus mode feature'),
    ('max_upload_size', '10485760', 'Maximum file upload size in bytes'),
    ('default_language', 'en', 'Default application language'),
    ('rate_limit_enabled', 'true', 'Enable API rate limiting for all endpoints'),
    ('max_requests_per_minute', '100', 'Maximum API requests allowed per minute per user'),
    ('maintenance_mode', 'false', 'Enable maintenance mode to block all API requests'),
    ('support_email', 'support@voclio.com', 'Support email address shown to users'),
    ('session_timeout_minutes', '30', 'User session timeout in minutes'),
    ('allow_signups', 'true', 'Allow new user registrations')
ON CONFLICT (config_key) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
