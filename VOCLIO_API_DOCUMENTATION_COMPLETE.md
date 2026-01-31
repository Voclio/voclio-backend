# 📡 Voclio API - Complete Documentation

**Version:** 3.0.0  
**Date:** January 31, 2026  
**Base URL:** `http://localhost:3001/api`  
**Total APIs:** 108

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Tasks Management](#tasks-management)
3. [Notes Management](#notes-management)
4. [Voice Processing](#voice-processing)
5. [Notifications](#notifications)
6. [Reminders](#reminders)
7. [Productivity Tracking](#productivity-tracking)
8. [Categories](#categories)
9. [Tags](#tags)
10. [Settings](#settings)
11. [Calendar](#calendar)
12. [Dashboard](#dashboard)
13. [Admin Panel](#admin-panel)

---

## 🔐 Authentication

### Base Path: `/api/auth`

All authentication endpoints for user registration, login, and profile management.

#### 1. Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone_number": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 86400
    }
  }
}
```

---

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

#### 3. Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <access_token>
```

---

#### 4. Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone_number": "+9876543210"
}
```

---

#### 5. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### 6. Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "login"
}
```

---

#### 7. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp_code": "123456",
  "type": "login"
}
```

---

#### 8. Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "login"
}
```

---

#### 9. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

#### 10. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "new_password": "newpassword123"
}
```

---

#### 11. Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "password123",
  "new_password": "newpassword123"
}
```

---

#### 12. Google Login (OAuth)
```http
POST /api/auth/google
Content-Type: application/json

{
  "id_token": "google_id_token_here"
}
```

---

#### 13. Facebook Login (OAuth)
```http
POST /api/auth/facebook
Content-Type: application/json

{
  "access_token": "facebook_access_token_here"
}
```

---

#### 14. Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

---

## ✅ Tasks Management

### Base Path: `/api/tasks`

Complete task management with subtasks support.

#### 1. Get All Tasks
```http
GET /api/tasks?page=1&limit=20&status=pending&priority=high
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): pending, in_progress, completed
- `priority` (optional): low, medium, high, urgent
- `category_id` (optional): Filter by category
- `search` (optional): Search in title/description

---

#### 2. Get Main Tasks Only
```http
GET /api/tasks/main
Authorization: Bearer <access_token>
```

Returns only parent tasks (no subtasks).

---

#### 3. Get Task Statistics
```http
GET /api/tasks/stats
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 20,
    "in_progress": 15,
    "completed": 15,
    "by_priority": {
      "low": 10,
      "medium": 20,
      "high": 15,
      "urgent": 5
    }
  }
}
```

---

#### 4. Get Tasks By Date
```http
GET /api/tasks/by-date?date=2026-02-01
Authorization: Bearer <access_token>
```

---

#### 5. Get Tasks By Category
```http
GET /api/tasks/by-category?category_id=1
Authorization: Bearer <access_token>
```

---

#### 6. Get Task By ID
```http
GET /api/tasks/:id
Authorization: Bearer <access_token>
```

---

#### 7. Get Task With All Subtasks
```http
GET /api/tasks/:id/with-subtasks
Authorization: Bearer <access_token>
```

---

#### 8. Get Subtasks of a Task
```http
GET /api/tasks/:id/subtasks
Authorization: Bearer <access_token>
```

---

#### 9. Create Task
```http
POST /api/tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "due_date": "2026-02-15",
  "priority": "high",
  "status": "pending",
  "category_id": 1
}
```

---

#### 10. Bulk Create Tasks
```http
POST /api/tasks/bulk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tasks": [
    {
      "title": "Task 1",
      "priority": "high",
      "due_date": "2026-02-01"
    },
    {
      "title": "Task 2",
      "priority": "medium",
      "due_date": "2026-02-02"
    }
  ]
}
```

---

#### 11. Create Subtask
```http
POST /api/tasks/:id/subtasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Subtask 1",
  "description": "This is a subtask",
  "priority": "medium"
}
```

---

#### 12. Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated task title",
  "status": "in_progress",
  "priority": "urgent"
}
```

