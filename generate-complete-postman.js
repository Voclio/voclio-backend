import fs from 'fs';

const collection = {
  info: {
    name: "Voclio Complete API Collection 2026 - FINAL",
    description: "Complete API collection for Voclio - All 108+ APIs included",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    version: "3.0.0"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:3001/api", type: "string" },
    { key: "token", value: "", type: "string" },
    { key: "refresh_token", value: "", type: "string" },
    { key: "user_id", value: "", type: "string" },
    { key: "task_id", value: "", type: "string" },
    { key: "note_id", value: "", type: "string" },
    { key: "voice_id", value: "", type: "string" },
    { key: "category_id", value: "", type: "string" }
  ],
  item: []
};

// Helper function to create auth header
const authHeader = () => ({ key: "Authorization", value: "Bearer {{token}}" });
const jsonHeader = () => ({ key: "Content-Type", value: "application/json" });

// ==================== HEALTH & INFO ====================
collection.item.push({
  name: "🏥 Health & Info",
  item: [
    {
      name: "Health Check",
      request: {
        method: "GET",
        header: [],
        url: { raw: "{{baseUrl}}/health", host: ["{{baseUrl}}"], path: ["health"] }
      }
    },
    {
      name: "API Info",
      request: {
        method: "GET",
        header: [],
        url: { raw: "{{baseUrl}}/", host: ["{{baseUrl}}"], path: [""] }
      }
    }
  ]
});

// ==================== AUTHENTICATION ====================
collection.item.push({
  name: "🔐 Authentication",
  item: [
    {
      name: "Register",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 201) {",
            "    var jsonData = pm.response.json();",
            "    pm.environment.set('token', jsonData.data.tokens.access_token);",
            "    pm.environment.set('refresh_token', jsonData.data.tokens.refresh_token);",
            "    pm.environment.set('user_id', jsonData.data.user.id);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "user@example.com",
            password: "password123",
            name: "Test User",
            phone_number: "+1234567890"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/register", host: ["{{baseUrl}}"], path: ["auth", "register"] }
      }
    },
    {
      name: "Login",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 200) {",
            "    var jsonData = pm.response.json();",
            "    pm.environment.set('token', jsonData.data.tokens.access_token);",
            "    pm.environment.set('refresh_token', jsonData.data.tokens.refresh_token);",
            "    pm.environment.set('user_id', jsonData.data.user.id);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ email: "user@example.com", password: "password123" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
      }
    },
    {
      name: "Get Profile",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/auth/profile", host: ["{{baseUrl}}"], path: ["auth", "profile"] }
      }
    },
    {
      name: "Update Profile",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ name: "Updated Name", phone_number: "+9876543210" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/profile", host: ["{{baseUrl}}"], path: ["auth", "profile"] }
      }
    },
    {
      name: "Refresh Token",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ refresh_token: "{{refresh_token}}" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/refresh-token", host: ["{{baseUrl}}"], path: ["auth", "refresh-token"] }
      }
    },
    {
      name: "Send OTP",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ email: "user@example.com", type: "login" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/send-otp", host: ["{{baseUrl}}"], path: ["auth", "send-otp"] }
      }
    },
    {
      name: "Verify OTP",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ email: "user@example.com", otp_code: "123456", type: "login" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/verify-otp", host: ["{{baseUrl}}"], path: ["auth", "verify-otp"] }
      }
    },
    {
      name: "Resend OTP",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ email: "user@example.com", type: "login" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/resend-otp", host: ["{{baseUrl}}"], path: ["auth", "resend-otp"] }
      }
    },
    {
      name: "Forgot Password",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ email: "user@example.com" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/forgot-password", host: ["{{baseUrl}}"], path: ["auth", "forgot-password"] }
      }
    },
    {
      name: "Reset Password",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ token: "reset_token_here", new_password: "newpassword123" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/reset-password", host: ["{{baseUrl}}"], path: ["auth", "reset-password"] }
      }
    },
    {
      name: "Change Password",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ current_password: "password123", new_password: "newpassword123" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/change-password", host: ["{{baseUrl}}"], path: ["auth", "change-password"] }
      }
    },
    {
      name: "Google Login",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ id_token: "google_id_token_here" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/google", host: ["{{baseUrl}}"], path: ["auth", "google"] }
      }
    },
    {
      name: "Facebook Login",
      request: {
        method: "POST",
        header: [jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({ access_token: "facebook_access_token_here" }, null, 2)
        },
        url: { raw: "{{baseUrl}}/auth/facebook", host: ["{{baseUrl}}"], path: ["auth", "facebook"] }
      }
    },
    {
      name: "Logout",
      request: {
        method: "POST",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/auth/logout", host: ["{{baseUrl}}"], path: ["auth", "logout"] }
      }
    }
  ]
});

