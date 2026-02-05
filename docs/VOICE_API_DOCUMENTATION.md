# 🎤 Voice APIs Documentation - توثيق واجهات برمجة الصوت

## نظرة عامة | Overview

تتيح لك Voice APIs تحويل التسجيلات الصوتية إلى نصوص، ثم استخراج المهام والملاحظات منها تلقائياً باستخدام الذكاء الاصطناعي.

Voice APIs allow you to convert voice recordings to text, then automatically extract tasks and notes using AI.

---

## 🌟 الميزات الرئيسية | Key Features

### ✅ دعم اللهجات العربية المتعددة
- **اللهجة المصرية**: عايز، محتاج، بكرة، النهاردة
- **اللهجة السعودية/الخليجية**: أبغى، باجر، الحين
- **اللهجة الشامية**: بدي، بكرا، هلق
- **اللهجة المغربية**: بغيت، غدا

### 🧠 استخراج ذكي للمهام
- فهم الأولويات: مهم جداً = high، عادي = medium، ممكن = low
- استخراج التواريخ: بكرة، الأسبوع الجاي، يوم السبت
- استخراج الأوقات: الساعة 3 العصر، الصبح، المغرب
- استخراج المهام الفرعية: "محتاج أشتري لبن وخبز وجبنة" = 3 subtasks

### 📝 استخراج ذكي للملاحظات
- التعرف على الملاحظات: "نوت"، "ملاحظة"، "فكرة"
- استخراج التاجات تلقائياً من السياق
- التفريق بين المهام والملاحظات

---

## 🔐 Authentication

جميع الـ APIs تحتاج إلى Authentication Token في الـ Header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📡 API Endpoints

### 1️⃣ **ONE-CLICK: معالجة صوتية كاملة**
**الأسهل والأسرع - كل شيء في خطوة واحدة!**

```http
POST /api/voice/process-complete
Content-Type: multipart/form-data
```

**Request Body:**
```javascript
{
  audio_file: File,                    // ملف الصوت (MP3, WAV, M4A, OGG, WEBM)
  language: "ar",                      // اللغة (ar, en, fr, es, de, etc.)
  category_id: 1,                      // معرف الفئة (اختياري)
  auto_create_tasks: true,             // إنشاء المهام تلقائياً
  auto_create_notes: true              // إنشاء الملاحظات تلقائياً
}
```

**Response:**
```json
{
  "success": true,
  "message": "Voice processed successfully",
  "data": {
    "recording_id": 123,
    "transcription": "عايز أشتري لبن وخبز بكرة الصبح",
    "extracted": {
      "tasks": [
        {
          "title": "شراء مستلزمات",
          "description": "شراء لبن وخبز من السوبر ماركت",
          "priority": "medium",
          "due_date": "2026-02-06T09:00:00",
          "subtasks": [
            {"title": "شراء لبن"},
            {"title": "شراء خبز"}
          ]
        }
      ],
      "notes": []
    },
    "created": {
      "tasks": [/* المهام المُنشأة */],
      "notes": [/* الملاحظات المُنشأة */]
    }
  }
}
```

**مثال باستخدام cURL:**
```bash
curl -X POST https://api.voclio.app/api/voice/process-complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio_file=@recording.mp3" \
  -F "language=ar" \
  -F "auto_create_tasks=true" \
  -F "auto_create_notes=true"
```

---

### 2️⃣ **رفع تسجيل صوتي**

```http
POST /api/voice/upload
Content-Type: multipart/form-data
```

**Request Body:**
```javascript
{
  audio_file: File,        // ملف الصوت
  title: "تسجيل 1"        // عنوان اختياري
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recording uploaded successfully",
  "data": {
    "recording": {
      "recording_id": 123,
      "file_size": 1024000,
      "format": "audio/mpeg",
      "created_at": "2026-02-05T10:00:00Z"
    }
  }
}
```

---

### 3️⃣ **تحويل الصوت إلى نص (Transcription)**

```http
POST /api/voice/transcribe
Content-Type: application/json
```

**Request Body:**
```json
{
  "recording_id": 123,
  "language": "ar"
}
```

**Supported Languages:**
- `ar` - العربية (Arabic)
- `en` - English
- `fr` - Français
- `es` - Español
- `de` - Deutsch
- `it` - Italiano
- `pt` - Português
- `ru` - Русский
- `ja` - 日本語
- `ko` - 한국어
- `zh` - 中文
- `hi` - हिन्दी
- `tr` - Türkçe

**Response:**
```json
{
  "success": true,
  "message": "Transcription completed successfully",
  "data": {
    "recording_id": 123,
    "transcription": "عايز أشتري لبن وخبز بكرة الصبح",
    "language": "ar"
  }
}
```

---

### 4️⃣ **معاينة الاستخراج (Preview)**
**للمراجعة قبل الإنشاء**

```http
POST /api/voice/preview-extraction
Content-Type: application/json
```

