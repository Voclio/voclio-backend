# Calendar API Documentation

This document provides comprehensive documentation for all calendar-related APIs in the Voclio application, including Google Calendar and Webex integration.

## Base URLs
```
Google Calendar: http://localhost:3000/api/calendar
Webex Calendar: http://localhost:3000/api/webex
```

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": null
  }
}
```

---

## General Calendar Endpoints

### 1. Get Calendar Events

**Endpoint:** `GET /calendar/events`

**Description:** Get all calendar events (tasks, reminders, Google Calendar, Webex) within a date range.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `start_date` (required): ISO 8601 date string
- `end_date` (required): ISO 8601 date string
- `include_google` (optional): "true" or "false" (default: "true")
- `include_webex` (optional): "true" or "false" (default: "true")

**Example Request:**
```
GET /calendar/events?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z&include_google=true&include_webex=true
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "events": [
      {
        "id": "task-uuid",
        "type": "task",
        "title": "Complete project",
        "description": "Project description",
        "date": "2024-01-15T10:00:00Z",
        "priority": "high",
        "status": "pending",
        "category_id": "cat-uuid",
        "allDay": false,
        "source": "voclio"
      },
      {
        "id": "google-event-id",
        "type": "meeting",
        "title": "Team Meeting",
        "description": "Weekly team sync",
        "date": "2024-01-16T14:00:00Z",
        "end_date": "2024-01-16T15:00:00Z",
        "location": "Conference Room A",
        "attendees": ["user@example.com"],
        "allDay": false,
        "source": "google_calendar",
        "htmlLink": "https://calendar.google.com/..."
      },
      {
        "id": "webex-meeting-id",
        "type": "meeting",
        "title": "Client Call",
        "description": "Quarterly review",
        "date": "2024-01-17T16:00:00Z",
        "end_date": "2024-01-17T17:00:00Z",
        "location": "https://webex.com/join/...",
        "meetingNumber": "123456789",
        "password": "meeting123",
        "hostEmail": "host@example.com",
        "allDay": false,
        "source": "webex",
        "joinUrl": "https://webex.com/join/...",
        "sipAddress": "123456789@webex.com"
      }
    ],
    "period": {
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z"
    },
    "count": 3,
    "tasks_count": 1,
    "reminders_count": 0,
    "google_events_count": 1,
    "webex_meetings_count": 1,
    "google_sync_enabled": true,
    "webex_sync_enabled": true
  }
}
```

---

### 2. Get Month Calendar

**Endpoint:** `GET /calendar/month/:year/:month`

**Description:** Get calendar events organized by day for a specific month.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `year`: Year (2020-2100)
- `month`: Month (1-12)

**Example Request:**
```
GET /calendar/month/2024/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "year": 2024,
    "month": 1,
    "month_name": "January",
    "days_in_month": 31,
    "events_by_day": {
      "15": {
        "tasks": [
          {
            "task_id": "uuid",
            "title": "Complete project",
            "priority": "high",
            "status": "pending",
            "due_date": "2024-01-15T10:00:00Z"
          }
        ],
        "reminders": [],
        "count": 1
      }
    },
    "total_events": 1,
    "tasks_count": 1,
    "reminders_count": 0
  }
}
```

---

### 3. Get Day Events

**Endpoint:** `GET /calendar/day/:date`

**Description:** Get all events for a specific day.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `date`: ISO 8601 date string

**Query Parameters:**
- `include_google` (optional): "true" or "false" (default: "true")

**Example Request:**
```
GET /calendar/day/2024-01-15?include_google=true
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "date": "2024-01-15",
    "tasks": [
      {
        "task_id": "uuid",
        "title": "Complete project",
        "description": "Project description",
        "due_date": "2024-01-15T10:00:00Z",
        "priority": "high",
        "status": "pending"
      }
    ],
    "reminders": [],
    "meetings": [
      {
        "id": "google-event-id",
        "title": "Team Meeting",
        "start": "2024-01-15T14:00:00Z",
        "end": "2024-01-15T15:00:00Z"
      }
    ],
    "total_events": 2,
    "google_events_count": 1
  }
}
```

---

## Google Calendar Integration

### 4. Connect Google Calendar

**Endpoint:** `GET /calendar/google/connect`

**Description:** Generate Google OAuth authorization URL for web applications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "auth_url": "https://accounts.google.com/oauth2/auth?...",
    "message": "Visit the auth_url to authorize Google Calendar access"
  }
}
```

---