// ==================== TASKS ====================
collection.item.push({
  name: "✅ Tasks",
  item: [
    {
      name: "Get All Tasks",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/tasks?page=1&limit=20&status=pending&priority=high", 
          host: ["{{baseUrl}}"], 
          path: ["tasks"],
          query: [
            { key: "page", value: "1" },
            { key: "limit", value: "20" },
            { key: "status", value: "pending", disabled: true },
            { key: "priority", value: "high", disabled: true },
            { key: "category_id", value: "1", disabled: true },
            { key: "search", value: "", disabled: true }
          ]
        }
      }
    },
    {
      name: "Get Main Tasks Only",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tasks/main", host: ["{{baseUrl}}"], path: ["tasks", "main"] }
      }
    },
    {
      name: "Get Task Stats",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tasks/stats", host: ["{{baseUrl}}"], path: ["tasks", "stats"] }
      }
    },
    {
      name: "Get Tasks By Date",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/tasks/by-date?date=2026-01-31", 
          host: ["{{baseUrl}}"], 
          path: ["tasks", "by-date"],
          query: [{ key: "date", value: "2026-01-31" }]
        }
      }
    },
    {
      name: "Get Tasks By Category",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/tasks/by-category?category_id=1", 
          host: ["{{baseUrl}}"], 
          path: ["tasks", "by-category"],
          query: [{ key: "category_id", value: "1" }]
        }
      }
    },
    {
      name: "Get Task By ID",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tasks/{{task_id}}", host: ["{{baseUrl}}"], path: ["tasks", "{{task_id}}"] }
      }
    },
    {
      name: "Get Task With Subtasks",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tasks/{{task_id}}/with-subtasks", host: ["{{baseUrl}}"], path: ["tasks", "{{task_id}}", "with-subtasks"] }
      }
    },
    {
      name: "Get Subtasks",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tasks/{{task_id}}/subtasks", host: ["{{baseUrl}}"], path: ["tasks", "{{task_id}}", "subtasks"] }
      }
    },
    {
      name: "Create Task",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 201) {",
            "    var jsonData = pm.response.json();",
            "    pm.environment.set('task_id', jsonData.data.id);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Complete project documentation",
            description: "Write comprehensive API documentation",
            due_date: "2026-02-15",
            priority: "high",
            status: "pending",
            category_id: 1
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/tasks", host: ["{{baseUrl}}"], path: ["tasks"] }
      }
    },
    {
      name: "Bulk Create Tasks",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            tasks: [
              { title: "Task 1", priority: "high", due_date: "2026-02-01" },
              { title: "Task 2", priority: "medium", due_date: "2026-02-02" },
              { title: "Task 3", priority: "low", due_date: "2026-02-03" }
            ]
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/tasks/bulk", host: ["{{baseUrl}}"], path: ["tasks", "bulk"] }
      }
    },
    {
      name: "Create Subtask",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Subtask 1",
            description: "This is a subtask",
            priority: "medium"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/tasks/{{task_id}}/subtasks", host: ["{{baseUrl}}"], path: ["tasks", "{{task_id}}", "subtasks"] }
      }
    },
    {
      name: "Update Task",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Updated task title",
            status: "in_progress",
            priority: "urgent"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/tasks/{{task_id}}", host: ["{{baseUrl}}"], path: ["tasks", "{{task_id}}"] }
      }
    },
    {
      name: "Mark Task Complete",
      request: {
        method: "PUT",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tasks/{{task_id}}/complete", host: ["{{baseUrl}}"], path: ["tasks", "{{task_id}}", "complete"] }
      }
    },
    {
      name: "Delete Task",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tasks/{{task_id}}", host: ["{{baseUrl}}"], path: ["tasks", "{{task_id}}"] }
      }
    }
  ]
});