**Request Body:**
```json
{
  "recording_id": 123,
  "extraction_type": "both"  // "tasks" | "notes" | "both"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recording_id": 123,
    "transcription": "عايز أشتري لبن وخبز بكرة. نوت: لازم أركز على الأرقام",
    "preview": {
      "tasks": [
        {
          "title": "شراء مستلزمات",
          "description": "شراء لبن وخبز",
          "priority": "medium",
          "due_date": "2026-02-06T09:00:00",
          "subtasks": [
            {"title": "شراء لبن"},
            {"title": "شراء خبز"}
          ]
        }
      ],
      "notes": [
        {
          "title": "ملاحظة مهمة",
          "content": "لازم أركز على الأرقام",
          "tags": ["ملاحظة", "مهم"]
        }
      ]
    },
    "message": "Preview generated. Use create-from-preview endpoint to save."
  }
}
```

---

### 5️⃣ **إنشاء من المعاينة**

```http
POST /api/voice/create-from-preview
Content-Type: application/json
```

**Request Body:**
```json
{
  "recording_id": 123,
  "tasks": [
    {
      "title": "شراء مستلزمات",
      "description": "شراء لبن وخبز",
      "priority": "medium",
      "due_date": "2026-02-06T09:00:00",
      "subtasks": [
        {"title": "شراء لبن"},
        {"title": "شراء خبز"}
      ]
    }
  ],
  "notes": [
    {
      "title": "ملاحظة مهمة",
      "content": "لازم أركز على الأرقام",
      "tags": ["ملاحظة", "مهم"]
    }
  ],
  "category_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Items created successfully",
  "data": {
    "recording_id": 123,
    "created": {
      "tasks": [/* المهام المُنشأة مع subtasks */],
      "notes": [/* الملاحظات المُنشأة مع tags */]
    }
  }
}
```

---

### 6️⃣ **تعديل النص المُستخرج**

```http
PUT /api/voice/update-transcription
Content-Type: application/json
```

**Request Body:**
```json
{
  "recording_id": 123,
  "transcription": "النص المُعدّل بعد التصحيح"
}
```

---

### 7️⃣ **إنشاء ملاحظة من تسجيل**

```http
POST /api/voice/:id/create-note
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "ملاحظة صوتية",
  "tags": [1, 2, 3]
}
```

---

### 8️⃣ **إنشاء مهام من تسجيل**

```http
POST /api/voice/:id/create-tasks
Content-Type: application/json
```

**Request Body:**
```json
{
  "auto_create": true,
  "category_id": 1
}
```

---

### 9️⃣ **الحصول على جميع التسجيلات**

```http
GET /api/voice?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recordings": [
      {
        "recording_id": 123,
        "file_size": 1024000,
        "format": "audio/mpeg",
        "transcription_text": "...",
        "created_at": "2026-02-05T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### 🔟 **الحصول على تفاصيل تسجيل**

```http
GET /api/voice/:id
```

---

### 1️⃣1️⃣ **حذف تسجيل**

```http
DELETE /api/voice/:id
```

---

## 🎯 أمثلة عملية | Practical Examples

### مثال 1: تسجيل صوتي بسيط

**الصوت:**
> "عايز أشتري لبن وخبز وجبنة بكرة الصبح"

**النتيجة:**
```json
{
  "tasks": [
    {
      "title": "شراء مستلزمات",
      "priority": "medium",
      "due_date": "2026-02-06T09:00:00",
      "subtasks": [
        {"title": "شراء لبن"},
        {"title": "شراء خبز"},
        {"title": "شراء جبنة"}
      ]
    }
  ]
}
```

---

### مثال 2: مهمة عاجلة مع وقت محدد

**الصوت:**
> "مهم جداً أتصل بالدكتور الساعة 3 العصر"

**النتيجة:**
```json
{
  "tasks": [
    {
      "title": "الاتصال بالدكتور",
      "priority": "high",
      "due_date": "2026-02-05T15:00:00"
    }
  ]
}
```

---

### مثال 3: مهام وملاحظات معاً

**الصوت:**
> "محتاج أجهز العرض التقديمي للاجتماع يوم الأحد. نوت: لازم أركز على الأرقام والإحصائيات، المدير بيحب الأرقام"

**النتيجة:**
```json
{
  "tasks": [
    {
      "title": "تجهيز العرض التقديمي",
      "priority": "high",
      "due_date": "2026-02-09"
    }
  ],
  "notes": [
    {
      "title": "ملاحظة عن العرض التقديمي",
      "content": "لازم أركز على الأرقام والإحصائيات، المدير بيحب الأرقام",
      "tags": ["عرض_تقديمي", "اجتماع", "ملاحظة"]
    }
  ]
}
```

---

### مثال 4: مهمة بدون تاريخ محدد

**الصوت:**
> "ناوي أشتغل على المشروع الجديد"

**النتيجة:**
```json
{
  "tasks": [
    {
      "title": "العمل على المشروع الجديد",
      "priority": "medium",
      "due_date": null
    }
  ]
}
```

---

## 🧪 اختبار الـ APIs | Testing

### باستخدام Postman:

1. استيراد Collection من: `Voclio_API_Collection.postman_collection.json`
2. إضافة Token في Environment Variables
3. تجربة الـ endpoints

### باستخدام cURL:

```bash
# 1. رفع تسجيل
curl -X POST https://api.voclio.app/api/voice/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio_file=@recording.mp3"

