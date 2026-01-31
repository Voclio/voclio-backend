# 📱 Mobile App API Guide - Complete Flow

## 🎯 Overview

هذا الدليل يشرح الـ API endpoints المناسبة لتطبيق الموبايل مع الفلو الكامل:
1. تسجيل صوتي
2. عرض النص للمستخدم
3. تعديل النص (اختياري)
4. معاينة المهام/الملاحظات المستخرجة
5. إنشاء المهام/الملاحظات

---

## 🔄 Complete Mobile App Flow

### **Flow 1: Simple Flow (3 Steps)**

```
1. Upload + Transcribe
   ↓
2. Show text (editable)
   ↓
3. Convert to Tasks OR Notes
```

### **Flow 2: Advanced Flow with Preview (5 Steps)**

```
1. Upload audio
   ↓
2. Transcribe
   ↓
3. Show text (user can edit)
   ↓
4. Preview extracted tasks/notes
   ↓
5. User confirms → Create
```

---

## 📡 API Endpoints

### **Step 1: Upload Audio**

```http
POST /api/voice/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body (form-data):
- audio: <audio_file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recording": {
      "recording_id": 123,
      "file_size": 245678,
      "format": "audio/mp3",
      "created_at": "2026-01-31T12:00:00.000Z"
    }
  },
  "message": "Recording uploaded successfully"
}
```

**Save the `recording_id` for next steps!**

---

### **Step 2: Transcribe Audio**

```http
POST /api/voice/transcribe
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "recording_id": 123,
  "language": "ar"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recording_id": 123,
    "transcription": "محتاج أخلص البروجكت بكرة الساعة 5 وكمان أشتري لبن وخبز وجبنة",
    "language": "ar"
  },
  "message": "Transcription completed successfully"
}
```

**الآن اعرض النص في TextField للمستخدم**

---

### **Step 3 (Optional): Update Transcription**

إذا عدّل المستخدم النص:

```http
PUT /api/voice/update-transcription
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "recording_id": 123,
  "transcription": "النص المعدل من المستخدم"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recording_id": 123,
    "transcription": "النص المعدل من المستخدم"
  },
  "message": "Transcription updated successfully"
}
```

---

### **Step 4: Preview Extraction (NEW!)**

معاينة المهام/الملاحظات قبل الإنشاء:

```http
POST /api/voice/preview-extraction
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "recording_id": 123,
  "extraction_type": "both"  // "tasks", "notes", or "both"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recording_id": 123,
    "transcription": "محتاج أخلص البروجكت بكرة الساعة 5...",
    "preview": {
      "tasks": [
        {
          "title": "إنهاء البروجكت",
          "description": "محتاج أخلص البروجكت",
          "priority": "high",
          "due_date": "2026-02-01T17:00:00Z",
          "subtasks": []
        },
        {
          "title": "التسوق",
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
      "notes": []
    },
    "message": "Preview generated. Use create-from-preview endpoint to save."
  }
}
```

**الآن اعرض المهام/الملاحظات للمستخدم للمراجعة**

---

### **Step 5: Create from Preview (NEW!)**

بعد موافقة المستخدم، أنشئ المهام/الملاحظات:

```http
POST /api/voice/create-from-preview
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "recording_id": 123,
  "tasks": [
    {
      "title": "إنهاء البروجكت",
      "description": "محتاج أخلص البروجكت",
      "priority": "high",
      "due_date": "2026-02-01T17:00:00Z",
      "subtasks": []
    },
    {
      "title": "التسوق",
      "priority": "medium",
      "subtasks": [
        { "title": "شراء لبن" },
        { "title": "شراء خبز" }
      ]
    }
  ],
  "notes": [],
  "category_id": 1  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recording_id": 123,
    "created": {
      "tasks": [
        {
          "task_id": 1,
          "title": "إنهاء البروجكت",
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
          "title": "التسوق",
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
          "subtasks_count": 2,
          "subtasks_completed": 0
        }
      ],
      "notes": []
    }
  },
  "message": "Items created successfully"
}
```

---

## 🎨 UI/UX Implementation

### **Screen 1: Recording**

```dart
class RecordingScreen extends StatefulWidget {
  @override
  _RecordingScreenState createState() => _RecordingScreenState();
}

class _RecordingScreenState extends State<RecordingScreen> {
  bool isRecording = false;
  bool isProcessing = false;
  File? audioFile;
  
  Future<void> startRecording() async {
    // Start recording logic
    setState(() => isRecording = true);
  }
  
  Future<void> stopRecording() async {
    setState(() => isRecording = false);
    // Get audio file
    await uploadAndTranscribe();
  }
  
  Future<void> uploadAndTranscribe() async {
    setState(() => isProcessing = true);
    
    // Step 1: Upload
    var uploadResponse = await uploadAudio(audioFile!);
    int recordingId = uploadResponse['data']['recording']['recording_id'];
    
    // Step 2: Transcribe
    var transcribeResponse = await transcribeAudio(recordingId);
    String transcription = transcribeResponse['data']['transcription'];
    
    setState(() => isProcessing = false);
    
    // Navigate to transcription screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TranscriptionScreen(
          recordingId: recordingId,
          transcription: transcription,
        ),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.mic,
              size: 120,
              color: isRecording ? Colors.red : Colors.blue,
            ),
            SizedBox(height: 40),
            if (isRecording)
              Text('Recording...', style: TextStyle(fontSize: 24)),
            SizedBox(height: 40),
            ElevatedButton(
              onPressed: isRecording ? stopRecording : startRecording,
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 40, vertical: 20),
              ),
              child: Text(
                isRecording ? 'Stop' : 'Start Recording',
                style: TextStyle(fontSize: 18),
              ),
            ),
            if (isProcessing)
              Padding(
                padding: EdgeInsets.only(top: 40),
                child: CircularProgressIndicator(),
              ),
          ],
        ),
      ),
    );
  }
}
```