// ==================== NOTES ====================
collection.item.push({
  name: "📝 Notes",
  item: [
    {
      name: "Get All Notes",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/notes?page=1&limit=20&search=", 
          host: ["{{baseUrl}}"], 
          path: ["notes"],
          query: [
            { key: "page", value: "1" },
            { key: "limit", value: "20" },
            { key: "search", value: "", disabled: true }
          ]
        }
      }
    },
    {
      name: "Get Note By ID",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notes/{{note_id}}", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}"] }
      }
    },
    {
      name: "Create Note",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 201) {",
            "    var jsonData = pm.response.json();",
            "    pm.environment.set('note_id', jsonData.data.id);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Meeting Notes",
            content: "Important discussion points from today's meeting...",
            category_id: 1
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/notes", host: ["{{baseUrl}}"], path: ["notes"] }
      }
    },
    {
      name: "Update Note",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Updated Meeting Notes",
            content: "Updated content with more details..."
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/notes/{{note_id}}", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}"] }
      }
    },
    {
      name: "Delete Note",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notes/{{note_id}}", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}"] }
      }
    },
    {
      name: "AI Summarize Note",
      request: {
        method: "POST",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notes/{{note_id}}/summarize", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}", "summarize"] }
      }
    },
    {
      name: "AI Extract Tasks from Note",
      request: {
        method: "POST",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notes/{{note_id}}/extract-tasks", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}", "extract-tasks"] }
      }
    },
    {
      name: "Get Note Tags",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notes/{{note_id}}/tags", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}", "tags"] }
      }
    },
    {
      name: "Add Tags to Note",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            tag_ids: [1, 2, 3]
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/notes/{{note_id}}/tags", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}", "tags"] }
      }
    },
    {
      name: "Remove Tag from Note",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notes/{{note_id}}/tags/1", host: ["{{baseUrl}}"], path: ["notes", "{{note_id}}", "tags", "1"] }
      }
    }
  ]
});

