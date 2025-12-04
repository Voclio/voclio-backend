const express = require('express');
const router = express.Router();
const VoiceController = require('../controllers/voice.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

router.post('/upload', VoiceController.uploadMiddleware, VoiceController.uploadRecording);
router.post('/transcribe', VoiceController.transcribeRecording);
router.get('/:id', VoiceController.getRecordingDetails);

module.exports = router;
