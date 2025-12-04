const express = require('express');
const router = express.Router();
const VoiceController = require('../controllers/voice.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  uploadVoiceValidator,
  voiceIdValidator,
  transcribeVoiceValidator
} = require('../validators/voice.validator');

// All routes require authentication
router.use(authMiddleware);

router.post('/upload', VoiceController.uploadMiddleware, uploadVoiceValidator, VoiceController.uploadRecording);
router.post('/transcribe', transcribeVoiceValidator, VoiceController.transcribeRecording);
router.get('/:id', voiceIdValidator, VoiceController.getRecordingDetails);

module.exports = router;