---

#### 13. Mark Task as Complete
```http
PUT /api/tasks/:id/complete
Authorization: Bearer <access_token>
```

---

#### 14. Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <access_token>
```

---

## 📝 Notes Management

### Base Path: `/api/notes`

Notes with AI-powered features.

#### 1. Get All Notes
```http
GET /api/notes?page=1&limit=20&search=meeting
Authorization: Bearer <access_token>
```

---

#### 2. Get Note By ID
```http
GET /api/notes/:id
Authorization: Bearer <access_token>
```

---

#### 3. Create Note
```http
POST /api/notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Meeting Notes",
  "content": "Important discussion points from today's meeting...",
  "category_id": 1
}
```

---

#### 4. Update Note
```http
PUT /api/notes/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Meeting Notes",
  "content": "Updated content with more details..."
}
```

---

#### 5. Delete Note
```http
DELETE /api/notes/:id
Authorization: Bearer <access_token>
```

---

#### 6. AI Summarize Note
```http
POST /api/notes/:id/summarize
Authorization: Bearer <access_token>
```

Uses AI to generate a summary of the note content.

---

#### 7. AI Extract Tasks from Note
```http
POST /api/notes/:id/extract-tasks
Authorization: Bearer <access_token>
```

Uses AI to extract actionable tasks from note content.

---

#### 8. Get Note Tags
```http
GET /api/notes/:id/tags
Authorization: Bearer <access_token>
```

---

#### 9. Add Tags to Note
```http
POST /api/notes/:id/tags
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tag_ids": [1, 2, 3]
}
```

---

#### 10. Remove Tag from Note
```http
DELETE /api/notes/:id/tags/:tagId
Authorization: Bearer <access_token>
```

---

## 🎤 Voice Processing

### Base Path: `/api/voice`

Voice to text with AI extraction.

#### 1. 🌟 Process Voice Complete (ONE-CLICK)
```http
POST /api/voice/process-complete
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

audio_file: <file>
language: ar
extract_tasks: true
extract_notes: true
category_id: 1
```

**Complete workflow in one call:**
1. Upload audio file
2. Transcribe to text
3. Extract tasks and notes using AI
4. Create tasks and notes automatically

**Response:**
```json
{
  "success": true,
  "data": {
    "voice_recording": { "id": 1, "transcription": "..." },
    "tasks_created": [{ "id": 1, "title": "..." }],
    "notes_created": [{ "id": 1, "title": "..." }]
  }
}
```

---

#### 2. Preview Extraction
```http
POST /api/voice/preview-extraction
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "transcription": "أريد إنشاء مهمة لإنهاء المشروع غداً",
  "language": "ar"
}
```

Preview what will be extracted before creating.

---

#### 3. Create From Preview
```http
POST /api/voice/create-from-preview
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "voice_id": 1,
  "tasks": [
    {
      "title": "إنهاء المشروع",
      "due_date": "2026-02-01",
      "priority": "high"
    }
  ],
  "notes": [],
  "category_id": 1
}
```

---

#### 4. Update Transcription
```http
PUT /api/voice/update-transcription
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "voice_id": 1,
  "transcription": "Updated transcription text"
}
```

---

#### 5. Get All Voice Recordings
```http
GET /api/voice
Authorization: Bearer <access_token>
```

---

#### 6. Upload Voice Recording
```http
POST /api/voice/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

