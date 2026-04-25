# Voclio API - Postman Collection Guide

## Overview

This comprehensive Postman collection includes all Voclio API endpoints organized into logical categories. The collection supports automatic token management and includes example requests for all endpoints.

## 📦 Collection File

**File:** `Voclio_Complete_API.postman_collection.json`

## 🚀 Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Voclio_Complete_API.postman_collection.json`
4. Collection will appear in your workspace

### 2. Configure Environment Variables

The collection uses these variables (automatically managed):

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `base_url` | API base URL (default: `http://localhost:3001/api`) | No |
| `access_token` | JWT access token | Yes (on login) |
| `refresh_token` | JWT refresh token | Yes (on login) |
| `user_id` | Current user ID | Yes (on login) |

**To change base URL:**
1. Click on collection name
2. Go to **Variables** tab
3. Update `base_url` value (e.g., `https://api.voclio.com/api`)

### 3. Authenticate

1. Open **Authentication** → **Login** request
2. Update email and password in request body
3. Click **Send**
4. Tokens are automatically saved to collection variables ✅

## 📚 API Categories

### 1. Authentication (14 endpoints)
User registration, login, OAuth, OTP, password management, and profile operations.

**Key Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (auto-saves tokens)
- `POST /auth/google` - Google OAuth login
- `POST /auth/send-otp` - Send OTP code
- `GET /auth/profile` - Get user profile
- `POST /auth/logout` - Logout

### 2. Tasks (14 endpoints)
Complete task management including subtasks, bulk operations, and filtering.

**Key Endpoints:**
- `GET /tasks` - Get all tasks (with filters)
- `POST /tasks` - Create task
- `POST /tasks/bulk` - Create multiple tasks
- `POST /tasks/:id/subtasks` - Create subtask
- `PUT /tasks/:id/complete` - Mark complete
- `GET /tasks/stats` - Get task statistics

**Query Parameters:**
- `status`: pending, in_progress, completed
- `priority`: low, medium, high, urgent
- `page`, `limit`: Pagination

### 3. Voice Recordings (7 endpoints)
Voice recording upload, transcription, and AI-powered task extraction.

**Key Endpoints:**
- `POST /voice/process-complete` - **One-click processing** (upload + transcribe + extract)
- `GET /voice/job-status/:jobId` - Check processing status
- `POST /voice/upload` - Upload audio file
- `POST /voice/transcribe` - Transcribe recording
- `GET /voice` - Get all recordings

**File Upload:**
- Use `multipart/form-data`
- Field name: `audio_file`
- Supported formats: MP3, WAV, MP4, OGG, WebM
- Max size: 10MB

### 4. Categories (6 endpoints)
Organize tasks and notes with custom categories.

**Key Endpoints:**
- `GET /categories` - Get all categories
- `POST /categories` - Create category
- `GET /categories/:id/stats` - Category statistics

### 5. Notes (10 endpoints)
Note management with AI features (summarization, task extraction).

**Key Endpoints:**
- `GET /notes` - Get all notes (with search)
- `POST /notes` - Create note
- `POST /notes/:id/summarize` - AI summarization
- `POST /notes/:id/extract-tasks` - Extract tasks with AI
- `POST /notes/:id/tags` - Add tags to note

### 6. Tags (5 endpoints)
Tag system for organizing notes and tasks.

**Key Endpoints:**
- `GET /tags` - Get all tags
- `POST /tags` - Create tag
- `PUT /tags/:id` - Update tag

### 7. Reminders (8 endpoints)
Reminder management with snooze and dismiss functionality.

**Key Endpoints:**
- `GET /reminders/upcoming` - Get upcoming reminders
- `POST /reminders` - Create reminder
- `PUT /reminders/:id/snooze` - Snooze reminder
- `PUT /reminders/:id/dismiss` - Dismiss reminder

**Notification Types:**
- `push` - Push notification
- `email` - Email notification
- `whatsapp` - WhatsApp notification

