# 🎙️ Voice-to-Everything API Documentation

## Overview
The Voice-to-Everything feature allows users to record voice notes and automatically convert them into tasks, subtasks, notes, and calendar events using AI.

---

## 🚀 Quick Start - One-Click Endpoint

### **POST** `/api/voice/process-complete`

This is the **main endpoint** that does everything in one request:
1. ✅ Upload audio file
2. ✅ Transcribe to text (AssemblyAI)
3. ✅ Extract tasks & notes (AI)
4. ✅ Create tasks with subtasks
5. ✅ Create notes with tags
6. ✅ Link to calendar automatically

#### Request

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
audio: <audio_file>              (required) - MP3, WAV, M4A, OGG, WEBM
language: "ar"                   (optional) - Default: "ar" (Arabic)
category_id: 1                   (optional) - Category for tasks
auto_create_tasks: true          (optional) - Default: true
auto_create_notes: true          (optional) - Default: true
```

#### Example Request (cURL)
```bash
curl -X POST http://localhost:3001/api/voice/process-complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@recording.mp3" \
  -F "language=ar" \
  -F "category_id=1" \
  -F "auto_create_tasks=true" \
  -F "auto_create_notes=true"
```

#### Response (Success - 201)
```json
{
  "success": true,
  "message": "Voice processed successfully",
  "data": {
    "recording_id": 123,
    "transcription": "محتاج أخلص البروجكت بتاع الشغل بكرة الساعة 5...",
    "extracted": {
      "tasks": [
        {
          "title": "إنهاء البروجكت بتاع الشغل",
          "description": "محتاج أخلص البروجكت",
          "priority": "high",
          "due_date": "2026-02-01T17:00:00Z",
          "subtasks": []
        },
        {
          "title": "التسوق من السوبر ماركت",
          "description": "شراء مستلزمات",
          "priority": "medium",
          "due_date": null,
          "subtasks": [
            { "title": "شراء لبن" },
            { "title": "شراء خبز" },
            { "title": "شراء جبنة" }
          ]
        }
      ],
      "notes": [
        {
          "title": "أفكار المشروع الجديد",
          "content": "محتاج أكتب نوت عن الأفكار...",
          "tags": ["ideas", "project"]
        }
      ]
    },
    "created": {
      "tasks": [
        {
          "task_id": 1,
          "title": "إنهاء البروجكت بتاع الشغل",
          "description": "محتاج أخلص البروجكت",
          "priority": "high",
          "status": "todo",
          "due_date": "2026-02-01T17:00:00Z",
          "category_id": 1,
          "subtasks": [],
          "subtasks_count": 0,
          "subtasks_completed": 0,
          "created_at": "2026-01-31T..."
        },
        {
          "task_id": 2,
          "title": "التسوق من السوبر ماركت",
          "priority": "medium",
          "subtasks": [
            {
              "task_id": 3,
              "title": "شراء لبن",
              "parent_task_id": 2,
              "status": "todo"
            },
            {
              "task_id": 4,
              "title": "شراء خبز",
              "parent_task_id": 2,
              "status": "todo"
            }
          ],
          "subtasks_count": 3,
          "subtasks_completed": 0
        }
      ],
      "notes": [
        {
          "note_id": 1,
          "title": "أفكار المشروع الجديد",
          "content": "محتاج أكتب نوت عن الأفكار الجديدة للمشروع",
          "voice_recording_id": 123,
          "tags": ["ideas", "project"],
          "created_at": "2026-01-31T..."
        }
      ]
    }
  }
}
```

---

## 🤖 AI Extraction Features

### Date & Time Extraction (Arabic Support)

The AI understands Arabic date/time expressions:

| Arabic Expression | English | Result |
|------------------|---------|--------|
| اليوم | Today | Current date |
| بكرة / بكره / غداً | Tomorrow | Next day |
| بعد بكرة | Day after tomorrow | +2 days |
| الأسبوع الجاي | Next week | +7 days |
| الشهر الجاي | Next month | +30 days |
| يوم السبت | Saturday | Next Saturday |
| يوم الأحد | Sunday | Next Sunday |
| الساعة 5 | At 5 | 5:00 PM |
| 3 مساءً | 3 PM | 3:00 PM |
| 10 صباحاً | 10 AM | 10:00 AM |

### Priority Detection

| Keywords | Priority |
|----------|----------|
| مهم، ضروري، عاجل، لازم، حالاً | **high** |
| ممكن، لو فاضي، مش مستعجل | **low** |
| (default) | **medium** |

### Subtask Extraction

The AI automatically detects lists and creates subtasks:

**Example:**
```
Voice: "محتاج أشتري لبن وخبز وجبنة وزبادي"
```

**Result:**
```json
{
  "title": "التسوق",
  "subtasks": [
    { "title": "شراء لبن" },
    { "title": "شراء خبز" },
    { "title": "شراء جبنة" },
    { "title": "شراء زبادي" }
  ]
}
```

### Note Detection

The AI creates notes when it detects:
- Keywords: "نوت", "ملاحظة", "فكرة", "محتاج أكتب"
- General information (not actionable tasks)
- Ideas or thoughts

---

## 📅 Calendar Integration

All tasks with `due_date` are automatically available in the calendar endpoints:

### Get Month Calendar
```
GET /api/calendar/month/:year/:month
```

### Get Day Events
```
GET /api/calendar/day/:date
```

### Get Date Range Events
```
GET /api/calendar/events?start_date=2026-02-01&end_date=2026-02-28
```

---

## 🔄 Alternative Workflow (Step-by-Step)

If you prefer manual control, you can use individual endpoints:

### 1. Upload Audio
```
POST /api/voice/upload
```

### 2. Transcribe
```
POST /api/voice/transcribe
Body: { "recording_id": 123, "language": "ar" }
```

### 3. Create Tasks
```
POST /api/voice/:id/create-tasks
Body: { "auto_create": true, "category_id": 1 }
```

### 4. Create Note
```
POST /api/voice/:id/create-note
Body: { "title": "My Note", "tags": ["tag1"] }
```

---

## 📊 Example Use Cases

### Use Case 1: Daily Planning
**Voice Input:**
```
"محتاج أخلص التقرير بكرة الساعة 3
وكمان عندي ميتينج مع المدير يوم الأحد الساعة 10 صباحاً
ولازم أراجع الإيميلات المهمة اليوم"
```

**Result:**
- ✅ 3 tasks created
- ✅ Due dates extracted (tomorrow 3 PM, Sunday 10 AM, today)
- ✅ Priority set to "high" for "لازم"
- ✅ All linked to calendar

### Use Case 2: Shopping List
**Voice Input:**
```
"محتاج أروح السوبر ماركت أشتري لبن وخبز وجبنة وبيض وزبادي"
```

**Result:**
- ✅ 1 main task: "التسوق من السوبر ماركت"
- ✅ 5 subtasks created automatically
- ✅ Priority: medium

### Use Case 3: Ideas & Notes
**Voice Input:**
```
"عندي فكرة للمشروع الجديد
ممكن نعمل feature للتذكيرات الذكية
ونضيف integration مع Google Calendar"
```

**Result:**
- ✅ 1 note created: "فكرة للمشروع الجديد"
- ✅ Tags: ["ideas", "project", "features"]
- ✅ Full content saved

---

## ⚙️ Configuration

### Environment Variables
```env
# AI Services
OPENROUTER_API_KEY=sk-or-v1-xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
ASSEMBLYAI_API_KEY=xxxxx

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### Supported Audio Formats
- MP3 (audio/mpeg)
- WAV (audio/wav)
- M4A (audio/m4a)
- OGG (audio/ogg)
- WEBM (audio/webm)

