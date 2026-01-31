import express from 'express';
import TaskController from '../controllers/task.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  createTaskValidator,
  updateTaskValidator,
  bulkCreateValidator,
  getTasksValidator,
  createSubtaskValidator,
  taskIdValidator
} from '../validators/task.validator.js';

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.get('/', getTasksValidator, TaskController.getAllTasks);
router.get('/main', getTasksValidator, TaskController.getMainTasks);
router.get('/stats', TaskController.getStats);
router.get('/by-date', TaskController.getTasksByDate);
router.get('/by-category', TaskController.getTasksByCategory);
router.get('/:id', taskIdValidator, TaskController.getTaskById);
router.get('/:id/with-subtasks', taskIdValidator, TaskController.getTaskWithSubtasks);
router.get('/:id/subtasks', taskIdValidator, TaskController.getSubtasks);
router.post('/', createTaskValidator, TaskController.createTask);
router.post('/bulk', bulkCreateValidator, TaskController.bulkCreateTasks);
router.post('/:id/subtasks', createSubtaskValidator, TaskController.createSubtask);
router.put('/:id', updateTaskValidator, TaskController.updateTask);
router.put('/:id/complete', TaskController.markComplete);
router.delete('/:id', TaskController.deleteTask);

export default router;
