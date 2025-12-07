const express = require('express');
const router = express.Router();
const VoiceController = require('../controllers/voice.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  uploadVoiceValidator,
  voiceIdValidator,
  transcribeVoiceValidator,
  createNoteFromVoiceValidator,
  createTasksFromVoiceValidator
} = require('../validators/voice.validator');

// All routes require authentication
router.use(authMiddleware);

router.get('/', VoiceController.getAllRecordings);
router.post('/upload', VoiceController.uploadMiddleware, uploadVoiceValidator, VoiceController.uploadRecording);
router.post('/transcribe', transcribeVoiceValidator, VoiceController.transcribeRecording);
router.post('/:id/create-note', createNoteFromVoiceValidator, VoiceController.createNoteFromRecording);
router.post('/:id/create-tasks', createTasksFromVoiceValidator, VoiceController.createTasksFromRecording);
router.get('/:id', voiceIdValidator, VoiceController.getRecordingDetails);
router.delete('/:id', voiceIdValidator, VoiceController.deleteRecording);

module.exports = router;
