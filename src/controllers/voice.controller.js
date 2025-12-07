const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const VoiceRecordingModel = require('../models/voice.model');
const geminiService = require('../services/gemini.service');
const config = require('../config');
const { successResponse } = require('../utils/responses');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { AUDIO_FORMATS } = require('../utils/constants');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/voice');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
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
  static uploadMiddleware = upload.single('audio');

  static async getAllRecordings(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const recordings = await VoiceRecordingModel.findAll(req.user.user_id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return successResponse(res, { 
        recordings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async uploadRecording(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('No audio file uploaded');
      }

      const recording = await VoiceRecordingModel.create(req.user.user_id, {
        file_path: req.file.path,
        file_size: req.file.size,
        format: req.file.mimetype,
        duration: null // Will be extracted from metadata if needed
      });

      return successResponse(res, {
        recording: {
          recording_id: recording.recording_id,
          file_size: recording.file_size,
          format: recording.format,
          created_at: recording.created_at
        }
      }, 'Recording uploaded successfully', 201);

    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  static async transcribeRecording(req, res, next) {
    try {
      const { recording_id, language = 'en' } = req.body;

      if (!recording_id) {
        throw new ValidationError('Recording ID is required');
      }

      const recording = await VoiceRecordingModel.findById(recording_id, req.user.user_id);

      if (!recording) {
        throw new NotFoundError('Recording not found');
      }

      if (recording.transcription) {
        return successResponse(res, {
          recording_id: recording.recording_id,
          transcription: recording.transcription,
          cached: true
        });
      }

      // Read audio file
      const audioBuffer = await fs.readFile(recording.file_path);

      // Transcribe using Gemini (placeholder - needs Google Cloud Speech-to-Text)
      try {
        const transcription = await geminiService.transcribeAudio(audioBuffer);
        
        // Update recording with transcription
        await VoiceRecordingModel.updateTranscription(recording_id, transcription);

        return successResponse(res, {
          recording_id,
          transcription,
          language
        }, 'Transcription completed successfully');

      } catch (transcriptionError) {
        return successResponse(res, {
          recording_id,
          error: 'Transcription service not configured. Please integrate Google Cloud Speech-to-Text API.',
          message: transcriptionError.message
        });
      }

    } catch (error) {
      next(error);
    }
  }

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
          transcription: recording.transcription,
          created_at: recording.created_at,
          transcribed_at: recording.transcribed_at
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async createNoteFromRecording(req, res, next) {
    try {
      const NoteModel = require('../models/note.model');
      const { title, tags } = req.body;

      const recording = await VoiceRecordingModel.findById(req.params.id, req.user.user_id);

      if (!recording) {
        throw new NotFoundError('Recording not found');
      }

      if (!recording.transcription) {
        throw new ValidationError('Recording must be transcribed first');
      }

      // Create note with transcription as content
      const note = await NoteModel.create(req.user.user_id, {
        title: title || `Voice Note - ${new Date().toLocaleString()}`,
        content: recording.transcription,
        voice_recording_id: recording.recording_id
      });

      // Add tags if provided
      if (tags && tags.length > 0) {
        await NoteModel.addTags(note.note_id, tags);
      }

      // Fetch complete note with tags
      const completeNote = await NoteModel.findById(note.note_id, req.user.user_id);

      return successResponse(res, { 
        note: completeNote,
        recording_id: recording.recording_id 
      }, 'Note created from voice recording successfully', 201);

    } catch (error) {
      next(error);
    }
  }

  static async createTasksFromRecording(req, res, next) {
    try {
      const TaskModel = require('../models/task.model');
      const { auto_create = false, category_id } = req.body;

      const recording = await VoiceRecordingModel.findById(req.params.id, req.user.user_id);

      if (!recording) {
        throw new NotFoundError('Recording not found');
      }

      if (!recording.transcription) {
        throw new ValidationError('Recording must be transcribed first');
      }

      // Extract tasks using Gemini AI
      const extractedTasks = await geminiService.extractTasks(recording.transcription);

      if (!auto_create) {
        return successResponse(res, {
          recording_id: recording.recording_id,
          extracted_tasks: extractedTasks,
          message: 'Tasks extracted. Set auto_create=true to save them automatically.'
        });
      }

      // Create tasks automatically
      const tasksToCreate = extractedTasks.map(task => ({
        title: task.title,
        description: task.description || recording.transcription.substring(0, 500),
        priority: task.priority || 'medium',
        category_id: category_id || null
      }));

      const createdTasks = await TaskModel.bulkCreate(req.user.user_id, tasksToCreate);

      return successResponse(res, {
        recording_id: recording.recording_id,
        tasks: createdTasks,
        count: createdTasks.length
      }, 'Tasks created from voice recording successfully', 201);

    } catch (error) {
      next(error);
    }
  }

  static async deleteRecording(req, res, next) {
    try {
      const recording = await VoiceRecordingModel.findById(req.params.id, req.user.user_id);

      if (!recording) {
        throw new NotFoundError('Recording not found');
      }

      // Delete file from disk
      try {
        await fs.unlink(recording.file_path);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }

      await VoiceRecordingModel.delete(req.params.id, req.user.user_id);

      return successResponse(res, null, 'Recording deleted successfully');

    } catch (error) {
      next(error);
    }
  }
}

module.exports = VoiceController;