// ==================== VOICE ====================
collection.item.push({
  name: "🎤 Voice",
  item: [
    {
      name: "🌟 Process Voice Complete (ONE-CLICK)",
      request: {
        method: "POST",
        header: [authHeader()],
        body: {
          mode: "formdata",
          formdata: [
            { key: "audio_file", type: "file", src: "" },
            { key: "language", value: "ar", type: "text" },
            { key: "extract_tasks", value: "true", type: "text" },
            { key: "extract_notes", value: "true", type: "text" },
            { key: "category_id", value: "1", type: "text" }
          ]
        },
        url: { raw: "{{baseUrl}}/voice/process-complete", host: ["{{baseUrl}}"], path: ["voice", "process-complete"] }
      }
    },
    {
      name: "Preview Extraction",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            transcription: "أريد إنشاء مهمة لإنهاء المشروع غداً",
            language: "ar"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/voice/preview-extraction", host: ["{{baseUrl}}"], path: ["voice", "preview-extraction"] }
      }
    },
    {
      name: "Create From Preview",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            voice_id: 1,
            tasks: [
              { title: "إنهاء المشروع", due_date: "2026-02-01", priority: "high" }
            ],
            notes: [],
            category_id: 1
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/voice/create-from-preview", host: ["{{baseUrl}}"], path: ["voice", "create-from-preview"] }
      }
    },
    {
      name: "Update Transcription",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            voice_id: 1,
            transcription: "Updated transcription text"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/voice/update-transcription", host: ["{{baseUrl}}"], path: ["voice", "update-transcription"] }
      }
    },
    {
      name: "Get All Voice Recordings",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/voice", host: ["{{baseUrl}}"], path: ["voice"] }
      }
    },
    {
      name: "Upload Voice Recording",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 201) {",
            "    var jsonData = pm.response.json();",
            "    pm.environment.set('voice_id', jsonData.data.id);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [authHeader()],
        body: {
          mode: "formdata",
          formdata: [
            { key: "audio_file", type: "file", src: "" },
            { key: "language", value: "ar", type: "text" }
          ]
        },
        url: { raw: "{{baseUrl}}/voice/upload", host: ["{{baseUrl}}"], path: ["voice", "upload"] }
      }
    },
    {
      name: "Transcribe Voice",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            voice_id: "{{voice_id}}",
            language: "ar"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/voice/transcribe", host: ["{{baseUrl}}"], path: ["voice", "transcribe"] }
      }
    },
    {
      name: "Create Note from Voice",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Voice Note",
            category_id: 1
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/voice/{{voice_id}}/create-note", host: ["{{baseUrl}}"], path: ["voice", "{{voice_id}}", "create-note"] }
      }
    },
    {
      name: "Create Tasks from Voice",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            category_id: 1
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/voice/{{voice_id}}/create-tasks", host: ["{{baseUrl}}"], path: ["voice", "{{voice_id}}", "create-tasks"] }
      }
    },
    {
      name: "Get Voice Recording Details",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/voice/{{voice_id}}", host: ["{{baseUrl}}"], path: ["voice", "{{voice_id}}"] }
      }
    },
    {
      name: "Delete Voice Recording",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/voice/{{voice_id}}", host: ["{{baseUrl}}"], path: ["voice", "{{voice_id}}"] }
      }
    }
  ]
});

// ==================== NOTIFICATIONS ====================
collection.item.push({
  name: "🔔 Notifications",
  item: [
    {
      name: "Get All Notifications",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/notifications?page=1&limit=20&is_read=false", 
          host: ["{{baseUrl}}"], 
          path: ["notifications"],
          query: [
            { key: "page", value: "1" },
            { key: "limit", value: "20" },
            { key: "is_read", value: "false", disabled: true }
          ]
        }
      }
    },
    {
      name: "Get Unread Count",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notifications/unread-count", host: ["{{baseUrl}}"], path: ["notifications", "unread-count"] }
      }
    },
    {
      name: "Get Notification By ID",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notifications/1", host: ["{{baseUrl}}"], path: ["notifications", "1"] }
      }
    },
    {
      name: "Mark as Read",
      request: {
        method: "PUT",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notifications/1/read", host: ["{{baseUrl}}"], path: ["notifications", "1", "read"] }
      }
    },
    {
      name: "Mark All as Read",
      request: {
        method: "PUT",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notifications/mark-all-read", host: ["{{baseUrl}}"], path: ["notifications", "mark-all-read"] }
      }
    },
    {
      name: "Delete Notification",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/notifications/1", host: ["{{baseUrl}}"], path: ["notifications", "1"] }
      }
    }
  ]
});

// ==================== REMINDERS ====================
collection.item.push({
  name: "⏰ Reminders",
  item: [
    {
      name: "Get All Reminders",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/reminders", host: ["{{baseUrl}}"], path: ["reminders"] }
      }
    },
    {
      name: "Get Upcoming Reminders",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/reminders/upcoming", host: ["{{baseUrl}}"], path: ["reminders", "upcoming"] }
      }
    },
    {
      name: "Get Reminder By ID",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/reminders/1", host: ["{{baseUrl}}"], path: ["reminders", "1"] }
      }
    },
    {
      name: "Create Reminder",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Team Meeting",
            description: "Weekly team sync",
            remind_at: "2026-02-01T10:00:00Z",
            type: "meeting"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/reminders", host: ["{{baseUrl}}"], path: ["reminders"] }
      }
    },
    {
      name: "Update Reminder",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Updated Meeting",
            remind_at: "2026-02-01T11:00:00Z"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/reminders/1", host: ["{{baseUrl}}"], path: ["reminders", "1"] }
      }
    },
    {
      name: "Snooze Reminder",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            snooze_minutes: 15
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/reminders/1/snooze", host: ["{{baseUrl}}"], path: ["reminders", "1", "snooze"] }
      }
    },
    {
      name: "Dismiss Reminder",
      request: {
        method: "PUT",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/reminders/1/dismiss", host: ["{{baseUrl}}"], path: ["reminders", "1", "dismiss"] }
      }
    },
    {
      name: "Delete Reminder",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/reminders/1", host: ["{{baseUrl}}"], path: ["reminders", "1"] }
      }
    }
  ]
});

