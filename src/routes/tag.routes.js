import express from 'express';
import TagController from '../controllers/tag.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  createTagValidator,
  updateTagValidator,
  tagIdValidator
} from '../validators/tag.validator.js';

// All routes require authentication
router.use(authMiddleware);

router.get('/', TagController.getAllTags);
router.get('/:id', tagIdValidator, TagController.getTagById);
router.post('/', createTagValidator, TagController.createTag);
router.put('/:id', updateTagValidator, TagController.updateTag);
router.delete('/:id', tagIdValidator, TagController.deleteTag);

export default router;
