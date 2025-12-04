const express = require('express');
const router = express.Router();
const TagController = require('../controllers/tag.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/', TagController.getAllTags);
router.post('/', TagController.createTag);
router.put('/:id', TagController.updateTag);
router.delete('/:id', TagController.deleteTag);

module.exports = router;