# 2. تحويل إلى نص
curl -X POST https://api.voclio.app/api/voice/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recording_id": 123, "language": "ar"}'

# 3. معاينة الاستخراج
curl -X POST https://api.voclio.app/api/voice/preview-extraction \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recording_id": 123, "extraction_type": "both"}'
```

---

## 🎨 فهم اللهجات العربية | Arabic Dialects Understanding

### اللهجة المصرية:
- **عايز** = أريد
- **محتاج** = أحتاج
- **بكرة** = غداً
- **النهاردة** = اليوم
- **دلوقتي** = الآن

### اللهجة السعودية/الخليجية:
- **أبغى** = أريد
- **ودي** = أريد
- **باجر** = غداً
- **الحين** = الآن

### اللهجة الشامية:
- **بدي** = أريد
- **بكرا** = غداً
- **هلق** = الآن

---

## ⏰ فهم الأوقات | Time Understanding

### أوقات اليوم:
- **الفجر** = 5:00 AM
- **الصبح/الصباح** = 9:00 AM
- **الضحى** = 10:00 AM
- **الظهر** = 12:00 PM
- **العصر** = 3:00 PM
- **المغرب** = 6:00 PM
- **العشاء** = 8:00 PM
- **الليل** = 9:00 PM

### تواريخ نسبية:
- **اليوم/النهاردة** = Today
- **بكرة/باجر** = Tomorrow
- **بعد بكرة** = Day after tomorrow
- **الأسبوع الجاي** = Next week
- **الشهر الجاي** = Next month

---

## 🎯 الأولويات | Priorities

### High Priority:
مهم جداً، ضروري، عاجل، لازم، حالاً، فوراً، مستعجل، حرج، طارئ

### Medium Priority:
مهم، محتاج، لازم، يفضل، مطلوب

### Low Priority:
ممكن، لو فاضي، مش مستعجل، عادي، على راحتك

---

## ❌ Error Handling

### Common Errors:

```json
{
  "success": false,
  "error": "Recording not found",
  "statusCode": 404
}
```

```json
{
  "success": false,
  "error": "Transcription failed",
  "message": "AssemblyAI API key not configured",
  "statusCode": 500
}
```

```json
{
  "success": false,
  "error": "Invalid audio format",
  "message": "Allowed formats: MP3, WAV, M4A, OGG, WEBM",
  "statusCode": 400
}
```

---

## 🔧 Configuration

### Environment Variables:

```env
# AssemblyAI (for transcription)
ASSEMBLYAI_API_KEY=your_assemblyai_key

# OpenRouter (for AI extraction - preferred)
OPENROUTER_API_KEY=your_openrouter_key

# Gemini (fallback)
GEMINI_API_KEY=your_gemini_key

# Upload settings
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FORMATS=audio/mpeg,audio/wav,audio/m4a,audio/ogg,audio/webm
```

---

## 📊 Best Practices

### 1. استخدم ONE-CLICK للسرعة
إذا كنت تريد معالجة سريعة، استخدم `/process-complete`

### 2. استخدم Preview للدقة
إذا كنت تريد مراجعة قبل الإنشاء، استخدم `/preview-extraction` ثم `/create-from-preview`

### 3. حدد اللغة بدقة
حدد اللغة الصحيحة للحصول على أفضل نتائج transcription

### 4. استخدم أوقات واضحة
بدلاً من "بعدين"، قل "بكرة الساعة 3 العصر"

### 5. افصل المهام عن الملاحظات
استخدم كلمة "نوت" أو "ملاحظة" لتمييز الملاحظات

---

## 🚀 Performance Tips

- **حجم الملف**: أقل من 10MB للأداء الأفضل
- **جودة الصوت**: استخدم جودة متوسطة (128kbps) كافية
- **طول التسجيل**: أقل من 5 دقائق للمعالجة السريعة
- **وضوح الصوت**: تكلم بوضوح وبدون ضوضاء خلفية

---

## 📞 Support

للدعم والمساعدة:
- Email: support@voclio.app
- Documentation: https://docs.voclio.app
- GitHub: https://github.com/voclio/api

---

## 📝 Changelog

### v1.0.0 (2026-02-05)
- ✅ دعم اللهجات العربية المتعددة
- ✅ استخراج ذكي للمهام والملاحظات
- ✅ فهم الأوقات والتواريخ بالعربية
- ✅ دعم 13 لغة للـ transcription
- ✅ ONE-CLICK processing
- ✅ Preview before creation
- ✅ Subtasks extraction
- ✅ Auto-tagging for notes

---

Made with ❤️ by Voclio Team