// ==================== PRODUCTIVITY ====================
collection.item.push({
  name: "🎯 Productivity",
  item: [
    {
      name: "Start Focus Session",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            task_id: 1,
            duration_minutes: 25,
            session_type: "pomodoro"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/productivity/focus-sessions", host: ["{{baseUrl}}"], path: ["productivity", "focus-sessions"] }
      }
    },
    {
      name: "Get Focus Sessions",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/productivity/focus-sessions", host: ["{{baseUrl}}"], path: ["productivity", "focus-sessions"] }
      }
    },
    {
      name: "Update Focus Session",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            actual_duration: 25,
            notes: "Completed successfully"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/productivity/focus-sessions/1", host: ["{{baseUrl}}"], path: ["productivity", "focus-sessions", "1"] }
      }
    },
    {
      name: "End Focus Session",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/productivity/focus-sessions/1", host: ["{{baseUrl}}"], path: ["productivity", "focus-sessions", "1"] }
      }
    },
    {
      name: "Get Productivity Streak",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/productivity/streak", host: ["{{baseUrl}}"], path: ["productivity", "streak"] }
      }
    },
    {
      name: "Get Achievements",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/productivity/achievements", host: ["{{baseUrl}}"], path: ["productivity", "achievements"] }
      }
    },
    {
      name: "Get Productivity Summary",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/productivity/summary?period=week", 
          host: ["{{baseUrl}}"], 
          path: ["productivity", "summary"],
          query: [{ key: "period", value: "week" }]
        }
      }
    },
    {
      name: "Get AI Suggestions",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/productivity/suggestions", host: ["{{baseUrl}}"], path: ["productivity", "suggestions"] }
      }
    }
  ]
});

// ==================== CATEGORIES ====================
collection.item.push({
  name: "📁 Categories",
  item: [
    {
      name: "Get All Categories",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/categories", host: ["{{baseUrl}}"], path: ["categories"] }
      }
    },
    {
      name: "Get Category By ID",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/categories/{{category_id}}", host: ["{{baseUrl}}"], path: ["categories", "{{category_id}}"] }
      }
    },
    {
      name: "Get Category Stats",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/categories/{{category_id}}/stats", host: ["{{baseUrl}}"], path: ["categories", "{{category_id}}", "stats"] }
      }
    },
    {
      name: "Create Category",
      event: [{
        listen: "test",
        script: {
          exec: [
            "if (pm.response.code === 201) {",
            "    var jsonData = pm.response.json();",
            "    pm.environment.set('category_id', jsonData.data.id);",
            "}"
          ]
        }
      }],
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Work",
            color: "#FF5733",
            description: "Work related tasks"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/categories", host: ["{{baseUrl}}"], path: ["categories"] }
      }
    },
    {
      name: "Update Category",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Updated Work",
            color: "#33FF57"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/categories/{{category_id}}", host: ["{{baseUrl}}"], path: ["categories", "{{category_id}}"] }
      }
    },
    {
      name: "Delete Category",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/categories/{{category_id}}", host: ["{{baseUrl}}"], path: ["categories", "{{category_id}}"] }
      }
    }
  ]
});

