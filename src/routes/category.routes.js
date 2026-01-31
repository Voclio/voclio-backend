import express from 'express';
import CategoryController from '../controllers/category.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { body, param } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Validators
const categoryIdValidator = [
  param('id').isInt().withMessage('Invalid category ID')
];

const createCategoryValidator = [
  body('name').notEmpty().trim().withMessage('Category name is required'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  body('description').optional().trim()
];

const updateCategoryValidator = [
  body('name').optional().notEmpty().trim().withMessage('Category name cannot be empty'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  body('description').optional().trim()
];

// Routes
router.get('/', CategoryController.getAllCategories);
router.get('/:id', categoryIdValidator, CategoryController.getCategoryById);
router.get('/:id/stats', categoryIdValidator, CategoryController.getCategoryStats);
router.post('/', createCategoryValidator, CategoryController.createCategory);
router.put('/:id', categoryIdValidator, updateCategoryValidator, CategoryController.updateCategory);
router.delete('/:id', categoryIdValidator, CategoryController.deleteCategory);

export default router;
