const express = require('express');
const router = express.Router();
const NoteController = require('../controllers/note.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createNoteValidator,
  updateNoteValidator,
  searchNotesValidator,
  addTagsValidator
} = require('../validators/note.validator');

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

module.exports = router;
