import express from 'express';
import VoiceController from '../controllers/voice.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  uploadVoiceValidator,
  voiceIdValidator,
  transcribeVoiceValidator,
  createNoteFromVoiceValidator,
  createTasksFromVoiceValidator,
  previewExtractionValidator,
  createFromPreviewValidator,
  updateTranscriptionValidator,
  processVoiceCompleteValidator
} from '../validators/voice.validator.js';

// All routes require authentication
router.use(authMiddleware);

// ONE-CLICK: Complete voice processing (Upload + Transcribe + Extract + Create)
router.post('/process-complete', VoiceController.uploadMiddleware, processVoiceCompleteValidator, VoiceController.processVoiceComplete);

// STEP-BY-STEP WORKFLOW (for mobile app with preview)
router.post('/preview-extraction', previewExtractionValidator, VoiceController.previewExtraction);
router.post('/create-from-preview', createFromPreviewValidator, VoiceController.createFromPreview);
router.put('/update-transcription', updateTranscriptionValidator, VoiceController.updateTranscription);

// BASIC OPERATIONS
router.get('/', VoiceController.getAllRecordings);
router.post('/upload', VoiceController.uploadMiddleware, uploadVoiceValidator, VoiceController.uploadRecording);
router.post('/transcribe', transcribeVoiceValidator, VoiceController.transcribeRecording);
router.post('/:id/create-note', createNoteFromVoiceValidator, VoiceController.createNoteFromRecording);
router.post('/:id/create-tasks', createTasksFromVoiceValidator, VoiceController.createTasksFromRecording);
router.get('/:id', voiceIdValidator, VoiceController.getRecordingDetails);
router.delete('/:id', voiceIdValidator, VoiceController.deleteRecording);

export default router;