audio_file: <file>
language: ar
```

---

#### 7. Transcribe Voice
```http
POST /api/voice/transcribe
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "voice_id": 1,
  "language": "ar"
}
```

---

#### 8. Create Note from Voice
```http
POST /api/voice/:id/create-note
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Voice Note",
  "category_id": 1
}
```

---

#### 9. Create Tasks from Voice
```http
POST /api/voice/:id/create-tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category_id": 1
}
```

---

#### 10. Get Voice Recording Details
```http
GET /api/voice/:id
Authorization: Bearer <access_token>
```

---

#### 11. Delete Voice Recording
```http
DELETE /api/voice/:id
Authorization: Bearer <access_token>
```

---

## 🔔 Notifications

### Base Path: `/api/notifications`

Real-time notification system.

#### 1. Get All Notifications
```http
GET /api/notifications?page=1&limit=20&is_read=false
Authorization: Bearer <access_token>
```

---

#### 2. Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <access_token>
```

---

#### 3. Get Notification By ID
```http
GET /api/notifications/:id
Authorization: Bearer <access_token>
```

---

#### 4. Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <access_token>
```

---

#### 5. Mark All as Read
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer <access_token>
```

---

#### 6. Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <access_token>
```

---

## ⏰ Reminders

### Base Path: `/api/reminders`

Reminder management system.

#### 1. Get All Reminders
```http
GET /api/reminders
Authorization: Bearer <access_token>
```

---

#### 2. Get Upcoming Reminders
```http
GET /api/reminders/upcoming
Authorization: Bearer <access_token>
```

---

#### 3. Get Reminder By ID
```http
GET /api/reminders/:id
Authorization: Bearer <access_token>
```

---

#### 4. Create Reminder
```http
POST /api/reminders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "remind_at": "2026-02-01T10:00:00Z",
  "type": "meeting"
}
```

---

#### 5. Update Reminder
```http
PUT /api/reminders/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Meeting",
  "remind_at": "2026-02-01T11:00:00Z"
}
```

---

#### 6. Snooze Reminder
```http
PUT /api/reminders/:id/snooze
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "snooze_minutes": 15
}
```

---

#### 7. Dismiss Reminder
```http
PUT /api/reminders/:id/dismiss
Authorization: Bearer <access_token>
```

---

#### 8. Delete Reminder
```http
DELETE /api/reminders/:id
Authorization: Bearer <access_token>
```

---

## 🎯 Productivity Tracking

### Base Path: `/api/productivity`

Focus sessions, streaks, and achievements.

#### 1. Start Focus Session
```http
POST /api/productivity/focus-sessions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "task_id": 1,
  "duration_minutes": 25,
  "session_type": "pomodoro"
}
```

---

#### 2. Get Focus Sessions
```http
GET /api/productivity/focus-sessions
Authorization: Bearer <access_token>
```

---

#### 3. Update Focus Session
```http
PUT /api/productivity/focus-sessions/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "actual_duration": 25,
  "notes": "Completed successfully"
}
```

---

#### 4. End Focus Session
```http
DELETE /api/productivity/focus-sessions/:id
Authorization: Bearer <access_token>
```

---

#### 5. Get Productivity Streak
```http
GET /api/productivity/streak
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_streak": 7,
    "longest_streak": 15,
    "last_activity": "2026-01-31"
  }
}
```

---

#### 6. Get Achievements
```http
GET /api/productivity/achievements
Authorization: Bearer <access_token>
```

---

#### 7. Get Productivity Summary
```http
GET /api/productivity/summary?period=week
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period`: day, week, month, year

---

#### 8. Get AI Suggestions
```http
GET /api/productivity/suggestions
Authorization: Bearer <access_token>
```

AI-powered productivity suggestions based on user behavior.

---

## 📁 Categories

### Base Path: `/api/categories`

Category management for tasks and notes.

#### 1. Get All Categories
```http
GET /api/categories
Authorization: Bearer <access_token>
```

---

#### 2. Get Category By ID
```http
GET /api/categories/:id
Authorization: Bearer <access_token>
```

---

#### 3. Get Category Statistics
```http
GET /api/categories/:id/stats
Authorization: Bearer <access_token>
```

---

#### 4. Create Category
```http
POST /api/categories
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Work",
  "color": "#FF5733",
  "description": "Work related tasks"
}
```

---

#### 5. Update Category
```http
PUT /api/categories/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Work",
  "color": "#33FF57"
}
```

---

#### 6. Delete Category
```http
DELETE /api/categories/:id
Authorization: Bearer <access_token>
```

---

## 🏷️ Tags

### Base Path: `/api/tags`

Tag management system.

#### 1. Get All Tags
```http
GET /api/tags
Authorization: Bearer <access_token>
```

---

#### 2. Get Tag By ID
```http
GET /api/tags/:id
Authorization: Bearer <access_token>
```

---

#### 3. Create Tag
```http
POST /api/tags
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "urgent",
  "color": "#FF0000"
}
```

---

#### 4. Update Tag
```http
PUT /api/tags/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "very-urgent",
  "color": "#FF3333"
}
```

---

#### 5. Delete Tag
```http
DELETE /api/tags/:id
Authorization: Bearer <access_token>
```

---

## ⚙️ Settings

### Base Path: `/api/settings`

User settings and preferences.

#### 1. Get Settings
```http
GET /api/settings
Authorization: Bearer <access_token>
```

---

#### 2. Update Settings
```http
PUT /api/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "theme": "dark",
  "language": "ar",
  "timezone": "Asia/Riyadh"
}
```

---

#### 3. Update Theme
```http
PUT /api/settings/theme
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "theme": "dark"
}
```

**Options:** light, dark, auto

---

#### 4. Update Language
```http
PUT /api/settings/language
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "language": "ar"
}
```

**Options:** ar, en

---

#### 5. Update Timezone
```http
PUT /api/settings/timezone
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "timezone": "Asia/Riyadh"
}
```

---

#### 6. Get Notification Settings
```http
GET /api/settings/notifications
Authorization: Bearer <access_token>
```

---

#### 7. Update Notification Settings
```http
PUT /api/settings/notifications
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email_notifications": true,
  "push_notifications": true,
  "task_reminders": true
}
```

---

## 📅 Calendar

### Base Path: `/api/calendar`

Calendar view for tasks and reminders.

#### 1. Get Calendar Events
```http
GET /api/calendar/events?start_date=2026-01-01&end_date=2026-12-31
Authorization: Bearer <access_token>
```

---

#### 2. Get Month Calendar
```http
GET /api/calendar/month/:year/:month
Authorization: Bearer <access_token>
```

**Example:** `/api/calendar/month/2026/2`

---

#### 3. Get Day Events
```http
GET /api/calendar/day/:date
Authorization: Bearer <access_token>
```

**Example:** `/api/calendar/day/2026-02-01`

---

## 📊 Dashboard

### Base Path: `/api/dashboard`

Dashboard statistics and analytics.

#### 1. Get Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 50,
      "completed": 30,
      "pending": 15,
      "in_progress": 5
    },
    "notes": { "total": 25 },
    "voice_recordings": { "total": 10 },
    "productivity": {
      "current_streak": 7,
      "focus_sessions_today": 3
    }
  }
}
```

