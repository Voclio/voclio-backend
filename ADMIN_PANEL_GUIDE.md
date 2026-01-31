# 👨‍💼 Admin Panel - Complete Guide

## 🔐 Admin Access

### How to Become Admin

Admins are created through the database. To make a user admin:

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@voclio.com';
```

Or use the admin creation script:

```bash
node database/create_admin.sql
```

### Admin Authentication

All admin endpoints require:
1. ✅ Valid JWT token (login first)
2. ✅ `is_admin = true` in user record

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

---

## 📊 What Admin Can See & Do

### 1. 👥 USER MANAGEMENT

#### **Get All Users**
```
GET /api/admin/users
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search by email or name
- `status` - Filter: `all`, `active`, `inactive`, `admin`
- `sortBy` - Sort by: `created_at`, `email`, `name`
- `order` - Order: `ASC`, `DESC`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "phone_number": "+1234567890",
      "is_active": true,
      "email_verified": true,
      "is_admin": false,
      "oauth_provider": "google",
      "created_at": "2026-01-15T...",
      "notes_count": 45,
      "tasks_count": 123,
      "recordings_count": 67
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**Admin Can:**
- ✅ View all users with statistics
- ✅ Search users by email/name
- ✅ Filter by status (active/inactive/admin)
- ✅ Sort by different fields
- ✅ See user activity counts

---

#### **Get User Details**
```
GET /api/admin/users/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "is_active": true,
      "is_admin": false,
      "created_at": "2026-01-15T..."
    },
    "statistics": {
      "total_notes": 45,
      "total_tasks": 123,
      "completed_tasks": 89,
      "total_recordings": 67,
      "total_reminders": 34,
      "total_tags": 12,
      "total_categories": 5,
      "focus_sessions": 156,
      "total_focus_time": 18720,
      "active_sessions": 2
    },
    "recent_activity": {
      "notes": [
        {
          "note_id": 1,
          "title": "Meeting Notes",
          "created_at": "2026-01-31T..."
        }
      ],
      "tasks": [
        {
          "task_id": 1,
          "title": "Complete Project",
          "status": "in_progress",
          "created_at": "2026-01-31T..."
        }
      ],
      "recordings": [
        {
          "recording_id": 1,
          "file_size": 245678,
          "format": "audio/mp3",
          "created_at": "2026-01-31T..."
        }
      ]
    }
  }
}
```

**Admin Can:**
- ✅ View complete user profile
- ✅ See all user statistics
- ✅ View recent activity (notes, tasks, recordings)
- ✅ Monitor user engagement
- ✅ Check focus time and productivity

---

#### **Update User Status (Activate/Deactivate)**
```
PUT /api/admin/users/:userId/status
Body: { "is_active": true/false }
```

**Admin Can:**
- ✅ Activate user account
- ✅ Deactivate user account (ban)
- ✅ Prevent user from logging in

---

#### **Update User Role (Make/Remove Admin)**
```
PUT /api/admin/users/:userId/role
Body: { "is_admin": true/false }
```

**Admin Can:**
- ✅ Promote user to admin
- ✅ Remove admin privileges
- ❌ Cannot remove own admin role (safety)

---

#### **Delete User**
```
DELETE /api/admin/users/:userId
```

**Admin Can:**
- ✅ Permanently delete user account
- ✅ All user data is deleted (notes, tasks, recordings)
- ❌ Cannot delete own account (safety)

---

#### **Bulk Delete Users**
```
POST /api/admin/users/bulk-delete
Body: { "userIds": [1, 2, 3, 4] }
```

**Admin Can:**
- ✅ Delete multiple users at once
- ✅ Efficient cleanup of spam accounts
- ❌ Cannot include own user ID

---

### 2. 📊 ANALYTICS & STATISTICS

#### **System Analytics**
```
GET /api/admin/analytics/system
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_users": 1523,
      "active_users": 1401,
      "inactive_users": 122,
      "new_users_week": 45,
      "new_users_month": 189,
      "total_notes": 12456,
      "total_tasks": 34567,
      "completed_tasks": 23456,
      "total_recordings": 8901,
      "total_reminders": 5678,
      "total_focus_sessions": 15234,
      "admin_users": 5,
      "oauth_users": 890
    },
    "daily_registrations": [
      {
        "date": "2026-01-31",
        "registrations": 12
      },
      {
        "date": "2026-01-30",
        "registrations": 8
      }
    ],
    "most_active_users": [
      {
        "user_id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "notes_count": 234,
        "tasks_count": 567,
        "recordings_count": 123
      }
    ]
  }
}
```

