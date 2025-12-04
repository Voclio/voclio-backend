const express = require('express');
const router = express.Router();
const TagController = require('../controllers/tag.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createTagValidator,
  updateTagValidator,
  tagIdValidator
} = require('../validators/tag.validator');

// All routes require authentication
router.use(authMiddleware);

router.get('/', TagController.getAllTags);
router.post('/', createTagValidator, TagController.createTag);
router.put('/:id', updateTagValidator, TagController.updateTag);
router.delete('/:id', tagIdValidator, TagController.deleteTag);

module.exports = router;
