const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const VoiceRecordingModel = require("../models/voice.model");
const aiService = require("../services/ai.service");
const config = require("../config");
const { successResponse } = require("../utils/responses");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { AUDIO_FORMATS } = require("../utils/constants");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/voice");
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          "Invalid audio format. Allowed: MP3, WAV, M4A, OGG, WEBM"
        )
      );
    }
  },
});

class VoiceController {
  static uploadMiddleware = upload.single("audio");

  static async uploadRecording(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError("No audio file uploaded");
      }

      const recording = await VoiceRecordingModel.create(req.user.user_id, {
        file_path: req.file.path,
        file_size: req.file.size,
        format: req.file.mimetype,
        duration: null, // Will be extracted from metadata if needed
      });

      return successResponse(
        res,
        {
          recording: {
            recording_id: recording.recording_id,
            file_size: recording.file_size,
            format: recording.format,
            created_at: recording.created_at,
          },
        },
        "Recording uploaded successfully",
        201
      );
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
      const { recording_id, language, force_retranscribe } = req.body;

      if (!recording_id) {
        throw new ValidationError("Recording ID is required");
      }

      const recording = await VoiceRecordingModel.findById(
        recording_id,
        req.user.user_id
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      // Return cached transcription if exists and not forcing re-transcription
      if (recording.transcription_text && !force_retranscribe) {
        return successResponse(res, {
          recording_id: recording.recording_id,
          transcription: recording.transcription_text,
          cached: true,
        });
      }

      // Transcribe using OpenRouter Whisper
      try {
        const transcription = await aiService.transcribeAudio(
          recording.file_path,
          language
        );

        // Update recording with transcription
        await VoiceRecordingModel.updateTranscription(
          recording_id,
          transcription
        );

        return successResponse(
          res,
          {
            recording_id,
            transcription,
            language,
          },
          "Transcription completed successfully"
        );
      } catch (transcriptionError) {
        console.error("Transcription error:", transcriptionError);
        return successResponse(res, {
          recording_id,
          error: "Transcription failed. Please try again.",
          message: transcriptionError.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getRecordingDetails(req, res, next) {
    try {
      const recording = await VoiceRecordingModel.findById(
        req.params.id,
        req.user.user_id
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      return successResponse(res, {
        recording: {
          recording_id: recording.recording_id,
          file_size: recording.file_size,
          duration: recording.duration,
          format: recording.format,
          transcription: recording.transcription_text,
          created_at: recording.created_at,
          updated_at: recording.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VoiceController;