---

### **Screen 2: Transcription & Choice**

```dart
class TranscriptionScreen extends StatefulWidget {
  final int recordingId;
  final String transcription;
  
  TranscriptionScreen({
    required this.recordingId,
    required this.transcription,
  });
  
  @override
  _TranscriptionScreenState createState() => _TranscriptionScreenState();
}

class _TranscriptionScreenState extends State<TranscriptionScreen> {
  late TextEditingController _controller;
  bool isProcessing = false;
  
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.transcription);
  }
  
  Future<void> updateTranscription() async {
    if (_controller.text != widget.transcription) {
      await http.put(
        Uri.parse('$baseUrl/api/voice/update-transcription'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'recording_id': widget.recordingId,
          'transcription': _controller.text,
        }),
      );
    }
  }
  
  Future<void> convertToTasks() async {
    await updateTranscription();
    
    setState(() => isProcessing = true);
    
    // Get preview
    var previewResponse = await http.post(
      Uri.parse('$baseUrl/api/voice/preview-extraction'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'recording_id': widget.recordingId,
        'extraction_type': 'tasks',
      }),
    );
    
    var previewData = jsonDecode(previewResponse.body);
    
    setState(() => isProcessing = false);
    
    // Navigate to preview screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PreviewScreen(
          recordingId: widget.recordingId,
          tasks: previewData['data']['preview']['tasks'],
          type: 'tasks',
        ),
      ),
    );
  }
  
  Future<void> convertToNotes() async {
    await updateTranscription();
    
    setState(() => isProcessing = true);
    
    // Get preview
    var previewResponse = await http.post(
      Uri.parse('$baseUrl/api/voice/preview-extraction'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'recording_id': widget.recordingId,
        'extraction_type': 'notes',
      }),
    );
    
    var previewData = jsonDecode(previewResponse.body);
    
    setState(() => isProcessing = false);
    
    // Navigate to preview screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PreviewScreen(
          recordingId: widget.recordingId,
          notes: previewData['data']['preview']['notes'],
          type: 'notes',
        ),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Transcription')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'Edit transcription if needed:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Expanded(
              child: TextField(
                controller: _controller,
                maxLines: null,
                expands: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Transcription...',
                ),
              ),
            ),
            SizedBox(height: 24),
            if (!isProcessing) ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: convertToTasks,
                      icon: Icon(Icons.task_alt),
                      label: Text('Convert to Tasks'),
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: convertToNotes,
                      icon: Icon(Icons.note),
                      label: Text('Convert to Notes'),
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ] else
              CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
```

---

### **Screen 3: Preview & Confirm**

```dart
class PreviewScreen extends StatefulWidget {
  final int recordingId;
  final List<dynamic>? tasks;
  final List<dynamic>? notes;
  final String type;
  
  PreviewScreen({
    required this.recordingId,
    this.tasks,
    this.notes,
    required this.type,
  });
  
  @override
  _PreviewScreenState createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  late List<dynamic> items;
  bool isCreating = false;
  
  @override
  void initState() {
    super.initState();
    items = widget.type == 'tasks' ? (widget.tasks ?? []) : (widget.notes ?? []);
  }
  
  Future<void> confirmAndCreate() async {
    setState(() => isCreating = true);
    
    var response = await http.post(
      Uri.parse('$baseUrl/api/voice/create-from-preview'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'recording_id': widget.recordingId,
        'tasks': widget.type == 'tasks' ? items : [],
        'notes': widget.type == 'notes' ? items : [],
      }),
    );
    
    var result = jsonDecode(response.body);
    
    setState(() => isCreating = false);
    
    if (result['success']) {
      // Show success and navigate
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => SuccessScreen(
            createdItems: result['data']['created'],
            type: widget.type,
          ),
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Preview ${widget.type == 'tasks' ? 'Tasks' : 'Notes'}'),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, index) {
                var item = items[index];
                return Card(
                  margin: EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: Icon(
                      widget.type == 'tasks' ? Icons.task_alt : Icons.note,
                      color: Colors.blue,
                    ),
                    title: Text(item['title']),
                    subtitle: widget.type == 'tasks'
                        ? Text('Priority: ${item['priority']}')
                        : null,
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: Icon(Icons.edit),
                          onPressed: () {
                            // Edit item
                          },
                        ),
                        IconButton(
                          icon: Icon(Icons.delete),
                          onPressed: () {
                            setState(() => items.removeAt(index));
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isCreating ? null : confirmAndCreate,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
                child: isCreating
                    ? CircularProgressIndicator(color: Colors.white)
                    : Text('Confirm & Create', style: TextStyle(fontSize: 18)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 📊 Summary

### **New Endpoints:**

1. ✅ **`POST /api/voice/preview-extraction`** - معاينة المهام/الملاحظات
2. ✅ **`POST /api/voice/create-from-preview`** - إنشاء من المعاينة
3. ✅ **`PUT /api/voice/update-transcription`** - تحديث النص

### **Complete Flow:**

```
Upload → Transcribe → Edit Text → Preview → Confirm → Create
```

### **Benefits:**

- ✅ اليوزر يشوف النص ويعدله
- ✅ اليوزر يشوف المهام قبل الإنشاء
- ✅ يقدر يحذف أو يعدل أي مهمة
- ✅ تجربة مستخدم أفضل
- ✅ دقة أعلى

---

**الباك إند جاهز 100% للفلو الجديد! 🚀**
