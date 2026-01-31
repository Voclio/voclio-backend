import { validationResult } from 'express-validator';
import NoteModel from '../models/note.model.js';
import aiService from '../services/ai.service.js';
import { successResponse, paginatedResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import TaskModel from '../models/task.model.js';
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

      return successResponse(res, {
        note_id: note.note_id,
        summary
      }, 'Note summarized successfully');

    } catch (error) {
      next(error);
    }
  }

  static async extractTasks(req, res, next) {
    try {
      const { auto_create = false, category_id } = req.body;
      
      const note = await NoteModel.findById(req.params.id, req.user.user_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      const extractedTasks = await aiService.extractTasks(note.content);

      if (!auto_create) {
        return successResponse(res, {
          note_id: note.note_id,
          extracted_tasks: extractedTasks,
          message: 'Tasks extracted. Set auto_create=true to save them automatically.'
        }, 'Tasks extracted successfully');
      }

      // Auto-create tasks
      const tasksToCreate = extractedTasks.map(task => ({
        title: task.title,
        description: task.description || note.content.substring(0, 500),
        priority: task.priority || 'medium',
        category_id: category_id || null,
        note_id: note.note_id
      }));

      const createdTasks = await TaskModel.bulkCreate(req.user.user_id, tasksToCreate);

      return successResponse(res, {
        note_id: note.note_id,
        tasks: createdTasks,
        count: createdTasks.length
      }, 'Tasks created successfully', 201);

    } catch (error) {
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