### 5. Connect Google Calendar (Mobile)

**Endpoint:** `GET /calendar/google/connect/mobile`

**Description:** Generate Google OAuth authorization URL for mobile applications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `custom_scheme` (optional): Custom URL scheme (default: "com.voclio.app")

**Example Request:**
```
GET /calendar/google/connect/mobile?custom_scheme=com.myapp.voclio
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "auth_url": "https://accounts.google.com/oauth2/auth?...",
    "custom_scheme": "com.myapp.voclio",
    "message": "Use this URL for mobile OAuth flow"
  }
}
```

---

### 6. Handle Mobile OAuth Callback

**Endpoint:** `POST /calendar/google/callback/mobile`

**Description:** Handle OAuth callback for mobile applications with authorization code.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "code": "authorization_code_from_google",
  "custom_scheme": "com.voclio.app"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google Calendar connected successfully",
  "data": {
    "message": "Google Calendar connected successfully",
    "sync_enabled": true,
    "tokens": {
      "access_token": "google_access_token",
      "expires_in": 3600
    }
  }
}
```

---

### 7. Test Google Calendar Token

**Endpoint:** `POST /calendar/google/test-token`

**Description:** Test Google Calendar API with manual access token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "access_token": "google_access_token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google Calendar API test successful",
  "data": {
    "message": "Google Calendar API test successful",
    "events_count": 5,
    "events": [
      {
        "id": "event-id",
        "title": "Sample Event",
        "start": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 8. Link OAuth Session

**Endpoint:** `POST /calendar/google/link-session`

**Description:** Link OAuth session to user account using session ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "session_id": "session_id_from_callback"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google Calendar linked successfully",
  "data": {
    "message": "Google Calendar linked successfully",
    "sync_enabled": true,
    "tokens": {
      "access_token": "google_access_token",
      "expires_in": 3600
    }
  }
}
```

---

### 9. Google OAuth Callback (Web)

**Endpoint:** `GET /calendar/google/callback`

**Description:** Handle Google OAuth callback for web applications (no auth required).

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: State parameter (optional)

**Response:** HTML page with session ID for linking to user account.

---

### 10. Disconnect Google Calendar

**Endpoint:** `DELETE /calendar/google/disconnect`

**Description:** Disconnect Google Calendar integration.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google Calendar disconnected successfully",
  "data": {
    "message": "Google Calendar disconnected successfully"
  }
}
```

---

### 11. Get Google Calendar Status

**Endpoint:** `GET /calendar/google/status`

**Description:** Get Google Calendar connection status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "connected": true,
    "sync_enabled": true,
    "sync_status": "active",
    "calendar_name": "Primary Calendar",
    "last_sync_at": "2024-01-15T10:00:00Z",
    "error_message": null
  }
}
```

---

### 12. Get Google Calendar Events

**Endpoint:** `GET /calendar/google/events`

**Description:** Get events from Google Calendar only.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `start_date` (required): ISO 8601 date string
- `end_date` (required): ISO 8601 date string

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "events": [
      {
        "id": "google-event-id",
        "title": "Team Meeting",
        "description": "Weekly sync",
        "start": "2024-01-15T14:00:00Z",
        "end": "2024-01-15T15:00:00Z",
        "location": "Conference Room",
        "attendees": ["user@example.com"],
        "htmlLink": "https://calendar.google.com/..."
      }
    ],
    "count": 1,
    "period": {
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z"
    }
  }
}
```

---

### 13. Get Today's Meetings

**Endpoint:** `GET /calendar/google/today`

**Description:** Get today's meetings from Google Calendar.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "meetings": [
      {
        "id": "event-id",
        "title": "Daily Standup",
        "start": "2024-01-15T09:00:00Z",
        "end": "2024-01-15T09:30:00Z"
      }
    ],
    "count": 1,
    "date": "2024-01-15"
  }
}
```

---

### 14. Get Upcoming Meetings

**Endpoint:** `GET /calendar/google/upcoming`