### 8. Notifications (6 endpoints)
In-app notification management.

**Key Endpoints:**
- `GET /notifications` - Get all notifications
- `GET /notifications/unread-count` - Unread count
- `PUT /notifications/mark-all-read` - Mark all as read

### 9. Settings (7 endpoints)
User preferences and notification settings.

**Key Endpoints:**
- `GET /settings` - Get user settings
- `PUT /settings` - Update settings
- `PUT /settings/theme` - Update theme (light, dark, auto)
- `PUT /settings/notifications` - Update notification preferences

### 10. Dashboard (2 endpoints)
Dashboard statistics and quick overview.

**Key Endpoints:**
- `GET /dashboard/stats` - Comprehensive dashboard stats
- `GET /dashboard/quick-stats` - Quick overview

### 11. Productivity (8 endpoints)
Focus sessions (Pomodoro), streaks, achievements, and AI suggestions.

**Key Endpoints:**
- `POST /productivity/focus-sessions` - Start focus session
- `GET /productivity/streak` - Get productivity streak
- `GET /productivity/achievements` - Get achievements
- `GET /productivity/suggestions` - AI productivity suggestions (rate limited)

**Focus Session Status:**
- `active` - Session in progress
- `paused` - Session paused
- `completed` - Session completed
- `cancelled` - Session cancelled

### 12. Calendar (3 endpoints)
Unified calendar view combining tasks and meetings.

**Key Endpoints:**
- `GET /calendar/events` - Get calendar events
- `GET /calendar/month/:year/:month` - Month view
- `GET /calendar/day/:date` - Day view

### 13. Google Calendar (11 endpoints)
Google Calendar integration for meeting sync.

**Key Endpoints:**
- `GET /calendar/google/connect` - Get OAuth URL
- `GET /calendar/google/status` - Connection status
- `GET /calendar/google/events` - Get Google events
- `GET /calendar/google/today` - Today's meetings
- `DELETE /calendar/google/disconnect` - Disconnect

**OAuth Flow:**
1. Call `/calendar/google/connect` to get OAuth URL
2. User authorizes in browser
3. Google redirects to callback URL
4. Connection established

### 14. Webex Calendar (9 endpoints)
Webex meetings integration for creating and managing meetings.

**Key Endpoints:**
- `GET /webex/auth` - Get Webex OAuth URL
- `GET /webex/status` - Connection status
- `GET /webex/meetings` - Get meetings
- `POST /webex/meetings` - Create meeting
- `PUT /webex/meetings/:id` - Update meeting
- `DELETE /webex/meetings/:id` - Delete meeting

**Meeting Options:**
- `enabledAutoRecordMeeting` - Auto-record meeting
- `allowAnyUserToBeCoHost` - Allow co-hosts
- `enabledJoinBeforeHost` - Join before host
- `publicMeeting` - Public or private
- `sendEmail` - Send email invitations

### 15. Admin (13 endpoints)
Admin-only endpoints for user management, analytics, and system monitoring.

**Key Endpoints:**
- `GET /admin/users` - Get all users (with filters)
- `PUT /admin/users/:id/status` - Activate/deactivate user
- `PUT /admin/users/:id/role` - Grant/revoke admin
- `GET /admin/analytics/system` - System analytics
- `GET /admin/analytics/ai-usage` - AI usage stats
- `GET /admin/system/health` - System health

**Requires:** Admin role (`is_admin: true`)

### 16. Health Check (2 endpoints)
System status endpoints (no authentication required).

**Key Endpoints:**
- `GET /api/health` - API health check
- `GET /` - API information

## 🔐 Authentication

### Bearer Token (Automatic)

All authenticated endpoints use Bearer token authentication. The collection automatically:
1. Saves tokens when you login
2. Includes tokens in subsequent requests
3. Uses collection-level auth configuration

### Manual Token Setup

If needed, you can manually set tokens:
1. Click collection name
2. Go to **Variables** tab
3. Set `access_token` value
4. Save

