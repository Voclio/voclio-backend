import { validationResult } from 'express-validator';
import NoteModel from '../models/note.model.js';
import aiService from '../services/ai.service.js';
import { successResponse, paginatedResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import TaskModel from '../models/task.model.js';
import { buildVoiceTaskFallback } from '../utils/voiceTaskFallback.js';
class NoteController {
  static async getAllNotes(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const notes = await NoteModel.findAll(req.user.user_id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      const total = await NoteModel.count(req.user.user_id, search);

      return paginatedResponse(res, notes, {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNoteById(req, res, next) {
    try {
      const note = await NoteModel.findById(req.params.id, req.user.user_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      return successResponse(res, { note });
    } catch (error) {
      next(error);
    }
  }

  static async createNote(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const { title, content, voice_recording_id, tags } = req.body;

      const note = await NoteModel.create(req.user.user_id, {
        title,
        content,
        voice_recording_id
      });

      // Add tags if provided
      if (tags && tags.length > 0) {
        await NoteModel.addTags(note.note_id, tags);
      }

      // Fetch complete note with tags
      const completeNote = await NoteModel.findById(note.note_id, req.user.user_id);

      return successResponse(res, { note: completeNote }, 'Note created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateNote(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const { title, content, tags } = req.body;

      const note = await NoteModel.update(req.params.id, req.user.user_id, {
        title,
        content
      });

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      // Update tags if provided
      if (tags) {
        await NoteModel.addTags(note.note_id, tags);
      }

      // Fetch updated note with tags
      const updatedNote = await NoteModel.findById(note.note_id, req.user.user_id);

      return successResponse(res, { note: updatedNote }, 'Note updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteNote(req, res, next) {
    try {
      const note = await NoteModel.delete(req.params.id, req.user.user_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      return successResponse(res, null, 'Note deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async summarizeNote(req, res, next) {
    try {
      const note = await NoteModel.findById(req.params.id, req.user.user_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      const summary = await aiService.summarizeText(note.content);

      return successResponse(
        res,
        {
          note_id: note.note_id,
          summary
        },
        'Note summarized successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async extractTasks(req, res, next) {
    try {
      const {
        auto_create = false,
        category_id,
        default_due_if_missing = false,
        voice_recording_id,
        discard_staging_note = false
      } = req.body;

      const note = await NoteModel.findById(req.params.id, req.user.user_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      console.log('📝 Extracting tasks from note:', note.note_id);
      console.log('Content:', note.content);

      let extractedTasks = await aiService.extractTasks(note.content);

      const shouldFallback =
        auto_create &&
        (default_due_if_missing === true ||
          default_due_if_missing === 'true' ||
          voice_recording_id) &&
        (!extractedTasks || extractedTasks.length === 0);

      if (shouldFallback) {
        const fallbackTask = buildVoiceTaskFallback(note.content);
        extractedTasks = fallbackTask
          ? [fallbackTask]
          : [
              {
                title: note.content.substring(0, 200).trim() || 'Voice task',
                priority: 'medium'
              }
            ];
        console.log('📌 Using voice task fallback:', extractedTasks[0]?.title);
      }

      console.log('🤖 AI extracted tasks:', extractedTasks.length);
      console.log('Tasks:', JSON.stringify(extractedTasks, null, 2));

      if (!auto_create) {
        return successResponse(
          res,
          {
            note_id: note.note_id,
            extracted_tasks: extractedTasks,
            message: 'Tasks extracted. Set auto_create=true to save them automatically.'
          },
          'Tasks extracted successfully'
        );
      }

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      // Auto-create tasks - ensure category_id is valid or null
      const tasksToCreate = extractedTasks.map(task => {
        const taskData = {
          title: task.title,
          description: task.description || note.content.substring(0, 500),
          priority: task.priority || 'medium',
          due_date: task.due_date || (default_due_if_missing ? endOfToday : null),
          note_id: discard_staging_note ? null : note.note_id
        };

        if (category_id) {
          taskData.category_id = category_id;
        }

        if (voice_recording_id) {
          taskData.voice_recording_id = voice_recording_id;
        }

        return taskData;
      });

      console.log('💾 Creating tasks:', tasksToCreate.length);

      const createdTasks = await TaskModel.bulkCreate(req.user.user_id, tasksToCreate);

      console.log('✅ Created tasks:', createdTasks.length);

      if (discard_staging_note) {
        await NoteModel.delete(note.note_id, req.user.user_id);
      }

      return successResponse(
        res,
        {
          note_id: note.note_id,
          tasks: createdTasks,
          count: createdTasks.length
        },
        'Tasks created successfully',
        201
      );
    } catch (error) {
      console.error('❌ Extract tasks error:', error);
      next(error);
    }
  }

  static async addTags(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const { tags } = req.body;

      // Verify note exists and belongs to user
      const note = await NoteModel.findById(req.params.id, req.user.user_id);
      if (!note) {
        throw new NotFoundError('Note not found');
      }

      await NoteModel.addTags(req.params.id, tags);

      const updatedNote = await NoteModel.findById(req.params.id, req.user.user_id);

      return successResponse(res, { note: updatedNote }, 'Tags added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getNoteTags(req, res, next) {
    try {
      const note = await NoteModel.findById(req.params.id, req.user.user_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      return successResponse(res, {
        note_id: note.note_id,
        tags: note.tags || []
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeTag(req, res, next) {
    try {
      const { id: noteId, tagId } = req.params;

      // Verify note exists and belongs to user
      const note = await NoteModel.findById(noteId, req.user.user_id);
      if (!note) {
        throw new NotFoundError('Note not found');
      }

      await NoteModel.removeTag(noteId, tagId);

      const updatedNote = await NoteModel.findById(noteId, req.user.user_id);

      return successResponse(res, { note: updatedNote }, 'Tag removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default NoteController;
