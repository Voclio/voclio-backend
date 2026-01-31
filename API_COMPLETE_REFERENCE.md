# 📚 Voclio API - Complete Reference

## 🌐 Base URL
```
http://localhost:3001/api
```

## 🔐 Authentication
All endpoints (except auth endpoints) require:
```
Authorization: Bearer <access_token>
```

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Voice Recording](#voice-recording)
3. [Tasks](#tasks)
4. [Notes](#notes)
5. [Calendar](#calendar)
6. [Dashboard](#dashboard)
7. [Categories](#categories)
8. [Tags](#tags)
9. [Reminders](#reminders)
10. [Notifications](#notifications)
11. [Settings](#settings)
12. [Productivity](#productivity)
13. [Admin](#admin)

---

## 1. 🔐 Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "phone_number": "+1234567890"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Google OAuth
```http
POST /api/auth/google
Content-Type: application/json

{
  "id_token": "google_id_token_here"
}
```

### Facebook OAuth
```http
POST /api/auth/facebook
Content-Type: application/json

{
  "access_token": "facebook_access_token_here"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "phone_number": "+9876543210"
}
```

### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "verification"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp_code": "123456",
  "type": "verification"
}
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "new_password": "NewPassword123!"
}
```

---

## 2. 🎙️ Voice Recording

### Upload Audio
```http
POST /api/voice/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: <audio_file>
```

### Transcribe Audio
```http
POST /api/voice/transcribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "recording_id": 123,
  "language": "ar"
}
```

### Update Transcription
```http
PUT /api/voice/update-transcription
Authorization: Bearer <token>
Content-Type: application/json

{
  "recording_id": 123,
  "transcription": "Updated text"
}
```

### Preview Extraction
```http
POST /api/voice/preview-extraction
Authorization: Bearer <token>
Content-Type: application/json

{
  "recording_id": 123,
  "extraction_type": "both"
}
```

### Create from Preview
```http
POST /api/voice/create-from-preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "recording_id": 123,
  "tasks": [...],
  "notes": [...],
  "category_id": 1
}
```

### Create Tasks from Recording
```http
POST /api/voice/:id/create-tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "auto_create": true,
  "category_id": 1
}
```

### Create Note from Recording
```http
POST /api/voice/:id/create-note
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Voice Note",
  "tags": ["voice", "ideas"]
}
```

### Get All Recordings
```http
GET /api/voice?page=1&limit=20
Authorization: Bearer <token>
```

### Get Recording Details
```http
GET /api/voice/:id
Authorization: Bearer <token>
```

### Delete Recording
```http
DELETE /api/voice/:id
Authorization: Bearer <token>
```

### Process Voice Complete (One-Click)
```http
POST /api/voice/process-complete
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: <audio_file>
language: ar
auto_create_tasks: true
auto_create_notes: true
category_id: 1
```

---

## 3. 📋 Tasks

### Get All Tasks
```http
GET /api/tasks?status=todo&priority=high&category_id=1
Authorization: Bearer <token>
```

### Get Task by ID
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

### Get Task with Subtasks
```http
GET /api/tasks/:id/with-subtasks
Authorization: Bearer <token>
```

### Get Main Tasks Only
```http
GET /api/tasks/main?status=todo
Authorization: Bearer <token>
```

### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete Project",
  "description": "Finish the backend API",
  "due_date": "2026-02-01T17:00:00Z",
  "priority": "high",
  "status": "todo",
  "category_id": 1
}
```

### Bulk Create Tasks
```http
POST /api/tasks/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "tasks": [
    {
      "title": "Task 1",
      "priority": "high"
    },
    {
      "title": "Task 2",
      "priority": "medium"
    }
  ]
}
```

### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "in_progress",
  "priority": "high"
}
```

### Mark Task Complete
```http
PUT /api/tasks/:id/complete
Authorization: Bearer <token>
```

### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### Get Task Stats
```http
GET /api/tasks/stats
Authorization: Bearer <token>
```

### Get Tasks by Date
```http
GET /api/tasks/by-date?date=2026-02-01
Authorization: Bearer <token>
```

### Get Tasks by Category
```http
GET /api/tasks/by-category?category_id=1
Authorization: Bearer <token>
```

### Create Subtask
```http
POST /api/tasks/:id/subtasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Subtask 1",
  "description": "Subtask description"
}
```

### Get Subtasks
```http
GET /api/tasks/:id/subtasks
Authorization: Bearer <token>
```

---

## 4. 📝 Notes

### Get All Notes
```http
GET /api/notes?page=1&limit=20
Authorization: Bearer <token>
```

### Get Note by ID
```http
GET /api/notes/:id
Authorization: Bearer <token>
```

### Create Note
```http
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Meeting Notes",
  "content": "Discussion points...",
  "tags": ["meeting", "work"]
}
```

### Update Note
```http
PUT /api/notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}
```

### Delete Note
```http
DELETE /api/notes/:id
Authorization: Bearer <token>
```

### Search Notes
```http
GET /api/notes/search?q=meeting
Authorization: Bearer <token>
```

### Summarize Note (AI)
```http
POST /api/notes/:id/summarize
Authorization: Bearer <token>
```

---

## 5. 📅 Calendar

### Get Calendar Events
```http
GET /api/calendar/events?start_date=2026-02-01&end_date=2026-02-28
Authorization: Bearer <token>
```

### Get Month Calendar
```http
GET /api/calendar/month/:year/:month
Authorization: Bearer <token>

Example: GET /api/calendar/month/2026/2
```

### Get Day Events
```http
GET /api/calendar/day/:date
Authorization: Bearer <token>

Example: GET /api/calendar/day/2026-02-01
```

---

## 6. 📊 Dashboard

### Get Dashboard Stats
```http
GET /api/dashboard
Authorization: Bearer <token>
```

### Get Quick Stats
```http
GET /api/dashboard/quick-stats
Authorization: Bearer <token>
```

---

## 7. 🏷️ Categories

### Get All Categories
```http
GET /api/categories
Authorization: Bearer <token>
```

### Get Category by ID
```http
GET /api/categories/:id
Authorization: Bearer <token>
```

### Create Category
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Work",
  "color": "#FF5733",
  "icon": "briefcase"
}
```

### Update Category
```http
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Personal",
  "color": "#33FF57"
}
```

### Delete Category
```http
DELETE /api/categories/:id
Authorization: Bearer <token>
```

---

## 8. 🏷️ Tags

### Get All Tags
```http
GET /api/tags
Authorization: Bearer <token>
```

### Get Tag by ID
```http
GET /api/tags/:id
Authorization: Bearer <token>
```

### Create Tag
```http
POST /api/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "important",
  "color": "#FF0000"
}
```

### Update Tag
```http
PUT /api/tags/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "urgent",
  "color": "#FF5733"
}
```

### Delete Tag
```http
DELETE /api/tags/:id
Authorization: Bearer <token>
```

---

## 9. 🔔 Reminders

### Get All Reminders
```http
GET /api/reminders
Authorization: Bearer <token>
```

### Get Upcoming Reminders
```http
GET /api/reminders/upcoming
Authorization: Bearer <token>
```

### Create Reminder
```http
POST /api/reminders
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Meeting Reminder",
  "reminder_time": "2026-02-01T15:00:00Z",
  "reminder_type": "notification",
  "task_id": 1
}
```

### Update Reminder
```http
PUT /api/reminders/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "reminder_time": "2026-02-01T16:00:00Z"
}
```

### Delete Reminder
```http
DELETE /api/reminders/:id
Authorization: Bearer <token>
```

---

## 10. 🔔 Notifications

### Get All Notifications
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <token>
```

### Get Unread Notifications
```http
GET /api/notifications/unread
Authorization: Bearer <token>
```

### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer <token>
```

### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

---

## 11. ⚙️ Settings

### Get User Settings
```http
GET /api/settings
Authorization: Bearer <token>
```

### Update Settings
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": "dark",
  "language": "ar",
  "notifications_enabled": true,
  "email_notifications": true
}
```

---

## 12. 📈 Productivity

### Get Productivity Stats
```http
GET /api/productivity/stats
Authorization: Bearer <token>
```

### Get Streak
```http
GET /api/productivity/streak
Authorization: Bearer <token>
```

### Start Focus Session
```http
POST /api/productivity/focus/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "task_id": 1,
  "duration": 25
}
```

### End Focus Session
```http
POST /api/productivity/focus/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": 1
}
```

### Get Achievements
```http
GET /api/productivity/achievements
Authorization: Bearer <token>
```

### Get AI Suggestions
```http
GET /api/productivity/suggestions
Authorization: Bearer <token>
```

---

## 13. 👨‍💼 Admin

### Get All Users
```http
GET /api/admin/users?page=1&limit=20&search=&status=all
Authorization: Bearer <admin_token>
```

### Get User Details
```http
GET /api/admin/users/:userId
Authorization: Bearer <admin_token>
```

### Update User Status
```http
PUT /api/admin/users/:userId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_active": false
}
```

### Update User Role
```http
PUT /api/admin/users/:userId/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_admin": true
}
```

### Delete User
```http
DELETE /api/admin/users/:userId
Authorization: Bearer <admin_token>
```

### Bulk Delete Users
```http
POST /api/admin/users/bulk-delete
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userIds": [1, 2, 3]
}
```

### Get System Analytics
```http
GET /api/admin/analytics/system
Authorization: Bearer <admin_token>
```

### Get AI Usage Stats
```http
GET /api/admin/analytics/ai-usage?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>
```

### Get Content Stats
```http
GET /api/admin/analytics/content
Authorization: Bearer <admin_token>
```

### Get System Health
```http
GET /api/admin/system/health
Authorization: Bearer <admin_token>
```

### Get Activity Logs
```http
GET /api/admin/system/activity-logs?page=1&limit=50
Authorization: Bearer <admin_token>
```

### Clear Old Data
```http
POST /api/admin/system/clear-old-data
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "days": 90
}
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
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
    "details": { ... }
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## 🔒 Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

**Total Endpoints: 100+**

**Documentation Version: 1.0.0**

**Last Updated: January 31, 2026**