### Token Refresh

When access token expires:
1. Use **Authentication** → **Refresh Token** request
2. New access token is returned
3. Update `access_token` variable

## 📝 Request Examples

### Create Task
```json
POST /tasks
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-04-30T17:00:00Z",
  "category_id": 1
}
```

### Upload and Process Voice (One-Click)
```
POST /voice/process-complete
Content-Type: multipart/form-data

audio_file: [file]
language: ar
category_id: 1
auto_create_tasks: true
auto_create_notes: true
```

### Create Webex Meeting
```json
POST /webex/meetings
{
  "title": "Team Standup",
  "start": "2026-04-26T10:00:00Z",
  "end": "2026-04-26T10:30:00Z",
  "agenda": "Daily team sync",
  "enabledAutoRecordMeeting": false,
  "sendEmail": true
}
```

## 🎯 Common Use Cases

### 1. User Registration & Login
1. **Register**: `POST /auth/register`
2. **Login**: `POST /auth/login` (tokens auto-saved)
3. **Get Profile**: `GET /auth/profile`

### 2. Voice-to-Task Workflow
1. **Upload & Process**: `POST /voice/process-complete`
2. **Check Status**: `GET /voice/job-status/:jobId`
3. **View Tasks**: `GET /tasks`

### 3. Calendar Integration
1. **Connect Google**: `GET /calendar/google/connect`
2. **Check Status**: `GET /calendar/google/status`
3. **Get Events**: `GET /calendar/events`

### 4. Productivity Tracking
1. **Start Focus**: `POST /productivity/focus-sessions`
2. **Check Streak**: `GET /productivity/streak`
3. **Get Suggestions**: `GET /productivity/suggestions`

## 🔧 Environment Setup

### Local Development
```
base_url: http://localhost:3001/api
```

### Staging
```
base_url: https://staging-api.voclio.com/api
```

### Production
```
base_url: https://api.voclio.com/api
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": "Additional details"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## ⚡ Rate Limiting

### General API
- **Limit**: 300 requests per 15 minutes (development: 10,000)
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Authentication Endpoints
- **Limit**: 50 requests per 15 minutes (development: 1,000)
- **Endpoints**: `/auth/login`, `/auth/register`, `/auth/send-otp`

### AI Suggestions
- **Limit**: 10 requests per 15 minutes
- **Endpoint**: `/productivity/suggestions`

## 🐛 Troubleshooting

### 401 Unauthorized
- Token expired → Use refresh token endpoint
- Token missing → Login again
- Invalid token → Clear variables and login

### 403 Forbidden
- Insufficient permissions
- Admin endpoints require admin role

### 429 Too Many Requests
- Rate limit exceeded
- Wait for rate limit window to reset
- Check `X-RateLimit-Reset` header

### 404 Not Found
- Check endpoint URL
- Verify resource ID exists
- Check base_url variable

## 📖 Additional Resources

- **Swagger Docs**: `http://localhost:3001/api-docs`
- **API Docs JSON**: `http://localhost:3001/api-docs.json`
- **Health Check**: `http://localhost:3001/api/health`

## 🎓 Tips & Best Practices

1. **Use Environments**: Create separate environments for dev/staging/prod
2. **Test Scripts**: Add test scripts to validate responses
3. **Pre-request Scripts**: Use for dynamic data generation
4. **Collections Runner**: Run entire collection for testing
5. **Monitor**: Use Postman Monitor for uptime checks
6. **Documentation**: Generate API docs from collection
7. **Mock Servers**: Create mock servers for frontend development

## 📞 Support

For issues or questions:
- Check server logs for detailed error messages
- Verify environment variables are set correctly
- Ensure database and services are running
- Review API documentation at `/api-docs`

## 🔄 Version

**Collection Version**: 2.0.0  
**API Version**: 2.0  
**Last Updated**: April 2026

---

**Happy Testing! 🚀**
