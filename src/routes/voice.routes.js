import express from 'express';
import VoiceController from '../controllers/voice.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  uploadVoiceValidator,
  voiceIdValidator,
  transcribeVoiceValidator,
  processVoiceCompleteValidator
} from '../validators/voice.validator.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/voice/process-complete:
 *   post:
 *     summary: One-click voice processing (async)
 *     description: Upload audio, transcribe, extract tasks & notes — returns job IDs immediately
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [audio_file]
 *             properties:
 *               audio_file:
 *                 type: string
 *                 format: binary
 *               language:
 *                 type: string
 *                 default: ar
 *               category_id:
 *                 type: integer
 *               auto_create_tasks:
 *                 type: boolean
 *                 default: true
 *               auto_create_notes:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       202:
 *         description: Processing started — returns job IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recording_id:
 *                   type: integer
 *                 jobs:
 *                   type: object
 *                   properties:
 *                     transcription:
 *                       type: string
 *                     extraction:
 *                       type: string
 *                 status:
 *                   type: string
 *                   example: processing
 */
router.post(
  '/process-complete',
  VoiceController.uploadMiddleware,
  processVoiceCompleteValidator,
  VoiceController.processVoiceComplete
);

/**
 * @swagger
 * /api/voice/job-status/{jobId}:
 *   get:
 *     summary: Get job processing status
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: queue
 *         schema:
 *           type: string
 *           enum: [transcription, extraction]
 *           default: transcription
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobStatus'
 */
router.get('/job-status/:jobId', VoiceController.getJobStatus);

/**
 * @swagger
 * /api/voice/upload:
 *   post:
 *     summary: Upload a voice recording to cloud storage
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [audio_file]
 *             properties:
 *               audio_file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Recording uploaded
 */
router.post(
  '/upload',
  VoiceController.uploadMiddleware,
  uploadVoiceValidator,
  VoiceController.uploadRecording
);

/**
 * @swagger
 * /api/voice/transcribe:
 *   post:
 *     summary: Transcribe a recording (async)
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 */
router.post('/transcribe', transcribeVoiceValidator, VoiceController.transcribeRecording);

/**
 * @swagger
 * /api/voice:
 *   get:
 *     summary: Get all voice recordings
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', VoiceController.getAllRecordings);
router.get('/:id', voiceIdValidator, VoiceController.getRecordingDetails);
router.delete('/:id', voiceIdValidator, VoiceController.deleteRecording);

export default router;
