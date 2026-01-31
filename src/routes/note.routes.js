import express from 'express';
import NoteController from '../controllers/note.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  createNoteValidator,
  updateNoteValidator,
  searchNotesValidator,
  addTagsValidator
} from '../validators/note.validator.js';

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.get('/', searchNotesValidator, NoteController.getAllNotes);
router.get('/:id', NoteController.getNoteById);
router.post('/', createNoteValidator, NoteController.createNote);
router.put('/:id', updateNoteValidator, NoteController.updateNote);
router.delete('/:id', NoteController.deleteNote);

// AI features
router.post('/:id/summarize', NoteController.summarizeNote);
router.post('/:id/extract-tasks', NoteController.extractTasks);

// Tags
router.get('/:id/tags', NoteController.getNoteTags);
router.post('/:id/tags', addTagsValidator, NoteController.addTags);
router.delete('/:id/tags/:tagId', NoteController.removeTag);

export default router;
