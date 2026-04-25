# Voclio API - Quick Reference Card

## 🔗 Base URL
```
Local: http://localhost:3001/api
Production: https://voclio-backend.build8.dev/api
```

## 🔐 Authentication
```
Authorization: Bearer {access_token}
```

## 📋 Quick Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (returns tokens) |
| POST | `/auth/google` | Google OAuth login |
| POST | `/auth/refresh-token` | Refresh access token |
| GET | `/auth/profile` | Get user profile |
| PUT | `/auth/profile` | Update profile |
| POST | `/auth/logout` | Logout |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get task by ID |
| POST | `/tasks` | Create task |
| POST | `/tasks/bulk` | Create multiple tasks |
| PUT | `/tasks/:id` | Update task |
| PUT | `/tasks/:id/complete` | Mark complete |
| DELETE | `/tasks/:id` | Delete task |
| GET | `/tasks/stats` | Task statistics |

### Voice Recordings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/voice/process-complete` | Upload + transcribe + extract (one-click) |
| GET | `/voice/job-status/:jobId` | Check job status |
| POST | `/voice/upload` | Upload audio file |
| POST | `/voice/transcribe` | Transcribe recording |
| GET | `/voice` | Get all recordings |
| DELETE | `/voice/:id` | Delete recording |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Get all categories |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | Get all notes |
| POST | `/notes` | Create note |
| PUT | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Delete note |
| POST | `/notes/:id/summarize` | AI summarize |
| POST | `/notes/:id/extract-tasks` | Extract tasks (AI) |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reminders` | Get all reminders |
| GET | `/reminders/upcoming` | Upcoming reminders |
| POST | `/reminders` | Create reminder |
| PUT | `/reminders/:id` | Update reminder |
| PUT | `/reminders/:id/snooze` | Snooze reminder |
| DELETE | `/reminders/:id` | Delete reminder |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get all notifications |
| GET | `/notifications/unread-count` | Unread count |
| PUT | `/notifications/mark-all-read` | Mark all read |
| PUT | `/notifications/:id/read` | Mark as read |
| DELETE | `/notifications/:id` | Delete notification |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Full dashboard stats |
| GET | `/dashboard/quick-stats` | Quick overview |

### Productivity
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/productivity/focus-sessions` | Start focus session |
| GET | `/productivity/focus-sessions` | Get sessions |
| GET | `/productivity/streak` | Get streak |
| GET | `/productivity/achievements` | Get achievements |
| GET | `/productivity/suggestions` | AI suggestions |

### Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar/events` | Get calendar events |
| GET | `/calendar/month/:year/:month` | Month view |
| GET | `/calendar/day/:date` | Day view |

### Google Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar/google/connect` | Get OAuth URL |
| GET | `/calendar/google/status` | Connection status |
| GET | `/calendar/google/events` | Get Google events |
| GET | `/calendar/google/today` | Today's meetings |
| DELETE | `/calendar/google/disconnect` | Disconnect |

### Webex
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webex/auth` | Get OAuth URL |
| GET | `/webex/status` | Connection status |
| GET | `/webex/meetings` | Get meetings |
| GET | `/webex/meetings/today` | Today's meetings |
| POST | `/webex/meetings` | Create meeting |
| PUT | `/webex/meetings/:id` | Update meeting |
| DELETE | `/webex/meetings/:id` | Delete meeting |

### Admin (Requires Admin Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users |
| GET | `/admin/users/:id` | Get user details |
| PUT | `/admin/users/:id/status` | Update user status |
| PUT | `/admin/users/:id/role` | Update user role |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/analytics/system` | System analytics |
| GET | `/admin/system/health` | System health |

## 📊 Common Query Parameters

### Pagination
```
?page=1&limit=20
```

### Task Filters
```
?status=pending&priority=high&category_id=1
```

### Date Ranges
```
?start_date=2026-04-01&end_date=2026-04-30
```

### Search
```
?search=meeting
```

## 📝 Request Body Examples

### Register User
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

### Create Task
```json
{
  "title": "Task title",
  "description": "Task description",
  "priority": "high",
  "due_date": "2026-04-30T17:00:00Z",
  "category_id": 1
}
```

### Create Reminder
```json
{
  "task_id": 1,
  "reminder_time": "2026-04-25T10:00:00Z",
  "notification_types": ["push", "email"]
}
```

### Create Webex Meeting
```json
{
  "title": "Team Meeting",
  "start": "2026-04-26T10:00:00Z",
  "end": "2026-04-26T11:00:00Z",
  "agenda": "Weekly sync"
}
```

## 🎨 Status & Priority Values

### Task Status
- `pending`
- `in_progress`
- `completed`

### Task Priority
- `low`
- `medium`
- `high`
- `urgent`

### Reminder Status
- `pending`
- `sent`
- `dismissed`

### Focus Session Status
- `active`
- `paused`
- `completed`
- `cancelled`

### Notification Types
- `push`
- `email`
- `whatsapp`

### Theme Options
- `light`
- `dark`
- `auto`

## ⚡ Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 300 req | 15 min |
| Auth endpoints | 50 req | 15 min |
| AI suggestions | 10 req | 15 min |

## 🔄 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Server Error |

## 🎯 Quick Workflows

### 1. User Onboarding
```
1. POST /auth/register
2. POST /auth/login
3. GET /auth/profile
4. PUT /settings
```

### 2. Voice to Task
```
1. POST /voice/process-complete (with audio file)
2. GET /voice/job-status/:jobId (poll until complete)
3. GET /tasks (view created tasks)
```

### 3. Calendar Sync
```
1. GET /calendar/google/connect
2. [User authorizes in browser]
3. GET /calendar/google/status
4. GET /calendar/events
```

### 4. Daily Productivity
```
1. POST /productivity/focus-sessions
2. GET /tasks?status=pending
3. PUT /tasks/:id/complete
4. GET /productivity/streak
```

## 🔧 Environment Variables

```env
PORT=3001
NODE_ENV=development
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_gemini_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
WEBEX_CLIENT_ID=your_webex_client_id
WEBEX_CLIENT_SECRET=your_webex_client_secret
REDIS_HOST=disabled
```

## 📚 Documentation Links

- **Swagger UI**: `http://localhost:3001/api-docs`
- **Health Check**: `http://localhost:3001/api/health`
- **Postman Collection**: `Voclio_Complete_API.postman_collection.json`

---

**Version**: 2.0.0 | **Last Updated**: April 2026