**Description:** Get upcoming meetings from both Google Calendar and Webex.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 7, max: 365)
- `include_google` (optional): "true" or "false" (default: "true")
- `include_webex` (optional): "true" or "false" (default: "true")

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "meetings": [
      {
        "id": "google-event-id",
        "title": "Team Meeting",
        "start": "2024-01-16T14:00:00Z",
        "end": "2024-01-16T15:00:00Z",
        "source": "google_calendar",
        "platform": "Google Calendar"
      },
      {
        "id": "webex-meeting-id",
        "title": "Client Call",
        "start": "2024-01-17T16:00:00Z",
        "end": "2024-01-17T17:00:00Z",
        "source": "webex",
        "platform": "Webex"
      }
    ],
    "count": 2,
    "days": 7,
    "google_meetings_count": 1,
    "webex_meetings_count": 1
  }
}
```

---

## Webex Calendar Integration

### 15. Get Webex Authorization URL

**Endpoint:** `GET /webex/auth`

**Description:** Generate Webex OAuth authorization URL.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex authorization URL generated successfully",
  "data": {
    "authUrl": "https://webexapis.com/v1/authorize?...",
    "message": "Webex authorization URL generated successfully"
  }
}
```

---

### 16. Handle Webex OAuth Callback

**Endpoint:** `GET /webex/callback`

**Description:** Handle Webex OAuth callback.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `code`: Authorization code from Webex
- `state`: State parameter (optional)
- `error`: Error parameter (if authorization failed)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex calendar connected successfully",
  "data": {
    "message": "Webex calendar connected successfully",
    "webexUser": {
      "id": "webex-user-id",
      "email": "user@example.com",
      "displayName": "John Doe"
    }
  }
}
```

---

### 17. Get Webex Connection Status

**Endpoint:** `GET /webex/status`

**Description:** Get Webex calendar connection status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex calendar connected",
  "data": {
    "connected": true,
    "syncEnabled": true,
    "webexUser": {
      "id": "webex-user-id",
      "email": "user@example.com",
      "displayName": "John Doe"
    },
    "lastSyncAt": "2024-01-15T10:00:00Z",
    "message": "Webex calendar connected"
  }
}
```

---

### 18. Disconnect Webex Calendar

**Endpoint:** `POST /webex/disconnect`

**Description:** Disconnect Webex calendar integration.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex calendar disconnected successfully",
  "data": {
    "message": "Webex calendar disconnected successfully"
  }
}
```

---

### 19. Get Webex Meetings

**Endpoint:** `GET /webex/meetings`

**Description:** Get Webex meetings within a date range or upcoming days.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `from` (optional): ISO 8601 date string
- `to` (optional): ISO 8601 date string
- `days` (optional): Number of days to look ahead (1-365, default: 7)

**Example Request:**
```
GET /webex/meetings?days=14
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex meetings retrieved successfully",
  "data": {
    "meetings": [
      {
        "id": "webex-meeting-id",
        "title": "Weekly Review",
        "start": "2024-01-16T10:00:00Z",
        "end": "2024-01-16T11:00:00Z",
        "joinUrl": "https://webex.com/join/...",
        "meetingNumber": "123456789",
        "password": "meeting123",
        "hostEmail": "host@example.com",
        "agenda": "Weekly team review"
      }
    ],
    "count": 1,
    "message": "Webex meetings retrieved successfully"
  }
}
```

---

### 20. Get Today's Webex Meetings

**Endpoint:** `GET /webex/meetings/today`

**Description:** Get today's Webex meetings.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Today's Webex meetings retrieved successfully",
  "data": {
    "meetings": [
      {
        "id": "webex-meeting-id",
        "title": "Daily Standup",
        "start": "2024-01-15T09:00:00Z",
        "end": "2024-01-15T09:30:00Z",
        "joinUrl": "https://webex.com/join/...",
        "meetingNumber": "987654321"
      }
    ],
    "count": 1,
    "message": "Today's Webex meetings retrieved successfully"
  }
}
```

---

### 21. Create Webex Meeting

**Endpoint:** `POST /webex/meetings`

**Description:** Create a new Webex meeting.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Team Meeting",
  "start": "2024-01-20T14:00:00Z",
  "end": "2024-01-20T15:00:00Z",
  "agenda": "Weekly team sync",
  "password": "meeting123",
  "timezone": "UTC",
  "enabledAutoRecordMeeting": false,
  "allowAnyUserToBeCoHost": false,
  "enabledJoinBeforeHost": true,
  "publicMeeting": false,
  "sendEmail": true
}
```

**Validation Rules:**
- `title`: Required, 1-200 characters
- `start`: Required, ISO 8601 date, must be in future
- `end`: Required, ISO 8601 date, must be after start
- `agenda`: Optional, max 2000 characters
- `password`: Optional, 4-50 characters
- `timezone`: Optional string
- Boolean fields: Optional booleans

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex meeting created successfully",
  "data": {
    "meeting": {
      "id": "new-meeting-id",
      "title": "Team Meeting",
      "start": "2024-01-20T14:00:00Z",
      "end": "2024-01-20T15:00:00Z",
      "joinUrl": "https://webex.com/join/...",
      "meetingNumber": "123456789",
      "password": "meeting123",
      "hostEmail": "host@example.com"
    },
    "message": "Webex meeting created successfully"
  }
}
```

