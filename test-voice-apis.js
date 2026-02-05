/**
 * Voice APIs Testing Script
 * Tests all voice-related endpoints with Arabic language support
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'your_test_token_here';

// Test audio file path (you need to provide a test audio file)
const TEST_AUDIO_FILE = './test-audio.mp3';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// API Helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    throw new Error(`API Request failed: ${error.message}`);
  }
}

// Test Cases
let testRecordingId = null;

async function test1_uploadRecording() {
  log('\n📤 Test 1: Upload Voice Recording', 'blue');
  
  try {
    if (!fs.existsSync(TEST_AUDIO_FILE)) {
      logWarning(`Test audio file not found: ${TEST_AUDIO_FILE}`);
      logInfo('Skipping upload test. Please provide a test audio file.');
      return null;
    }

    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(TEST_AUDIO_FILE));
    formData.append('title', 'Test Recording - Arabic');

    const response = await apiRequest('/voice/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    testRecordingId = response.data.recording.recording_id;
    logSuccess(`Recording uploaded successfully! ID: ${testRecordingId}`);
    logInfo(`File size: ${response.data.recording.file_size} bytes`);
    
    return testRecordingId;
  } catch (error) {
    logError(`Upload failed: ${error.message}`);
    return null;
  }
}

async function test2_transcribeRecording(recordingId) {
  log('\n🎤 Test 2: Transcribe Recording', 'blue');
  
  try {
    const response = await apiRequest('/voice/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recording_id: recordingId,
        language: 'ar'
      })
    });

    logSuccess('Transcription completed!');
    logInfo(`Transcription: "${response.data.transcription}"`);
    
    return response.data.transcription;
  } catch (error) {
    logError(`Transcription failed: ${error.message}`);
    return null;
  }
}

async function test3_previewExtraction(recordingId) {
  log('\n🔍 Test 3: Preview Extraction', 'blue');
  
  try {
    const response = await apiRequest('/voice/preview-extraction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recording_id: recordingId,
        extraction_type: 'both'
      })
    });

    logSuccess('Preview generated!');
    logInfo(`Tasks found: ${response.data.preview.tasks?.length || 0}`);
    logInfo(`Notes found: ${response.data.preview.notes?.length || 0}`);
    
    if (response.data.preview.tasks?.length > 0) {
      log('\n📋 Extracted Tasks:', 'yellow');
      response.data.preview.tasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title}`);
        console.log(`     Priority: ${task.priority}`);
        console.log(`     Due Date: ${task.due_date || 'Not specified'}`);
        if (task.subtasks?.length > 0) {
          console.log(`     Subtasks: ${task.subtasks.length}`);
          task.subtasks.forEach((subtask, i) => {
            console.log(`       - ${subtask.title}`);
          });
        }
      });
    }
    
    if (response.data.preview.notes?.length > 0) {
      log('\n📝 Extracted Notes:', 'yellow');
      response.data.preview.notes.forEach((note, index) => {
        console.log(`  ${index + 1}. ${note.title}`);
        console.log(`     Tags: ${note.tags?.join(', ') || 'None'}`);
      });
    }
    
    return response.data.preview;
  } catch (error) {
    logError(`Preview extraction failed: ${error.message}`);
    return null;
  }
}

async function test4_createFromPreview(recordingId, preview) {
  log('\n✨ Test 4: Create from Preview', 'blue');
  
  try {
    const response = await apiRequest('/voice/create-from-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recording_id: recordingId,
        tasks: preview.tasks || [],
        notes: preview.notes || []
      })
    });

    logSuccess('Items created successfully!');
    logInfo(`Tasks created: ${response.data.created.tasks?.length || 0}`);
    logInfo(`Notes created: ${response.data.created.notes?.length || 0}`);
    
    return response.data.created;
  } catch (error) {
    logError(`Creation failed: ${error.message}`);
    return null;
  }
}

async function test5_updateTranscription(recordingId) {
  log('\n✏️  Test 5: Update Transcription', 'blue');
  
  try {
    const newTranscription = 'محتاج أشتري لبن وخبز بكرة الصبح الساعة 9';
    
    const response = await apiRequest('/voice/update-transcription', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recording_id: recordingId,
        transcription: newTranscription
      })
    });

    logSuccess('Transcription updated!');
    logInfo(`New transcription: "${response.data.transcription}"`);
    
    return response.data.transcription;
  } catch (error) {
    logError(`Update failed: ${error.message}`);
    return null;
  }
}

async function test6_processComplete() {
  log('\n🚀 Test 6: ONE-CLICK Complete Processing', 'blue');
  
  try {
    if (!fs.existsSync(TEST_AUDIO_FILE)) {
      logWarning('Test audio file not found. Skipping ONE-CLICK test.');
      return null;
    }

    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(TEST_AUDIO_FILE));
    formData.append('language', 'ar');
    formData.append('auto_create_tasks', 'true');
    formData.append('auto_create_notes', 'true');

    const response = await apiRequest('/voice/process-complete', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    logSuccess('Complete processing finished!');
    logInfo(`Recording ID: ${response.data.recording_id}`);
    logInfo(`Transcription: "${response.data.transcription}"`);
    logInfo(`Tasks extracted: ${response.data.extracted.tasks?.length || 0}`);
    logInfo(`Notes extracted: ${response.data.extracted.notes?.length || 0}`);
    logInfo(`Tasks created: ${response.data.created.tasks?.length || 0}`);
    logInfo(`Notes created: ${response.data.created.notes?.length || 0}`);
    
    return response.data;
  } catch (error) {
    logError(`Complete processing failed: ${error.message}`);
    return null;
  }
}

async function test7_getAllRecordings() {
  log('\n📚 Test 7: Get All Recordings', 'blue');
  
  try {
    const response = await apiRequest('/voice?page=1&limit=10', {
      method: 'GET'
    });

    logSuccess(`Found ${response.data.recordings.length} recordings`);
    
    if (response.data.recordings.length > 0) {
      log('\nRecent recordings:', 'yellow');
      response.data.recordings.slice(0, 5).forEach((rec, index) => {
        console.log(`  ${index + 1}. ID: ${rec.recording_id}`);
        console.log(`     Created: ${new Date(rec.created_at).toLocaleString('ar-EG')}`);
        console.log(`     Size: ${(rec.file_size / 1024).toFixed(2)} KB`);
      });
    }
    
    return response.data.recordings;
  } catch (error) {
    logError(`Get recordings failed: ${error.message}`);
    return null;
  }
}

async function test8_getRecordingDetails(recordingId) {
  log('\n🔎 Test 8: Get Recording Details', 'blue');
  
  try {
    const response = await apiRequest(`/voice/${recordingId}`, {
      method: 'GET'
    });

    logSuccess('Recording details retrieved!');
    logInfo(`ID: ${response.data.recording.recording_id}`);
    logInfo(`Format: ${response.data.recording.format}`);
    logInfo(`Duration: ${response.data.recording.duration || 'N/A'}`);
    logInfo(`Has transcription: ${response.data.recording.transcription ? 'Yes' : 'No'}`);
    
    return response.data.recording;
  } catch (error) {
    logError(`Get details failed: ${error.message}`);
    return null;
  }
}

async function test9_deleteRecording(recordingId) {
  log('\n🗑️  Test 9: Delete Recording', 'blue');
  
  try {
    const response = await apiRequest(`/voice/${recordingId}`, {
      method: 'DELETE'
    });

    logSuccess('Recording deleted successfully!');
    
    return true;
  } catch (error) {
    logError(`Delete failed: ${error.message}`);
    return false;
  }
}

// Test Arabic Date/Time Understanding
async function testArabicUnderstanding() {
  log('\n🧪 Testing Arabic Language Understanding', 'blue');
  
  const testCases = [
    {
      text: 'عايز أشتري لبن وخبز بكرة الصبح',
      expected: {
        tasks: 1,
        subtasks: 2,
        priority: 'medium',
        hasDate: true
      }
    },
    {
      text: 'مهم جداً أتصل بالدكتور الساعة 3 العصر',
      expected: {
        tasks: 1,
        priority: 'high',
        hasTime: true
      }
    },
    {
      text: 'نوت: لازم أركز على الأرقام والإحصائيات',
      expected: {
        notes: 1,
        tasks: 0
      }
    }
  ];

  log('\n📝 Test Cases:', 'yellow');
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. "${testCase.text}"`);
    console.log(`   Expected:`);
    console.log(`   - Tasks: ${testCase.expected.tasks || 0}`);
    console.log(`   - Notes: ${testCase.expected.notes || 0}`);
    if (testCase.expected.subtasks) {
      console.log(`   - Subtasks: ${testCase.expected.subtasks}`);
    }
    if (testCase.expected.priority) {
      console.log(`   - Priority: ${testCase.expected.priority}`);
    }
    if (testCase.expected.hasDate) {
      console.log(`   - Has Date: Yes`);
    }
    if (testCase.expected.hasTime) {
      console.log(`   - Has Time: Yes`);
    }
  });
}

// Main Test Runner
async function runAllTests() {
  log('═══════════════════════════════════════════════════', 'cyan');
  log('🎤 Voice APIs Testing Suite', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');
  
  logInfo(`API Base URL: ${API_BASE_URL}`);
  logInfo(`Test Audio File: ${TEST_AUDIO_FILE}`);
  
  // Check if audio file exists
  if (!fs.existsSync(TEST_AUDIO_FILE)) {
    logWarning('\n⚠️  Test audio file not found!');
    logInfo('Please create a test audio file at: ' + TEST_AUDIO_FILE);
    logInfo('You can record a short Arabic voice message for testing.');
    logInfo('\nSome tests will be skipped without the audio file.');
  }

  try {
    // Test 1: Upload
    const recordingId = await test1_uploadRecording();
    
    if (recordingId) {
      // Test 2: Transcribe
      await test2_transcribeRecording(recordingId);
      
      // Test 3: Preview
      const preview = await test3_previewExtraction(recordingId);
      
      if (preview) {
        // Test 4: Create from preview
        await test4_createFromPreview(recordingId, preview);
      }
      
      // Test 5: Update transcription
      await test5_updateTranscription(recordingId);
      
      // Test 8: Get details
      await test8_getRecordingDetails(recordingId);
      
      // Test 9: Delete (optional - comment out if you want to keep the recording)
      // await test9_deleteRecording(recordingId);
    }
    
    // Test 6: ONE-CLICK (creates a new recording)
    await test6_processComplete();
    
    // Test 7: Get all recordings
    await test7_getAllRecordings();
    
    // Test Arabic understanding
    await testArabicUnderstanding();
    
    log('\n═══════════════════════════════════════════════════', 'cyan');
    log('✅ All tests completed!', 'green');
    log('═══════════════════════════════════════════════════', 'cyan');
    
  } catch (error) {
    log('\n═══════════════════════════════════════════════════', 'red');
    logError(`Test suite failed: ${error.message}`);
    log('═══════════════════════════════════════════════════', 'red');
  }
}

// Run tests
runAllTests().catch(console.error);
