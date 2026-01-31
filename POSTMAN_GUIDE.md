# 📮 Postman Collection Guide

## 🚀 Quick Start

### 1. Generate Collection
```bash
make postman
# or
node generate-postman-collection.js
```

### 2. Import to Postman
1. Open Postman
2. Click **Import** button
3. Select file: `Voclio_Complete_APIs_2026.postman_collection.json`
4. Click **Import**

### 3. Setup Environment
1. Create new environment in Postman
2. Add variables:
   - `baseUrl`: `http://localhost:3001/api`
   - `token`: (will be auto-filled after login)
   - `refresh_token`: (will be auto-filled after login)

---

## 📋 Available Collections

### Current Files
- `Voclio_API_Complete.postman_collection.json` - Original collection
- `Voclio_Complete_API_Collection.postman_collection.json` - Updated collection
- `Voclio_Complete_APIs_2026.postman_collection.json` - Latest (Generated)

**Recommended:** Use `Voclio_Complete_APIs_2026.postman_collection.json`

---

## 🔑 Authentication Flow

### Step 1: Register or Login
```
POST /api/auth/register
or
POST /api/auth/login
```

The collection will automatically:
- Extract `access_token` from response
- Save it to `{{token}}` variable
- Save `refresh_token` to `{{refresh_token}}` variable

### Step 2: Use Protected Endpoints
All protected endpoints use:
```
Authorization: Bearer {{token}}
```

This is automatically added to requests.

---

## 📁 Collection Structure

```
Voclio Complete API Collection 2026
├── Health & Info
│   ├── Health Check
│   └── API Info
├── Authentication (13 endpoints)
│   ├── Register
│   ├── Login
│   ├── Get Profile
│   ├── Update Profile
│   ├── Refresh Token
│   ├── Send OTP
│   ├── Verify OTP
│   ├── Resend OTP
│   ├── Forgot Password
│   ├── Reset Password
│   ├── Change Password
│   ├── Google Login
│   ├── Facebook Login
│   └── Logout
├── Tasks (13 endpoints)
├── Notes (9 endpoints)
├── Voice (10 endpoints)
├── Notifications (6 endpoints)
├── Reminders (7 endpoints)
├── Productivity (7 endpoints)
├── Categories (6 endpoints)
├── Tags (5 endpoints)
├── Settings (7 endpoints)
├── Calendar (3 endpoints)
├── Dashboard (2 endpoints)
└── Admin (13 endpoints)
```

---

## 🎯 Testing Workflow

### 1. Authentication Test
```
1. Register → Creates account + auto-saves token
2. Login → Gets token + auto-saves
3. Get Profile → Verifies token works
```

### 2. Tasks Test
```
1. Create Task → POST /api/tasks
2. Get All Tasks → GET /api/tasks
3. Update Task → PUT /api/tasks/:id
4. Mark Complete → PUT /api/tasks/:id/complete
5. Delete Task → DELETE /api/tasks/:id
```

### 3. Voice Processing Test
```
1. Upload Voice → POST /api/voice/upload
2. Transcribe → POST /api/voice/transcribe
3. Create Tasks → POST /api/voice/:id/create-tasks
```

### 4. Complete Voice Flow (ONE-CLICK)
```
POST /api/voice/process-complete
- Upload audio file
- Auto transcribe
- Auto extract tasks/notes
- Auto create in database
```

---

## 🔧 Environment Variables

### Required Variables
```
baseUrl: http://localhost:3001/api
token: (auto-filled after login)
refresh_token: (auto-filled after login)
```

### Optional Variables
```
user_id: (for testing specific user)
task_id: (for testing specific task)
note_id: (for testing specific note)
voice_id: (for testing specific recording)
```

---

## 📝 Example Requests

### Register User
```json
POST {{baseUrl}}/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "phone_number": "+1234567890"
}
```

### Create Task
```json
POST {{baseUrl}}/tasks
Authorization: Bearer {{token}}
{
  "title": "Complete project",
  "description": "Finish API documentation",
  "due_date": "2026-02-01",
  "priority": "high",
  "category_id": 1
}
```

### Upload & Process Voice
```
POST {{baseUrl}}/voice/process-complete
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

audio_file: [select file]
language: ar
extract_tasks: true
extract_notes: true
category_id: 1
```

---

## 🐛 Troubleshooting

### Issue 1: Token Not Saved
**Solution:** Check if test script is enabled in Login request:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set('token', jsonData.data.tokens.access_token);
}
```

### Issue 2: 401 Unauthorized
**Solutions:**
1. Login again to get fresh token
2. Check if token is set in environment
3. Use Refresh Token endpoint

### Issue 3: 404 Not Found
**Solutions:**
1. Check if server is running: `make status`
2. Verify baseUrl is correct
3. Check endpoint path

### Issue 4: Connection Refused
**Solutions:**
1. Start server: `make dev` or `make start`
2. Check if port 3001 is available
3. Verify database is running

---

## 🎨 Customization

### Add New Request
1. Right-click on folder
2. Select "Add Request"
3. Configure method, URL, headers, body
4. Save

### Add Test Scripts
```javascript
// Auto-save response data
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.environment.set('task_id', jsonData.data.task.task_id);
});
```

### Add Pre-request Scripts
```javascript
// Generate dynamic data
pm.environment.set('timestamp', Date.now());
pm.environment.set('random_email', 'user' + Date.now() + '@example.com');
```

---

## 📊 Testing Tips

### 1. Use Collection Runner
- Run entire collection at once
- Test all endpoints automatically
- Generate test reports

### 2. Use Variables
- Store IDs from responses
- Reuse in subsequent requests
- Keep tests dynamic

### 3. Use Test Scripts
- Validate responses
- Check status codes
- Verify data structure

### 4. Use Environments
- Development: `http://localhost:3001/api`
- Staging: `https://staging.voclio.com/api`
- Production: `https://api.voclio.com/api`

---

## 🔗 Related Documentation

- [ALL_APIS_COMPLETE.md](./ALL_APIS_COMPLETE.md) - Complete API list
- [API_COMPLETE_REFERENCE.md](./API_COMPLETE_REFERENCE.md) - Detailed API docs
- [MOBILE_APP_API_GUIDE.md](./MOBILE_APP_API_GUIDE.md) - Mobile integration
- [QUICK_START.md](./QUICK_START.md) - Getting started

---

## 📞 Support

For issues or questions:
1. Check [ALL_APIS_COMPLETE.md](./ALL_APIS_COMPLETE.md)
2. Check [API_COMPLETE_REFERENCE.md](./API_COMPLETE_REFERENCE.md)
3. Run `make status` to check server
4. Check server logs

---

**Last Updated:** January 31, 2026
**Collection Version:** 2.0.0
**Total Endpoints:** 100+