### Max File Size
- Default: 10 MB
- Configurable via `MAX_FILE_SIZE` env variable

---

## 🎯 Best Practices

1. **Clear Speech**: Speak clearly for better transcription
2. **Structured Input**: Mention dates, times, and priorities explicitly
3. **Lists**: Use "و" (and) to separate items for automatic subtask creation
4. **Keywords**: Use "مهم", "ضروري" for high priority tasks
5. **Notes**: Say "نوت" or "ملاحظة" to create notes instead of tasks

---

## 🐛 Troubleshooting

### Transcription Failed
- Check AssemblyAI API key in `.env`
- Verify audio file format is supported
- Ensure file size is under 10 MB

### AI Extraction Failed
- Check OpenRouter or Gemini API key
- Verify API quota/limits
- Check server logs for detailed error

### Tasks Not Created
- Set `auto_create_tasks=true` in request
- Verify transcription completed successfully
- Check if AI extracted any tasks

---

## 📝 Notes

- Transcription typically takes 5-30 seconds depending on audio length
- AI extraction is optimized for Arabic language
- All created tasks are automatically linked to calendar
- Subtasks inherit parent task's category and user

---

## 🔗 Related Endpoints

- **Tasks**: `/api/tasks`
- **Notes**: `/api/notes`
- **Calendar**: `/api/calendar`
- **Dashboard**: `/api/dashboard`

---

**Happy Voice Recording! 🎤**