**Admin Can See:**
- ✅ Total users (active/inactive)
- ✅ New users (week/month)
- ✅ Total content (notes, tasks, recordings)
- ✅ Completion rates
- ✅ Daily registration trends (30 days)
- ✅ Most active users (top 10)
- ✅ OAuth vs regular users
- ✅ Admin count

---

#### **AI Usage Statistics**
```
GET /api/admin/analytics/ai-usage?startDate=2026-01-01&endDate=2026-01-31
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `userId` - Filter by specific user

**Response:**
```json
{
  "success": true,
  "data": {
    "daily_stats": [
      {
        "date": "2026-01-31",
        "summarizations": 45,
        "total_ai_requests": 45
      }
    ],
    "totals": {
      "total_summarizations": 1234,
      "active_ai_users": 567,
      "total_transcriptions": 890
    },
    "token_estimate": {
      "input_tokens": 1234567,
      "output_tokens": 456789,
      "total_tokens": 1691356,
      "estimated_cost_usd": "3.3827"
    }
  }
}
```

**Admin Can See:**
- ✅ Daily AI usage trends
- ✅ Total summarizations
- ✅ Total transcriptions (voice-to-text)
- ✅ Active AI users
- ✅ Token usage estimates
- ✅ Estimated API costs
- ✅ Filter by date range or user

---

#### **Content Statistics**
```
GET /api/admin/analytics/content
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "notes_today": 45,
      "tasks_today": 123,
      "recordings_today": 34,
      "notes_week": 234,
      "tasks_week": 567,
      "recordings_week": 189,
      "avg_note_length": "456.78",
      "avg_recording_size": "2456789.12",
      "total_storage_used": 12345678901,
      "total_storage_used_mb": "11773.45"
    },
    "popular_tags": [
      {
        "name": "work",
        "usage_count": 234,
        "color": "#FF5733"
      },
      {
        "name": "personal",
        "usage_count": 189,
        "color": "#33FF57"
      }
    ],
    "popular_categories": [
      {
        "category_id": 1,
        "name": "Work",
        "color": "#FF5733",
        "task_count": 567
      }
    ]
  }
}
```

**Admin Can See:**
- ✅ Content created today/this week
- ✅ Average note length
- ✅ Average recording size
- ✅ Total storage used (bytes & MB)
- ✅ Most popular tags (top 10)
- ✅ Most popular categories (top 10)
- ✅ Usage patterns

---

### 3. 🔧 SYSTEM MANAGEMENT

#### **System Health**
```
GET /api/admin/system/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "database": "healthy",
    "uptime": 86400.5,
    "memory_usage": {
      "rss": 123456789,
      "heapTotal": 98765432,
      "heapUsed": 87654321,
      "external": 1234567
    },
    "active_sessions": 234,
    "unread_notifications": 567,
    "timestamp": "2026-01-31T12:00:00.000Z"
  }
}
```

**Admin Can See:**
- ✅ System status (operational/down)
- ✅ Database health
- ✅ Server uptime
- ✅ Memory usage
- ✅ Active sessions count
- ✅ Unread notifications count

---

#### **Activity Logs**
```
GET /api/admin/system/activity-logs?page=1&limit=50
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page (max: 100)
- `userId` - Filter by user
- `action` - Filter by action type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "note_created",
      "user": {
        "email": "user@example.com",
        "name": "John Doe"
      },
      "data": {
        "note_id": 123,
        "title": "Meeting Notes"
      },
      "timestamp": "2026-01-31T12:00:00.000Z"
    },
    {
      "type": "task_created",
      "user": {
        "email": "user@example.com",
        "name": "John Doe"
      },
      "data": {
        "task_id": 456,
        "title": "Complete Project",
        "status": "todo"
      },
      "timestamp": "2026-01-31T11:55:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234
  }
}
```

**Admin Can See:**
- ✅ Recent user activities
- ✅ Notes created
- ✅ Tasks created
- ✅ User information
- ✅ Timestamps
- ✅ Filter by user or action

---

#### **Clear Old Data**
```
POST /api/admin/system/clear-old-data
Body: { "days": 90 }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted_sessions": 123,
    "deleted_notifications": 456
  },
  "message": "Old data cleared successfully"
}
```

**Admin Can:**
- ✅ Delete expired sessions
- ✅ Delete old read notifications
- ✅ Specify retention period (days)
- ✅ Free up database space

---

## 🎯 Admin Use Cases

### Use Case 1: Monitor System Health
```bash
# Check system status
GET /api/admin/system/health

