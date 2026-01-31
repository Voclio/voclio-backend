import multer from "multer";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import VoiceRecordingModel from "../models/voice.model.js";
import aiService from "../services/ai.service.js";
import config from "../config/index.js";
import { successResponse } from "../utils/responses.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { AUDIO_FORMATS } from "../utils/constants.js";
import NoteModel from "../models/note.model.js";
import TaskModel from "../models/task.model.js";
import NotificationService from "../services/notification.service.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/voice");
    try {
      await fsPromises.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
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
          "Invalid audio format. Allowed: MP3, WAV, M4A, OGG, WEBM",
        ),
      );
    }
  },
});

class VoiceController {
  static uploadMiddleware = upload.single("audio");

  static async getAllRecordings(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const recordings = await VoiceRecordingModel.findAll(req.user.user_id, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return successResponse(res, {
        recordings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

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
        201,
      );
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file) {
        await fsPromises.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  static async transcribeRecording(req, res, next) {
    try {
      const { recording_id, language = "ar" } = req.body;

      if (!recording_id) {
        throw new ValidationError("Recording ID is required");
      }

      const recording = await VoiceRecordingModel.findById(
        recording_id,
        req.user.user_id,
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      if (recording.transcription_text) {
        return successResponse(res, {
          recording_id: recording.recording_id,
          transcription: recording.transcription_text,
          cached: true,
        });
      }

      // Transcribe using AI service (AssemblyAI)
      try {
        console.log(`🎤 Transcribing audio file: ${recording.file_path}`);
        const transResult = await aiService.transcribeAudio(
          recording.file_path,
          language,
        );
        const transcriptionText = transResult.text || transResult;

        // Update recording with transcription
        await VoiceRecordingModel.updateTranscription(
          recording_id,
          transcriptionText,
        );

        return successResponse(
          res,
          {
            recording_id,
            transcription: transcriptionText,
            language,
          },
          "Transcription completed successfully",
        );
      } catch (transcriptionError) {
        console.error("Transcription error:", transcriptionError);
        return successResponse(
          res,
          {
            recording_id,
            error: "Transcription failed",
            message: transcriptionError.message,
            suggestion:
              "Please ensure AssemblyAI API key is configured in .env file",
          },
          "Transcription failed",
          500,
        );
      }
    } catch (error) {
      next(error);
    }
  }

  static async getRecordingDetails(req, res, next) {
    try {
      const recording = await VoiceRecordingModel.findById(
        req.params.id,
        req.user.user_id,
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
          transcribed_at: recording.transcribed_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createNoteFromRecording(req, res, next) {
    try {
      const { title, tags } = req.body;

      const recording = await VoiceRecordingModel.findById(
        req.params.id,
        req.user.user_id,
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      if (!recording.transcription_text) {
        throw new ValidationError("Recording must be transcribed first");
      }

      // Create note with transcription as content
      const note = await NoteModel.create(req.user.user_id, {
        title: title || `Voice Note - ${new Date().toLocaleString()}`,
        content: recording.transcription_text,
        voice_recording_id: recording.recording_id,
      });

      // Add tags if provided
      if (tags && tags.length > 0) {
        await NoteModel.addTags(note.note_id, tags);
      }

      // Fetch complete note with tags
      const completeNote = await NoteModel.findById(
        note.note_id,
        req.user.user_id,
      );

      return successResponse(
        res,
        {
          note: completeNote,
          recording_id: recording.recording_id,
        },
        "Note created from voice recording successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  static async createTasksFromRecording(req, res, next) {
    try {
      const { auto_create = false, category_id } = req.body;

      const recording = await VoiceRecordingModel.findById(
        req.params.id,
        req.user.user_id,
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      if (!recording.transcription_text) {
        throw new ValidationError("Recording must be transcribed first");
      }

      // Extract tasks using AI
      const extractedTasks = await aiService.extractTasks(recording);

      if (!auto_create) {
        return successResponse(res, {
          recording_id: recording.recording_id,
          extracted_tasks: extractedTasks,
          message:
            "Tasks extracted. Set auto_create=true to save them automatically.",
        });
      }

      // Create tasks automatically
      const tasksToCreate = extractedTasks.map((task) => ({
        title: task.title,
        description:
          task.description || recording.transcription_text.substring(0, 500),
        priority: task.priority || "medium",
        category_id: category_id || null,
      }));

      const createdTasks = await TaskModel.bulkCreate(
        req.user.user_id,
        tasksToCreate,
      );

      return successResponse(
        res,
        {
          recording_id: recording.recording_id,
          tasks: createdTasks,
          count: createdTasks.length,
        },
        "Tasks created from voice recording successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteRecording(req, res, next) {
    try {
      const recording = await VoiceRecordingModel.findById(
        req.params.id,
        req.user.user_id,
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      // Delete file from disk
      try {
        await fsPromises.unlink(recording.file_path);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }

      await VoiceRecordingModel.delete(req.params.id, req.user.user_id);

      return successResponse(res, null, "Recording deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * PREVIEW: Extract tasks/notes without creating them (for user review)
   */
  static async previewExtraction(req, res, next) {
    try {
      const { recording_id, extraction_type = "both" } = req.body;

      if (!recording_id) {
        throw new ValidationError("Recording ID is required");
      }

      const recording = await VoiceRecordingModel.findById(
        recording_id,
        req.user.user_id,
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      if (!recording.transcription_text) {
        throw new ValidationError("Recording must be transcribed first");
      }

      console.log("🔍 Previewing extraction...");

      let result = {};

      if (extraction_type === "tasks" || extraction_type === "both") {
        // Extract tasks using AI
        const extractedData = await aiService.extractTasksAndNotes(recording);
        result.tasks = extractedData.tasks || [];
      }

      if (extraction_type === "notes" || extraction_type === "both") {
        // Extract notes using AI
        const extractedData = await aiService.extractTasksAndNotes(recording);
        result.notes = extractedData.notes || [];
      }

      return successResponse(res, {
        recording_id,
        transcription: recording.transcription_text,
        preview: result,
        message: "Preview generated. Use create-from-preview endpoint to save.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * CREATE FROM PREVIEW: Create tasks/notes from previewed extraction
   */
  static async createFromPreview(req, res, next) {
    try {
      const { recording_id, tasks = [], notes = [], category_id } = req.body;

      if (!recording_id) {
        throw new ValidationError("Recording ID is required");
      }

      const recording = await VoiceRecordingModel.findById(
        recording_id,
        req.user.user_id,
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      const userId = req.user.user_id;
      const result = {
        recording_id,
        created: {
          tasks: [],
          notes: [],
        },
      };

      // Create tasks
      if (tasks && tasks.length > 0) {
        console.log(`✅ Creating ${tasks.length} tasks...`);

        for (const taskData of tasks) {
          try {
            // Create main task
            const task = await TaskModel.create(userId, {
              title: taskData.title,
              description:
                taskData.description ||
                recording.transcription_text.substring(0, 500),
              priority: taskData.priority || "medium",
              due_date: taskData.due_date || null,
              category_id: category_id || null,
            });

            // Create subtasks if any
            if (taskData.subtasks && taskData.subtasks.length > 0) {
              for (const subtaskData of taskData.subtasks) {
                await TaskModel.createSubtask(userId, task.task_id, {
                  title: subtaskData.title,
                  description: subtaskData.description || null,
                });
              }
            }

            // Fetch complete task with subtasks
            const completeTask = await TaskModel.getTaskWithSubtasks(
              task.task_id,
              userId,
            );
            result.created.tasks.push(completeTask);
          } catch (taskError) {
            console.error("Failed to create task:", taskError);
          }
        }
      }

      // Create notes
      if (notes && notes.length > 0) {
        console.log(`📝 Creating ${notes.length} notes...`);

        for (const noteData of notes) {
          try {
            const note = await NoteModel.create(userId, {
              title:
                noteData.title || `Voice Note - ${new Date().toLocaleString()}`,
              content: noteData.content || recording.transcription_text,
              voice_recording_id: recording.recording_id,
            });

            // Add tags if provided
            if (noteData.tags && noteData.tags.length > 0) {
              await NoteModel.addTags(note.note_id, noteData.tags);
            }

            const completeNote = await NoteModel.findById(note.note_id, userId);
            result.created.notes.push(completeNote);
          } catch (noteError) {
            console.error("Failed to create note:", noteError);
          }
        }
      }

      console.log("🎉 Creation completed!");
      console.log(
        `   📊 Created: ${result.created.tasks.length} tasks, ${result.created.notes.length} notes`,
      );

      return successResponse(res, result, "Items created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE TRANSCRIPTION: Allow user to edit transcription before conversion
   */
  static async updateTranscription(req, res, next) {
    try {
      const { recording_id, transcription } = req.body;

      if (!recording_id || !transcription) {
        throw new ValidationError(
          "Recording ID and transcription are required",
        );
      }

      const recording = await VoiceRecordingModel.findById(
        recording_id,
        req.user.user_id,
      );

      if (!recording) {
        throw new NotFoundError("Recording not found");
      }

      // Update transcription
      await VoiceRecordingModel.updateTranscription(
        recording_id,
        transcription,
      );

      return successResponse(
        res,
        {
          recording_id,
          transcription,
        },
        "Transcription updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * ONE-CLICK: Upload + Transcribe + Extract Tasks & Notes + Create Everything
   * This is the main endpoint for voice-to-everything workflow
   */
  static async processVoiceComplete(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError("No audio file uploaded");
      }

      const {
        language = "ar",
        category_id,
        auto_create_tasks = true,
        auto_create_notes = true,
      } = req.body;
      const userId = req.user.user_id;

      console.log("🎙️ Starting complete voice processing...");

      // Step 1: Save recording
      console.log("📝 Step 1: Saving recording...");
      const recording = await VoiceRecordingModel.create(userId, {
        file_path: req.file.path,
        file_size: req.file.size,
        format: req.file.mimetype,
        duration: null,
      });

      // Step 2: Transcribe audio
      console.log("🎤 Step 2: Transcribing audio...");
      let transcriptionText;
      let transcriptId;

      try {
        const transResult = await aiService.transcribeAudio(
          recording.file_path,
          language,
        );
        transcriptionText = transResult.text || transResult;
        transcriptId = transResult.id;

        await VoiceRecordingModel.updateTranscription(
          recording.recording_id,
          transcriptionText,
        );
      } catch (transcriptionError) {
        console.error("Transcription failed:", transcriptionError);
        return successResponse(
          res,
          {
            recording_id: recording.recording_id,
            error: "Transcription failed",
            message: transcriptionError.message,
            suggestion: "Please check AssemblyAI API key configuration",
          },
          "Recording saved but transcription failed",
          500,
        );
      }

      // Step 3: Extract tasks and notes using AI
      console.log("🤖 Step 3: Extracting tasks and notes with AI...");
      let extractedData;
      try {
        // Pass context including transcriptId to avoid re-transcription if possible
        const extractionContext = {
          ...recording,
          transcriptId,
          transcription_text: transcriptionText,
          file_path: recording.file_path,
        };
        extractedData = await aiService.extractTasksAndNotes(extractionContext);
      } catch (aiError) {
        console.error("AI extraction failed:", aiError);
        return successResponse(
          res,
          {
            recording_id: recording.recording_id,
            transcription: transcriptionText,
            error: "AI extraction failed",
            message: aiError.message,
          },
          "Transcription completed but AI extraction failed",
          500,
        );
      }

      const result = {
        recording_id: recording.recording_id,
        transcription: transcriptionText,
        extracted: extractedData,
        created: {
          tasks: [],
          notes: [],
        },
      };

      // Step 4: Create tasks automatically
      if (
        auto_create_tasks &&
        extractedData.tasks &&
        extractedData.tasks.length > 0
      ) {
        console.log(
          `✅ Step 4: Creating ${extractedData.tasks.length} tasks...`,
        );

        for (const taskData of extractedData.tasks) {
          try {
            // Create main task
            const task = await TaskModel.create(userId, {
              title: taskData.title,
              description:
                taskData.description || transcriptionText.substring(0, 500),
              priority: taskData.priority || "medium",
              due_date: taskData.due_date || null,
              category_id: category_id || null,
            });

            // Send notification for task created from voice
            await NotificationService.notifyVoiceToTaskCreated(userId, task);

            // Create subtasks if any
            if (taskData.subtasks && taskData.subtasks.length > 0) {
              console.log(
                `  📋 Creating ${taskData.subtasks.length} subtasks for task ${task.task_id}...`,
              );
              for (const subtaskData of taskData.subtasks) {
                await TaskModel.createSubtask(userId, task.task_id, {
                  title: subtaskData.title,
                  description: subtaskData.description || null,
                });
              }
            }

            // Fetch complete task with subtasks
            const completeTask = await TaskModel.getTaskWithSubtasks(
              task.task_id,
              userId,
            );
            result.created.tasks.push(completeTask);
          } catch (taskError) {
            console.error("Failed to create task:", taskError);
          }
        }
      }

      // Step 5: Create notes automatically
      if (
        auto_create_notes &&
        extractedData.notes &&
        extractedData.notes.length > 0
      ) {
        console.log(
          `📝 Step 5: Creating ${extractedData.notes.length} notes...`,
        );

        for (const noteData of extractedData.notes) {
          try {
            const note = await NoteModel.create(userId, {
              title:
                noteData.title || `Voice Note - ${new Date().toLocaleString()}`,
              content: noteData.content || transcriptionText,
              voice_recording_id: recording.recording_id,
            });

            // Add tags if provided
            if (noteData.tags && noteData.tags.length > 0) {
              await NoteModel.addTags(note.note_id, noteData.tags);
            }

            const completeNote = await NoteModel.findById(note.note_id, userId);
            result.created.notes.push(completeNote);
          } catch (noteError) {
            console.error("Failed to create note:", noteError);
          }
        }
      }

      console.log("🎉 Voice processing completed successfully!");
      console.log(
        `   📊 Created: ${result.created.tasks.length} tasks, ${result.created.notes.length} notes`,
      );

      // Send notification for voice processing completion
      if (result.created.tasks.length > 0 || result.created.notes.length > 0) {
        await NotificationService.notifyVoiceProcessed(userId, recording);
      }

      return successResponse(res, result, "Voice processed successfully", 201);
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file) {
        await fsPromises.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  }
}

export default VoiceController;
