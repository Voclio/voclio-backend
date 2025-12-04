const { validationResult } = require('express-validator');
const NoteModel = require('../models/note.model');
const geminiService = require('../services/gemini.service');
const { successResponse, paginatedResponse } = require('../utils/responses');
const { ValidationError, NotFoundError } = require('../utils/errors');

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

      const summary = await geminiService.summarizeText(note.content);

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
      const note = await NoteModel.findById(req.params.id, req.user.user_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      const tasks = await geminiService.extractTasks(note.content);

      return successResponse(res, {
        note_id: note.note_id,
        extracted_tasks: tasks
      }, 'Tasks extracted successfully');

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
}

module.exports = NoteController;