# View analytics
GET /api/admin/analytics/system

# Check AI usage and costs
GET /api/admin/analytics/ai-usage
```

### Use Case 2: Manage Problem Users
```bash
# Find user
GET /api/admin/users?search=spam@example.com

# Deactivate account
PUT /api/admin/users/123/status
Body: { "is_active": false }

# Or delete permanently
DELETE /api/admin/users/123
```

### Use Case 3: Promote User to Admin
```bash
# Get user details
GET /api/admin/users/456

# Make admin
PUT /api/admin/users/456/role
Body: { "is_admin": true }
```

### Use Case 4: Monitor AI Costs
```bash
# Check monthly AI usage
GET /api/admin/analytics/ai-usage?startDate=2026-01-01&endDate=2026-01-31

# Response includes:
# - Total API calls
# - Token usage
# - Estimated costs
```

### Use Case 5: Clean Up Database
```bash
# Delete old sessions and notifications (90+ days)
POST /api/admin/system/clear-old-data
Body: { "days": 90 }
```

---

## 🔒 Security Features

### Admin-Only Access
- ✅ All endpoints require `is_admin = true`
- ✅ Regular users get 403 Forbidden
- ✅ Middleware checks on every request

### Safety Mechanisms
- ❌ Admin cannot delete own account
- ❌ Admin cannot remove own admin role
- ❌ Bulk delete excludes own user ID
- ✅ All actions are logged

### Rate Limiting
- ✅ Same rate limits as regular API
- ✅ 100 requests per 15 minutes

---

## 📊 Admin Dashboard Metrics

### Key Metrics to Monitor:

1. **User Growth**
   - New users per day/week/month
   - Active vs inactive ratio
   - OAuth adoption rate

2. **Content Activity**
   - Notes/tasks/recordings created
   - Completion rates
   - Storage usage

3. **AI Usage**
   - API calls per day
   - Token consumption
   - Cost tracking

4. **System Health**
   - Database status
   - Server uptime
   - Memory usage
   - Active sessions

5. **User Engagement**
   - Most active users
   - Popular tags/categories
   - Focus time statistics

---

## 🛠️ Admin Tools

### Postman Collection

Import the admin endpoints to Postman:

```json
{
  "name": "Admin Panel",
  "item": [
    {
      "name": "Get All Users",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/admin/users"
      }
    }
  ]
}
```

### CLI Commands

```bash
# Create admin user
npm run create-admin

# Check system health
curl http://localhost:3001/api/admin/system/health \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📝 Best Practices

1. **Regular Monitoring**
   - Check system health daily
   - Monitor AI costs weekly
   - Review user activity monthly

2. **Data Cleanup**
   - Clear old data every 90 days
   - Monitor storage usage
   - Archive inactive users

3. **Security**
   - Limit admin accounts
   - Use strong passwords
   - Monitor admin activity logs

4. **Performance**
   - Watch database size
   - Monitor API response times
   - Check memory usage

---

## 🚨 Troubleshooting

### Cannot Access Admin Endpoints
```
Error: 403 Forbidden
Solution: Ensure user has is_admin = true in database
```

### High AI Costs
```
Check: GET /api/admin/analytics/ai-usage
Action: Review usage patterns, set limits if needed
```

### Database Growing Too Large
```
Check: GET /api/admin/analytics/content
Action: Run clear-old-data, archive old recordings
```

---

**Admin Panel is ready to use! 👨‍💼**