---

### 22. Get Webex Meeting by ID

**Endpoint:** `GET /webex/meetings/:meetingId`

**Description:** Get a specific Webex meeting by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `meetingId`: Webex meeting ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex meeting retrieved successfully",
  "data": {
    "meeting": {
      "id": "meeting-id",
      "title": "Team Meeting",
      "start": "2024-01-20T14:00:00Z",
      "end": "2024-01-20T15:00:00Z",
      "agenda": "Weekly team sync",
      "joinUrl": "https://webex.com/join/...",
      "meetingNumber": "123456789",
      "password": "meeting123",
      "hostEmail": "host@example.com"
    },
    "message": "Webex meeting retrieved successfully"
  }
}
```

---

### 23. Update Webex Meeting

**Endpoint:** `PUT /webex/meetings/:meetingId`

**Description:** Update an existing Webex meeting.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `meetingId`: Webex meeting ID

**Request Body:**
```json
{
  "title": "Updated Team Meeting",
  "start": "2024-01-20T15:00:00Z",
  "end": "2024-01-20T16:00:00Z",
  "agenda": "Updated agenda",
  "password": "newpassword123"
}
```

**Validation Rules:**
- `title`: Optional, 1-200 characters if provided
- `start`: Optional, ISO 8601 date if provided
- `end`: Optional, ISO 8601 date if provided, must be after start
- `agenda`: Optional, max 2000 characters
- `password`: Optional, 4-50 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex meeting updated successfully",
  "data": {
    "meeting": {
      "id": "meeting-id",
      "title": "Updated Team Meeting",
      "start": "2024-01-20T15:00:00Z",
      "end": "2024-01-20T16:00:00Z",
      "agenda": "Updated agenda"
    },
    "message": "Webex meeting updated successfully"
  }
}
```

---

### 24. Delete Webex Meeting

**Endpoint:** `DELETE /webex/meetings/:meetingId`

**Description:** Delete a Webex meeting.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `meetingId`: Webex meeting ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webex meeting deleted successfully",
  "data": {
    "message": "Webex meeting deleted successfully"
  }
}
```

---

## Error Responses

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED_ERROR` | Authentication failed or token expired |
| `NOT_FOUND_ERROR` | Resource not found |
| `CONFLICT_ERROR` | Resource already exists |
| `INTERNAL_ERROR` | Server error |

### Calendar-Specific Errors

**Google Calendar Not Connected (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND_ERROR",
    "message": "Google Calendar not connected",
    "details": null
  }
}
```

**Webex Token Expired (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ERROR",
    "message": "Webex token expired. Please reconnect your account.",
    "details": null
  }
}
```

**Invalid Date Range (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "start_date and end_date are required",
    "details": null
  }
}
```

---

## Authentication & Authorization

### Required Headers
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### OAuth Flow Summary

**Google Calendar:**
1. Get auth URL: `GET /calendar/google/connect`
2. User authorizes in browser
3. Handle callback: `GET /calendar/google/callback` (web) or `POST /calendar/google/callback/mobile` (mobile)
4. Link session: `POST /calendar/google/link-session` (if using web flow)

**Webex:**
1. Get auth URL: `GET /webex/auth`
2. User authorizes in browser
3. Handle callback: `GET /webex/callback`

### Token Management
- Google Calendar tokens are automatically refreshed when expired
- Webex tokens are automatically refreshed when expired
- Both integrations handle token refresh transparently

---

## Rate Limiting & Best Practices

### Rate Limits
- Google Calendar API: 1,000 requests per 100 seconds per user
- Webex API: 300 requests per minute per application

### Best Practices
1. **Caching**: Calendar events are cached to reduce API calls
2. **Batch Requests**: Use date ranges to get multiple events efficiently
3. **Error Handling**: Always handle token expiration and refresh scenarios
4. **Sync Status**: Check connection status before making API calls
5. **Date Formats**: Always use ISO 8601 format for dates

### Sync Behavior
- Last sync timestamps are tracked for both integrations
- Failed syncs are logged with error messages
- Automatic token refresh prevents sync interruptions
- Users can manually disconnect and reconnect integrations