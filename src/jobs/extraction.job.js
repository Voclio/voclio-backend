import aiService from '../services/ai.service.js';
import VoiceRecordingModel from '../models/voice.model.js';
import TaskModel from '../models/task.model.js';
import NoteModel from '../models/note.model.js';
import NotificationService from '../services/notification.service.js';
import cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';

/**
 * Extraction Job Processor
 * Handles AI extraction of tasks and notes from transcription
 */
export async function processExtraction(job) {
  const {
    recordingId,
    userId,
    autoCreateTasks = true,
    autoCreateNotes = true,
    categoryId,
    transcriptId
  } = job.data;

  try {
    logger.info(`[Extraction Job ${job.id}] Starting for recording ${recordingId}`);

    await job.updateProgress(10);

    // Get recording from database
    const recording = await VoiceRecordingModel.findById(recordingId, userId);
    if (!recording) {
      throw new Error('Recording not found');
    }

    if (!recording.transcription_text) {
      throw new Error('Recording must be transcribed first');
    }

    await job.updateProgress(20);

    // Extract tasks and notes using AI
    logger.info(`[Extraction Job ${job.id}] Extracting tasks and notes with AI`);

    const extractionContext = {
      ...recording,
      transcriptId,
      transcription_text: recording.transcription_text
    };

    const extractedData = await aiService.extractTasksAndNotes(extractionContext);

    await job.updateProgress(50);

    const result = {
      recordingId,
      extracted: extractedData,
      created: {
        tasks: [],
        notes: []
      }
    };

    // Create tasks automatically
    if (autoCreateTasks && extractedData.tasks && extractedData.tasks.length > 0) {
      logger.info(`[Extraction Job ${job.id}] Creating ${extractedData.tasks.length} tasks`);

      for (const taskData of extractedData.tasks) {
        try {
          // Create main task
          const task = await TaskModel.create(userId, {
            title: taskData.title,
            description: taskData.description || recording.transcription_text.substring(0, 500),
            priority: taskData.priority || 'medium',
            due_date: taskData.due_date || null,
            category_id: categoryId || null,
            voice_recording_id: recordingId
          });

          // Send notification
          await NotificationService.notifyVoiceToTaskCreated(userId, task);

          // Create subtasks if any
          if (taskData.subtasks && taskData.subtasks.length > 0) {
            for (const subtaskData of taskData.subtasks) {
              await TaskModel.createSubtask(userId, task.task_id, {
                title: subtaskData.title,
                description: subtaskData.description || null
              });
            }
          }

          // Fetch complete task with subtasks
          const completeTask = await TaskModel.getTaskWithSubtasks(task.task_id, userId);
          result.created.tasks.push(completeTask);
        } catch (taskError) {
          logger.error(`[Extraction Job ${job.id}] Failed to create task:`, taskError);
        }
      }

      // Invalidate tasks cache
      await cacheService.invalidateUserTasks(userId);
    }

    await job.updateProgress(75);

    // Create notes automatically
    if (autoCreateNotes && extractedData.notes && extractedData.notes.length > 0) {
      logger.info(`[Extraction Job ${job.id}] Creating ${extractedData.notes.length} notes`);

      for (const noteData of extractedData.notes) {
        try {
          const note = await NoteModel.create(userId, {
            title: noteData.title || `Voice Note - ${new Date().toLocaleString()}`,
            content: noteData.content || recording.transcription_text,
            voice_recording_id: recordingId
          });

          // Add tags if provided
          if (noteData.tags && noteData.tags.length > 0) {
            await NoteModel.addTags(note.note_id, noteData.tags);
          }

          const completeNote = await NoteModel.findById(note.note_id, userId);
          result.created.notes.push(completeNote);
        } catch (noteError) {
          logger.error(`[Extraction Job ${job.id}] Failed to create note:`, noteError);
        }
      }
    }

    await job.updateProgress(90);

    // Send completion notification
    if (result.created.tasks.length > 0 || result.created.notes.length > 0) {
      await NotificationService.notifyVoiceProcessed(userId, recording);
    }

    await job.updateProgress(100);

    logger.info(
      `[Extraction Job ${job.id}] Completed: ${result.created.tasks.length} tasks, ${result.created.notes.length} notes`
    );

    return result;
  } catch (error) {
    logger.error(`[Extraction Job ${job.id}] Failed:`, error);
    throw error;
  }
}

export const extractionJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000
  },
  timeout: 180000 // 3 minutes
};