// ==================== TAGS ====================
collection.item.push({
  name: "🏷️ Tags",
  item: [
    {
      name: "Get All Tags",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tags", host: ["{{baseUrl}}"], path: ["tags"] }
      }
    },
    {
      name: "Get Tag By ID",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tags/1", host: ["{{baseUrl}}"], path: ["tags", "1"] }
      }
    },
    {
      name: "Create Tag",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "urgent",
            color: "#FF0000"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/tags", host: ["{{baseUrl}}"], path: ["tags"] }
      }
    },
    {
      name: "Update Tag",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "very-urgent",
            color: "#FF3333"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/tags/1", host: ["{{baseUrl}}"], path: ["tags", "1"] }
      }
    },
    {
      name: "Delete Tag",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/tags/1", host: ["{{baseUrl}}"], path: ["tags", "1"] }
      }
    }
  ]
});

// ==================== SETTINGS ====================
collection.item.push({
  name: "⚙️ Settings",
  item: [
    {
      name: "Get Settings",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/settings", host: ["{{baseUrl}}"], path: ["settings"] }
      }
    },
    {
      name: "Update Settings",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            theme: "dark",
            language: "ar",
            timezone: "Asia/Riyadh"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/settings", host: ["{{baseUrl}}"], path: ["settings"] }
      }
    },
    {
      name: "Update Theme",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            theme: "dark"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/settings/theme", host: ["{{baseUrl}}"], path: ["settings", "theme"] }
      }
    },
    {
      name: "Update Language",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            language: "ar"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/settings/language", host: ["{{baseUrl}}"], path: ["settings", "language"] }
      }
    },
    {
      name: "Update Timezone",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            timezone: "Asia/Riyadh"
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/settings/timezone", host: ["{{baseUrl}}"], path: ["settings", "timezone"] }
      }
    },
    {
      name: "Get Notification Settings",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/settings/notifications", host: ["{{baseUrl}}"], path: ["settings", "notifications"] }
      }
    },
    {
      name: "Update Notification Settings",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email_notifications: true,
            push_notifications: true,
            task_reminders: true
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/settings/notifications", host: ["{{baseUrl}}"], path: ["settings", "notifications"] }
      }
    }
  ]
});

// ==================== CALENDAR ====================
collection.item.push({
  name: "📅 Calendar",
  item: [
    {
      name: "Get Calendar Events",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/calendar/events?start_date=2026-01-01&end_date=2026-12-31", 
          host: ["{{baseUrl}}"], 
          path: ["calendar", "events"],
          query: [
            { key: "start_date", value: "2026-01-01" },
            { key: "end_date", value: "2026-12-31" }
          ]
        }
      }
    },
    {
      name: "Get Month Calendar",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/calendar/month/2026/2", host: ["{{baseUrl}}"], path: ["calendar", "month", "2026", "2"] }
      }
    },
    {
      name: "Get Day Events",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/calendar/day/2026-02-01", host: ["{{baseUrl}}"], path: ["calendar", "day", "2026-02-01"] }
      }
    }
  ]
});

// ==================== DASHBOARD ====================
collection.item.push({
  name: "📊 Dashboard",
  item: [
    {
      name: "Get Dashboard Stats",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/dashboard/stats", host: ["{{baseUrl}}"], path: ["dashboard", "stats"] }
      }
    },
    {
      name: "Get Quick Stats",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/dashboard/quick-stats", host: ["{{baseUrl}}"], path: ["dashboard", "quick-stats"] }
      }
    }
  ]
});

