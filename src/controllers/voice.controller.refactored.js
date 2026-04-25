import multer from 'multer';
import VoiceRecordingModel from '../models/voice.model.js';
import storageService from '../services/storage.service.js';
import queueManager, { QUEUE_NAMES, JOB_PRIORITY } from '../config/queue.js';
import { successResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import config from '../config/index.js';
import cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';

// Configure multer for memory storage (upload to cloud instead of disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Invalid audio format. Allowed: MP3, WAV, M4A, OGG, WEBM'));
    }
  }
});

class VoiceController {
  static uploadMiddleware = upload.single('audio_file');

  /**
   * Get all recordings (with caching)
   */
  static async getAllRecordings(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const userId = req.user.user_id;

      // Try cache first
      const cacheKey = `recordings:${userId}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return successResponse(res, cached);
      }

      // Fetch from database
      const recordings = await VoiceRecordingModel.findAll(userId, { page, limit });

      const result = {
        recordings,
        pagination: { page, limit, max_limit: 100 }
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload recording to cloud storage
   */
  static async uploadRecording(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('No audio file uploaded');
      }

      const userId = req.user.user_id;

      // Upload to cloud storage
      logger.info(`Uploading file to cloud storage for user ${userId}`);
      const uploadResult = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        userId,
        {
          folder: 'voice',
          contentType: req.file.mimetype,
          metadata: {
            uploadedBy: userId.toString()
          }
        }
      );

      // Create recording in database with cloud storage URL
      const recording = await VoiceRecordingModel.create(userId, {
        file_path: uploadResult.url, // Cloud URL instead of local path
        storage_key: uploadResult.key, // S3/R2 key for retrieval
        file_size: uploadResult.size,
        format: uploadResult.contentType,
        duration: null,
        status: 'uploaded'
      });

      // Invalidate cache
      await cacheService.delPattern(`recordings:${userId}:*`);

      return successResponse(
        res,
        {
          recording: {
            recording_id: recording.recording_id,
            file_size: recording.file_size,
            format: recording.format,
            storage_url: uploadResult.url,
            created_at: recording.created_at
          }
        },
        'Recording uploaded successfully',
        201
      );
    } catch (error) {
      logger.error('Upload error:', error);
      next(error);
    }
  }

  /**
   * Transcribe recording (async with job queue)
   */
  static async transcribeRecording(req, res, next) {
    try {
      const { recording_id, language = 'ar' } = req.body;
      const userId = req.user.user_id;

      if (!recording_id) {
        throw new ValidationError('Recording ID is required');
      }

      const recording = await VoiceRecordingModel.findById(recording_id, userId);

      if (!recording) {
        throw new NotFoundError('Recording not found');
      }

      // If already transcribed, return cached result
      if (recording.transcription_text) {
        return successResponse(res, {
          recording_id: recording.recording_id,
          transcription: recording.transcription_text,
          cached: true,
          status: 'completed'
        });
      }

      // Add transcription job to queue
      const job = await queueManager.addJob(
        QUEUE_NAMES.TRANSCRIPTION,
        'transcribe-audio',
        {
          recordingId: recording_id,
          userId,
          language,
          storageKey: recording.storage_key || recording.file_path
        },
        {
          priority: JOB_PRIORITY.HIGH
        }
      );

      logger.info(`Transcription job created: ${job.id}`);

      // Return job ID immediately
      return successResponse(
        res,
        {
          recording_id,
          job_id: job.id,
          status: 'processing',
          message: 'Transcription started. Use /api/voice/job-status/:jobId to check progress.'
        },
        'Transcription job created',
        202 // Accepted
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * ONE-CLICK: Process voice completely (async)
   */
  static async processVoiceComplete(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('No audio file uploaded');
      }

      const {
        language = 'ar',
        category_id,
        auto_create_tasks = true,
        auto_create_notes = true
      } = req.body;
      const userId = req.user.user_id;

      logger.info(`Starting complete voice processing for user ${userId}`);

      // Step 1: Upload to cloud storage
      const uploadResult = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        userId,
        {
          folder: 'voice',
          contentType: req.file.mimetype
        }
      );

      // Step 2: Create recording in database
      const recording = await VoiceRecordingModel.create(userId, {
        file_path: uploadResult.url,
        storage_key: uploadResult.key,
        file_size: uploadResult.size,
        format: uploadResult.contentType,
        status: 'processing'
      });

      // Step 3: Add transcription job
      const transcriptionJob = await queueManager.addJob(
        QUEUE_NAMES.TRANSCRIPTION,
        'transcribe-audio',
        {
          recordingId: recording.recording_id,
          userId,
          language,
          storageKey: uploadResult.key
        },
        {
          priority: JOB_PRIORITY.HIGH
        }
      );

      // Step 4: Add extraction job (will wait for transcription)
      const extractionJob = await queueManager.addJob(
        QUEUE_NAMES.EXTRACTION,
        'extract-tasks-notes',
        {
          recordingId: recording.recording_id,
          userId,
          autoCreateTasks: auto_create_tasks === 'true' || auto_create_tasks === true,
          autoCreateNotes: auto_create_notes === 'true' || auto_create_notes === true,
          categoryId: category_id
        },
        {
          priority: JOB_PRIORITY.MEDIUM,
          delay: 5000 // Wait 5 seconds for transcription to start
        }
      );

      // Invalidate cache
      await cacheService.delPattern(`recordings:${userId}:*`);

      logger.info(
        `Voice processing jobs created: transcription=${transcriptionJob.id}, extraction=${extractionJob.id}`
      );

      // Return immediately with job IDs
      return successResponse(
        res,
        {
          recording_id: recording.recording_id,
          jobs: {
            transcription: transcriptionJob.id,
            extraction: extractionJob.id
          },
          status: 'processing',
          message: 'Voice processing started. Use /api/voice/job-status/:jobId to check progress.'
        },
        'Voice processing started',
        202 // Accepted
      );
    } catch (error) {
      logger.error('Process voice complete error:', error);
      next(error);
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;
      const { queue = QUEUE_NAMES.TRANSCRIPTION } = req.query;

      const jobState = await queueManager.getJobState(queue, jobId);

      if (!jobState) {
        throw new NotFoundError('Job not found');
      }

      return successResponse(res, {
        job: jobState
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recording details
   */
  static async getRecordingDetails(req, res, next) {
    try {
      const recording = await VoiceRecordingModel.findById(req.params.id, req.user.user_id);

      if (!recording) {
        throw new NotFoundError('Recording not found');
      }

      return successResponse(res, {
        recording: {
          recording_id: recording.recording_id,
          file_size: recording.file_size,
          duration: recording.duration,
          format: recording.format,
          transcription: recording.transcription_text,
          storage_url: recording.file_path,
          status: recording.status,
          created_at: recording.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete recording (also delete from cloud storage)
   */
  static async deleteRecording(req, res, next) {
    try {
      const recording = await VoiceRecordingModel.findById(req.params.id, req.user.user_id);

      if (!recording) {
        throw new NotFoundError('Recording not found');
      }

      // Delete from cloud storage
      if (recording.storage_key) {
        try {
          await storageService.deleteFile(recording.storage_key);
        } catch (err) {
          logger.error('Failed to delete file from storage:', err);
        }
      }

      // Delete from database
      await VoiceRecordingModel.delete(req.params.id, req.user.user_id);

      // Invalidate cache
      await cacheService.delPattern(`recordings:${req.user.user_id}:*`);

      return successResponse(res, null, 'Recording deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default VoiceController;
