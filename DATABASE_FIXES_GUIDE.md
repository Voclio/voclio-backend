# Database Fixes Guide

## Overview
This guide documents all database schema fixes and migrations applied to the Voclio API system.

## Table of Contents
1. [ENUM Type Fixes](#enum-type-fixes)
2. [Timestamp Configuration](#timestamp-configuration)
3. [Notification System](#notification-system)
4. [Categories Table](#categories-table)
5. [Achievement Model](#achievement-model)
6. [Quick Fix Commands](#quick-fix-commands)

---

## ENUM Type Fixes

### Problem
Sequelize ORM showed ENUM casting errors during database sync because columns were VARCHAR type and PostgreSQL cannot cast VARCHAR with defaults to ENUM directly.

### Affected Tables
- `user_settings.theme`
- `focus_sessions.status`
- `otp_codes.type`
- `notifications.type`
- `notifications.priority`

### Solution
Run the comprehensive ENUM fix script:
```bash
npm run fix:enums
# or
node fix-all-enums.js
```

### Individual Fixes
```bash
node fix-user-settings-enum.js
node fix-focus-sessions-enum.js
```

### SQL Migration
```bash
psql -U postgres -d voclio_db -f database/migrations/fix_all_enum_types.sql
```

### Verification
```sql
-- Check ENUM types
SELECT typname FROM pg_type WHERE typname LIKE 'enum_%';

-- Check columns
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns 
WHERE data_type = 'USER-DEFINED';
```

---

## Timestamp Configuration

### Problem
ORM models had missing or misconfigured `created_at` and `updated_at` columns, causing errors like "column created_at does not exist".

### Affected Models
- User
- Task
- Note
- Category
- VoiceRecording
- Reminder
- Tag
- FocusSession
- Achievement
- ProductivityStreak
- Session
- Notification

### Solution
All ORM models now include:
```javascript
{
  tableName: 'table_name',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
}
```

### Fix Missing Columns
```bash
npm run fix:timestamps
# or
node fix-all-timestamps.js
```

---

## Notification System

### Problem
Missing columns in notifications table:
- `priority`
- `related_id`
- `read_at`

### Solution
```bash
npm run migrate:notifications
# or
node database/migrations/run_notification_fix.js
```

### Migration File
`database/migrations/add_notification_priority.sql`

### Features Added
- 15+ notification types
- Priority levels (low, normal, high, urgent)
- Automatic notifications for all major actions
- Integration with Task, Voice, Auth, Productivity, and Reminder controllers
- Cron jobs for overdue tasks and reminders

### Documentation
See `NOTIFICATION_SYSTEM.md` for complete documentation.

---

## Categories Table

### Problem
- Missing `updated_at` column
- Foreign key constraint violations
- No default categories for users

### Solution
```bash
node database/migrations/run_categories_fix.js
```

### Migration File
`database/migrations/fix_categories_table.sql`

### Default Categories
Each user gets:
- عمل (Work)
- شخصي (Personal)
- دراسة (Study)

### Verification
```bash
node check-categories.js
```

---

## Achievement Model

### Problem
- `icon` field in ORM model didn't exist in database
- Missing `achievement_type` field

### Solution
Updated `src/models/orm/Achievement.js`:
- Removed `icon` field
- Added `achievement_type` field

### Test Achievements
```bash
node add-test-achievement.js
node add-achievements-all-users.js
```

---

## Quick Fix Commands

### Fix Everything
```bash
# 1. Fix ENUM types
npm run fix:enums

# 2. Fix timestamps
npm run fix:timestamps

# 3. Fix notifications
npm run migrate:notifications

# 4. Fix categories
node database/migrations/run_categories_fix.js

# 5. Restart server
npm start
```

### Individual Fixes
```bash
# ENUM fixes
npm run fix:enums

# Timestamp fixes
npm run fix:timestamps

# Notification schema
npm run migrate:notifications

# Categories
node database/migrations/run_categories_fix.js

# Schema fixes
npm run migrate:fix
```

### Verification Commands
```bash
# Test database connection
npm run test-db

# Check categories
node check-categories.js

# Check user achievements
node check-user-achievements.js

# Test notifications
npm run test:notifications
```

---

## Migration Files

### Location
All migration files are in `database/migrations/`:

1. `add_notification_priority.sql` - Notification system
2. `fix_all_enum_types.sql` - ENUM type fixes
3. `fix_categories_table.sql` - Categories table
4. `fix_schema_issues.sql` - General schema fixes
5. `add_oauth_support.sql` - OAuth support
6. `add_subtasks.sql` - Subtasks feature

### Runner Scripts
- `run_notification_fix.js`
- `run_categories_fix.js`
- `run_fix_schema.js`

---

## Common Issues

### Issue 1: ENUM Casting Error
```
ERROR: cannot cast type character varying to enum_*
```
**Solution**: Run `npm run fix:enums`

### Issue 2: Column Does Not Exist
```
ERROR: column "created_at" does not exist
```
**Solution**: Run `npm run fix:timestamps`

### Issue 3: Foreign Key Violation
```
ERROR: insert or update on table violates foreign key constraint
```
**Solution**: 
1. Check if referenced record exists
2. For categories: Run `node database/migrations/run_categories_fix.js`

### Issue 4: Port Already in Use
```
ERROR: listen EADDRINUSE: address already in use :::3001
```
**Solution**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

---

## Database Schema Status

### ✅ Fixed Tables
- [x] users
- [x] tasks
- [x] notes
- [x] categories
- [x] voice_recordings
- [x] reminders
- [x] tags
- [x] focus_sessions
- [x] achievements
- [x] productivity_streaks
- [x] sessions
- [x] notifications
- [x] user_settings
- [x] otp_codes

### ✅ All ENUM Types
- [x] enum_user_settings_theme
- [x] enum_focus_sessions_status
- [x] enum_otp_codes_type
- [x] enum_notifications_type
- [x] enum_notifications_priority

### ✅ All Timestamps
- [x] All tables have created_at
- [x] All tables have updated_at (except OTP which only has created_at)

---

## Best Practices

1. **Always backup before migrations**
   ```bash
   pg_dump -U postgres voclio_db > backup_$(date +%Y%m%d).sql
   ```

2. **Test migrations on development first**
   ```bash
   # Use .env for development database
   DB_NAME=voclio_db_dev
   ```

3. **Run fixes in order**
   - ENUM fixes first
   - Timestamp fixes second
   - Feature-specific fixes last

4. **Verify after each fix**
   - Check server logs
   - Test API endpoints
   - Run verification scripts

5. **Keep migrations idempotent**
   - All migration scripts check if changes already exist
   - Safe to run multiple times

---

## Support

For issues or questions:
1. Check server logs: `docker-compose logs -f` or console output
2. Check database: `psql -U postgres -d voclio_db`
3. Review migration files in `database/migrations/`
4. Check ORM models in `src/models/orm/`

---

## Changelog

See individual changelog files:
- `CHANGELOG_NOTIFICATIONS.md` - Notification system changes
- `CHANGELOG_ENUM_FIXES.md` - ENUM type fixes
- Main `README.md` - General project changes