// ==================== ADMIN ====================
collection.item.push({
  name: "👨‍💼 Admin",
  item: [
    {
      name: "Get All Users",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/admin/users?page=1&limit=20&status=all&sortBy=created_at&order=DESC", 
          host: ["{{baseUrl}}"], 
          path: ["admin", "users"],
          query: [
            { key: "page", value: "1" },
            { key: "limit", value: "20" },
            { key: "status", value: "all" },
            { key: "search", value: "", disabled: true },
            { key: "sortBy", value: "created_at" },
            { key: "order", value: "DESC" }
          ]
        }
      }
    },
    {
      name: "Get User Details",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/admin/users/1", host: ["{{baseUrl}}"], path: ["admin", "users", "1"] }
      }
    },
    {
      name: "Update User Status",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            is_active: false
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/admin/users/1/status", host: ["{{baseUrl}}"], path: ["admin", "users", "1", "status"] }
      }
    },
    {
      name: "Update User Role",
      request: {
        method: "PUT",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            is_admin: true
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/admin/users/1/role", host: ["{{baseUrl}}"], path: ["admin", "users", "1", "role"] }
      }
    },
    {
      name: "Delete User",
      request: {
        method: "DELETE",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/admin/users/1", host: ["{{baseUrl}}"], path: ["admin", "users", "1"] }
      }
    },
    {
      name: "Bulk Delete Users",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            userIds: [1, 2, 3]
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/admin/users/bulk-delete", host: ["{{baseUrl}}"], path: ["admin", "users", "bulk-delete"] }
      }
    },
    {
      name: "Get System Analytics",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/admin/analytics/system", host: ["{{baseUrl}}"], path: ["admin", "analytics", "system"] }
      }
    },
    {
      name: "Get AI Usage Stats",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/admin/analytics/ai-usage?startDate=2026-01-01&endDate=2026-12-31", 
          host: ["{{baseUrl}}"], 
          path: ["admin", "analytics", "ai-usage"],
          query: [
            { key: "startDate", value: "2026-01-01", disabled: true },
            { key: "endDate", value: "2026-12-31", disabled: true },
            { key: "userId", value: "1", disabled: true }
          ]
        }
      }
    },
    {
      name: "Get Content Stats",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/admin/analytics/content", host: ["{{baseUrl}}"], path: ["admin", "analytics", "content"] }
      }
    },
    {
      name: "Get System Health",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { raw: "{{baseUrl}}/admin/system/health", host: ["{{baseUrl}}"], path: ["admin", "system", "health"] }
      }
    },
    {
      name: "Get Activity Logs",
      request: {
        method: "GET",
        header: [authHeader()],
        url: { 
          raw: "{{baseUrl}}/admin/system/activity-logs?page=1&limit=50", 
          host: ["{{baseUrl}}"], 
          path: ["admin", "system", "activity-logs"],
          query: [
            { key: "page", value: "1" },
            { key: "limit", value: "50" },
            { key: "userId", value: "1", disabled: true },
            { key: "action", value: "", disabled: true }
          ]
        }
      }
    },
    {
      name: "Clear Old Data",
      request: {
        method: "POST",
        header: [authHeader(), jsonHeader()],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            days: 90
          }, null, 2)
        },
        url: { raw: "{{baseUrl}}/admin/system/clear-old-data", host: ["{{baseUrl}}"], path: ["admin", "system", "clear-old-data"] }
      }
    }
  ]
});

// Write to file
fs.writeFileSync(
  'Voclio_Complete_API_Final.postman_collection.json',
  JSON.stringify(collection, null, 2)
);

console.log('\n✅ Complete Postman Collection Generated Successfully!');
console.log('📁 File: Voclio_Complete_API_Final.postman_collection.json');
console.log('\n📊 Summary:');
console.log('   - Health & Info: 2 APIs');
console.log('   - Authentication: 14 APIs');
console.log('   - Tasks: 14 APIs');
console.log('   - Notes: 10 APIs');
console.log('   - Voice: 11 APIs');
console.log('   - Notifications: 6 APIs');
console.log('   - Reminders: 8 APIs');
console.log('   - Productivity: 8 APIs');
console.log('   - Categories: 6 APIs');
console.log('   - Tags: 5 APIs');
console.log('   - Settings: 7 APIs');
console.log('   - Calendar: 3 APIs');
console.log('   - Dashboard: 2 APIs');
console.log('   - Admin: 12 APIs');
console.log('\n🎯 Total: 108 APIs');
console.log('\n📝 Import this file into Postman to test all APIs!');
