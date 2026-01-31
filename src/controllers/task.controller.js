import { validationResult } from 'express-validator';
import TaskModel from '../models/task.model.js';
import { successResponse } from '../utils/responses.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import NotificationService from '../services/notification.service.js';
class TaskController {
  static async getAllTasks(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        category_id: req.query.category_id,
        due_date: req.query.due_date
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const tasks = await TaskModel.findAll(req.user.user_id, filters);

      return successResponse(res, { tasks });

    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.id, req.user.user_id);

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      return successResponse(res, { task });

    } catch (error) {
      next(error);
    }
  }

  static async createTask(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const task = await TaskModel.create(req.user.user_id, req.body);

      // Send notification
      await NotificationService.notifyTaskCreated(req.user.user_id, task);

      return successResponse(res, { task }, 'Task created successfully', 201);

    } catch (error) {
      next(error);
    }
  }

  static async bulkCreateTasks(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const { tasks: tasksData } = req.body;

      const tasks = await TaskModel.bulkCreate(req.user.user_id, tasksData);

      return successResponse(res, { tasks }, `${tasks.length} tasks created successfully`, 201);

    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const updates = {};
      ['title', 'description', 'due_date', 'status', 'priority', 'category_id'].forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const task = await TaskModel.update(req.params.id, req.user.user_id, updates);

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Send notification
      await NotificationService.notifyTaskUpdated(req.user.user_id, task);

      return successResponse(res, { task }, 'Task updated successfully');

    } catch (error) {
      next(error);
    }
  }

  static async markComplete(req, res, next) {
    try {
      const task = await TaskModel.markComplete(req.params.id, req.user.user_id);

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Send notification
      await NotificationService.notifyTaskCompleted(req.user.user_id, task);

      return successResponse(res, { task }, 'Task marked as complete');

    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const task = await TaskModel.delete(req.params.id, req.user.user_id);

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      return successResponse(res, null, 'Task deleted successfully');

    } catch (error) {
      next(error);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await TaskModel.getStats(req.user.user_id);
      
      // Calculate overall progress percentage
      const total = parseInt(stats.total) || 0;
      const completed = parseInt(stats.completed) || 0;
      const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return successResponse(res, { 
        stats: {
          ...stats,
          overall_progress: overallProgress,
          completion_rate: overallProgress
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getTasksByDate(req, res, next) {
    try {
      const { date } = req.query;

      if (!date) {
        throw new ValidationError('Date parameter is required');
      }

      const tasks = await TaskModel.findAll(req.user.user_id, { due_date: date });

      return successResponse(res, { tasks, date });

    } catch (error) {
      next(error);
    }
  }

  static async getTasksByCategory(req, res, next) {
    try {
      const { category_id } = req.query;

      if (!category_id) {
        throw new ValidationError('Category ID parameter is required');
      }

      const tasks = await TaskModel.findAll(req.user.user_id, { category_id });

      return successResponse(res, { tasks, category_id });

    } catch (error) {
      next(error);
    }
  }

  static async createSubtask(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid request data', errors.mapped());
      }

      const subtask = await TaskModel.createSubtask(
        req.user.user_id, 
        req.params.id, 
        req.body
      );

      return successResponse(res, { subtask }, 'Subtask created successfully', 201);

    } catch (error) {
      if (error.message === 'Parent task not found') {
        next(new NotFoundError('Parent task not found'));
      } else {
        next(error);
      }
    }
  }

  static async getSubtasks(req, res, next) {
    try {
      const subtasks = await TaskModel.getSubtasks(req.params.id, req.user.user_id);

      return successResponse(res, { 
        parent_task_id: parseInt(req.params.id),
        subtasks,
        count: subtasks.length
      });

    } catch (error) {
      if (error.message === 'Parent task not found') {
        next(new NotFoundError('Parent task not found'));
      } else {
        next(error);
      }
    }
  }

  static async getTaskWithSubtasks(req, res, next) {
    try {
      const taskWithSubtasks = await TaskModel.getTaskWithSubtasks(req.params.id, req.user.user_id);

      if (!taskWithSubtasks) {
        throw new NotFoundError('Task not found');
      }

      return successResponse(res, { task: taskWithSubtasks });

    } catch (error) {
      next(error);
    }
  }

  static async getMainTasks(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        category_id: req.query.category_id
      };

      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const tasks = await TaskModel.getMainTasks(req.user.user_id, filters);

      return successResponse(res, { 
        tasks,
        count: tasks.length,
        type: 'main_tasks_only'
      });

    } catch (error) {
      next(error);
    }
  }
}

export default TaskController;
