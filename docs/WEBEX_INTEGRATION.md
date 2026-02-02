# Webex Calendar Integration

تم إضافة دعم كامل لـ Webex meetings في نظام Voclio، مما يتيح للمستخدمين ربط حساباتهم في Webex وإدارة الاجتماعات مباشرة من التطبيق.

## المميزات

### 🔐 المصادقة (OAuth)
- ربط حساب Webex باستخدام OAuth 2.0
- تجديد تلقائي للـ access tokens
- إدارة آمنة للـ credentials

### 📅 إدارة الاجتماعات
- عرض جميع اجتماعات Webex
- إنشاء اجتماعات جديدة
- تحديث الاجتماعات الموجودة
- حذف الاجتماعات
- عرض تفاصيل الاجتماع

### 🗓️ التكامل مع الكاليندر
- دمج اجتماعات Webex مع Google Calendar
- عرض موحد لجميع الأحداث (مهام، تذكيرات، Google Calendar، Webex)
- فلترة حسب المصدر

## إعداد التطبيق

### 1. إنشاء تطبيق Webex

1. اذهب إلى [Webex Developer Portal](https://developer.webex.com/)
2. سجل دخول بحسابك في Webex
3. انقر على "My Webex Apps"
4. انقر على "Create a New App"
5. اختر "Integration"
6. املأ البيانات المطلوبة:
   - **Integration Name**: اسم التطبيق
   - **Description**: وصف التطبيق
   - **Redirect URI**: `https://yourdomain.com/api/webex/callback`
   - **Scopes**: اختر الصلاحيات المطلوبة:
     - `spark:meetings_read`
     - `spark:meetings_write`
     - `spark:people_read`

### 2. إعداد متغيرات البيئة

أضف المتغيرات التالية إلى ملف `.env`:

```env
# Webex OAuth Configuration
WEBEX_CLIENT_ID=your_webex_client_id_here
WEBEX_CLIENT_SECRET=your_webex_client_secret_here
WEBEX_REDIRECT_URI=https://yourdomain.com/api/webex/callback
WEBEX_API_URL=https://webexapis.com/v1
```

### 3. تشغيل Migration

```bash
npm run migrate:webex
```

## API Endpoints

### 🔐 المصادقة

#### الحصول على رابط التفويض
```http
GET /api/webex/auth
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://webexapis.com/v1/authorize?...",
    "message": "Webex authorization URL generated successfully"
  }
}
```

#### معالجة callback OAuth
```http
GET /api/webex/callback?code=<auth_code>&state=<state>
Authorization: Bearer <jwt_token>
```

#### التحقق من حالة الاتصال
```http
GET /api/webex/status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "syncEnabled": true,
    "webexUser": {
      "id": "webex_user_id",
      "email": "user@example.com",
      "displayName": "User Name"
    },
    "lastSyncAt": "2024-01-01T12:00:00Z"
  }
}
```

#### قطع الاتصال
```http
POST /api/webex/disconnect
Authorization: Bearer <jwt_token>
```

### 📅 الاجتماعات

#### الحصول على الاجتماعات
```http
GET /api/webex/meetings
Authorization: Bearer <jwt_token>

# مع فلاتر اختيارية
GET /api/webex/meetings?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&days=7
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetings": [
      {
        "id": "meeting_id",
        "title": "Team Meeting",
        "description": "Weekly team standup",
        "start": "2024-01-01T10:00:00Z",
        "end": "2024-01-01T11:00:00Z",
        "joinUrl": "https://company.webex.com/join/...",
        "meetingNumber": "123456789",
        "password": "meeting_password",
        "hostEmail": "host@example.com",
        "type": "webex_meeting"
      }
    ],
    "count": 1
  }
}
```

#### اجتماعات اليوم
```http
GET /api/webex/meetings/today
Authorization: Bearer <jwt_token>
```

#### إنشاء اجتماع جديد
```http
POST /api/webex/meetings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "New Meeting",
  "agenda": "Meeting agenda",
  "start": "2024-01-01T10:00:00Z",
  "end": "2024-01-01T11:00:00Z",
  "timezone": "Asia/Riyadh",
  "password": "optional_password",
  "enabledAutoRecordMeeting": false,
  "allowAnyUserToBeCoHost": true,
  "enabledJoinBeforeHost": true,
  "publicMeeting": false,
  "sendEmail": true
}
```

#### الحصول على تفاصيل اجتماع
```http
GET /api/webex/meetings/:meetingId
Authorization: Bearer <jwt_token>
```

#### تحديث اجتماع
```http
PUT /api/webex/meetings/:meetingId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Meeting Title",
  "start": "2024-01-01T14:00:00Z",
  "end": "2024-01-01T15:00:00Z"
}
```

#### حذف اجتماع
```http
DELETE /api/webex/meetings/:meetingId
Authorization: Bearer <jwt_token>
```

### 🗓️ الكاليندر المدمج

#### الحصول على جميع الأحداث
```http
GET /api/calendar/events?start_date=2024-01-01&end_date=2024-01-31&include_google=true&include_webex=true
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "task-123",
        "type": "task",
        "title": "Complete project",
        "source": "voclio"
      },
      {
        "id": "google-456",
        "type": "meeting",
        "title": "Google Meet",
        "source": "google_calendar"
      },
      {
        "id": "webex-789",
        "type": "meeting",
        "title": "Webex Meeting",
        "source": "webex",
        "joinUrl": "https://company.webex.com/join/..."
      }
    ],
    "count": 3,
    "google_events_count": 1,
    "webex_meetings_count": 1
  }
}
```

#### الاجتماعات القادمة من جميع المصادر
```http
GET /api/calendar/meetings/upcoming?days=7&include_google=true&include_webex=true
Authorization: Bearer <jwt_token>
```

## استخدام JavaScript

### مثال على الاستخدام

```javascript
// 1. الحصول على رابط التفويض
const authResponse = await fetch('/api/webex/auth', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
const { authUrl } = await authResponse.json();

// 2. توجيه المستخدم للتفويض
window.open(authUrl, '_blank');

// 3. بعد التفويض، الحصول على الاجتماعات
const meetingsResponse = await fetch('/api/webex/meetings', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
const { meetings } = await meetingsResponse.json();

// 4. إنشاء اجتماع جديد
const newMeeting = await fetch('/api/webex/meetings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Team Meeting',
    start: '2024-01-01T10:00:00Z',
    end: '2024-01-01T11:00:00Z',
    timezone: 'Asia/Riyadh'
  })
});
```

## قاعدة البيانات

### جدول `webex_sync`

```sql
CREATE TABLE webex_sync (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(user_id),
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" VARCHAR(50) DEFAULT 'Bearer',
    "expiresIn" INTEGER,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    "webexUserId" VARCHAR(255),
    "webexUserEmail" VARCHAR(255),
    "webexDisplayName" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "lastSyncAt" TIMESTAMP WITH TIME ZONE,
    "syncEnabled" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## الأمان

### حماية البيانات
- جميع الـ tokens مشفرة في قاعدة البيانات
- تجديد تلقائي للـ access tokens
- انتهاء صلاحية الـ sessions

### التحقق من الصلاحيات
- جميع الـ endpoints تتطلب JWT token صالح
- كل مستخدم يمكنه الوصول فقط لبياناته
- التحقق من صحة البيانات المدخلة

## استكشاف الأخطاء

### أخطاء شائعة

#### 1. Token منتهي الصلاحية
```json
{
  "success": false,
  "message": "Webex token expired. Please reconnect your account.",
  "status": 401
}
```
**الحل**: إعادة ربط الحساب عبر `/api/webex/auth`

#### 2. Webex غير مربوط
```json
{
  "success": false,
  "message": "Webex calendar not connected",
  "status": 404
}
```
**الحل**: ربط حساب Webex أولاً

#### 3. خطأ في إنشاء الاجتماع
```json
{
  "success": false,
  "message": "Failed to create Webex meeting",
  "status": 500
}
```
**الحل**: التحقق من صحة البيانات المرسلة

### تسجيل الأخطاء

جميع الأخطاء يتم تسجيلها في console مع تفاصيل كاملة:

```javascript
console.error('Error fetching Webex meetings:', error.response?.data || error.message);
```

## الاختبار

### تشغيل المثال
```bash
node examples/webex-usage.js
```

### اختبار الـ API
```bash
# اختبار الاتصال
curl -X GET "http://localhost:3000/api/webex/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# اختبار الحصول على الاجتماعات
curl -X GET "http://localhost:3000/api/webex/meetings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## الدعم

للحصول على المساعدة:
1. راجع الـ logs في console
2. تأكد من صحة الـ environment variables
3. تحقق من صلاحيات Webex app
4. راجع الـ API documentation

## التحديثات المستقبلية

- [ ] دعم Webex Teams
- [ ] مزامنة ثنائية الاتجاه
- [ ] إشعارات الاجتماعات
- [ ] تسجيل الاجتماعات
- [ ] إحصائيات الاستخدام