---

#### 2. Get Quick Stats
```http
GET /api/dashboard/quick-stats
Authorization: Bearer <access_token>
```

Lightweight version with essential stats only.

---

## 👨‍💼 Admin Panel

### Base Path: `/api/admin`

**Note:** All admin routes require admin role.

#### 1. Get All Users
```http
GET /api/admin/users?page=1&limit=20&status=all&sortBy=created_at&order=DESC
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search by name/email
- `status`: all, active, inactive, admin
- `sortBy`: created_at, email, name
- `order`: ASC, DESC

---

#### 2. Get User Details
```http
GET /api/admin/users/:userId
Authorization: Bearer <admin_token>
```

---

#### 3. Update User Status
```http
PUT /api/admin/users/:userId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_active": false
}
```

---

#### 4. Update User Role
```http
PUT /api/admin/users/:userId/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_admin": true
}
```

---

#### 5. Delete User
```http
DELETE /api/admin/users/:userId
Authorization: Bearer <admin_token>
```

---

#### 6. Bulk Delete Users
```http
POST /api/admin/users/bulk-delete
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userIds": [1, 2, 3]
}
```

---

#### 7. Get System Analytics
```http
GET /api/admin/analytics/system
Authorization: Bearer <admin_token>
```

---

#### 8. Get AI Usage Statistics
```http
GET /api/admin/analytics/ai-usage?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer <admin_token>
```

---

#### 9. Get Content Statistics
```http
GET /api/admin/analytics/content
Authorization: Bearer <admin_token>
```

---

#### 10. Get System Health
```http
GET /api/admin/system/health
Authorization: Bearer <admin_token>
```

---

#### 11. Get Activity Logs
```http
GET /api/admin/system/activity-logs?page=1&limit=50
Authorization: Bearer <admin_token>
```

---

#### 12. Clear Old Data
```http
POST /api/admin/system/clear-old-data
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "days": 90
}
```

---

#### 13. Get Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

This endpoint was removed. Use `/api/dashboard/stats` instead.

---

## 📊 API Summary

| Module | Endpoints | Auth Required |
|--------|-----------|---------------|
| Health & Info | 2 | ❌ |
| Authentication | 14 | Mixed |
| Tasks | 14 | ✅ |
| Notes | 10 | ✅ |
| Voice | 11 | ✅ |
| Notifications | 6 | ✅ |
| Reminders | 8 | ✅ |
| Productivity | 8 | ✅ |
| Categories | 6 | ✅ |
| Tags | 5 | ✅ |
| Settings | 7 | ✅ |
| Calendar | 3 | ✅ |
| Dashboard | 2 | ✅ |
| Admin | 12 | ✅ (Admin) |
| **TOTAL** | **108** | - |

---

## 🔑 Authentication

Most endpoints require JWT Bearer token:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token:** 24 hours
- **Refresh Token:** 7 days

---

## 🎯 Special Features

### 1. Voice to Everything
- Upload voice → Auto transcribe → Auto extract tasks/notes
- Support for Arabic and English
- AI-powered extraction
- ONE-CLICK complete processing

### 2. Smart Notifications
- Automatic notifications for all actions
- Priority levels (low, normal, high, urgent)
- Real-time updates

### 3. AI Features
- Note summarization
- Task extraction from notes
- Voice transcription
- Productivity suggestions

### 4. Productivity Tracking
- Focus sessions with timer
- Productivity streaks
- Achievement system
- Daily/weekly/monthly summaries

---

## 📝 Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

---

## 🚀 Getting Started

1. **Import Postman Collection:**
   - File: `Voclio_Complete_API_Final.postman_collection.json`
   - Import into Postman
   - Set environment variables

2. **Register/Login:**
   - Use `/api/auth/register` or `/api/auth/login`
   - Save the access token

3. **Start Testing:**
   - All requests are ready to use
   - Variables are auto-populated

---

## 📚 Additional Resources

- **Postman Collection:** `Voclio_Complete_API_Final.postman_collection.json`
- **Mobile App Guide:** `MOBILE_APP_API_GUIDE.md`
- **Admin Panel Guide:** `ADMIN_PANEL_GUIDE.md`
- **Voice Processing:** `VOICE_TO_EVERYTHING.md`
- **Notification System:** `NOTIFICATION_SYSTEM.md`

---

## 🔗 Quick Links

- **Base URL:** `http://localhost:3001/api`
- **Health Check:** `http://localhost:3001/api/health`
- **API Info:** `http://localhost:3001/api`

---

**Last Updated:** January 31, 2026  
**Version:** 3.0.0  
**Total APIs:** 108  
**Status:** ✅ Complete & Production Ready

---

© 2026 Voclio - Voice Notes & Task Management System
