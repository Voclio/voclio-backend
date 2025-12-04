const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/task.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createTaskValidator,
  updateTaskValidator,
  bulkCreateValidator,
  getTasksValidator
} = require('../validators/task.validator');

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.get('/', getTasksValidator, TaskController.getAllTasks);
router.get('/stats', TaskController.getStats);
router.get('/by-date', TaskController.getTasksByDate);
router.get('/by-category', TaskController.getTasksByCategory);
router.get('/:id', TaskController.getTaskById);
router.post('/', createTaskValidator, TaskController.createTask);
router.post('/bulk', bulkCreateValidator, TaskController.bulkCreateTasks);
router.put('/:id', updateTaskValidator, TaskController.updateTask);
router.put('/:id/complete', TaskController.markComplete);
router.delete('/:id', TaskController.deleteTask);

module.exports = router;
