import { Task, sequelize } from './orm/index.js';
import { Op } from 'sequelize';

class TaskModel {
  static async create(userId, taskData) {
    const task = await Task.create({
      user_id: userId,
      ...taskData
    });
    return task.toJSON();
  }

  static async bulkCreate(userId, tasksData) {
    const transaction = await sequelize.transaction();
    try {
      const tasks = await Task.bulkCreate(
        tasksData.map(taskData => ({
          user_id: userId,
          ...taskData
        })),
        { transaction }
      );
      
      await transaction.commit();
      return tasks.map(task => task.toJSON());
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async findAll(userId, filters = {}) {
    const where = { user_id: userId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.due_date) {
      where.due_date = {
        [Op.gte]: new Date(filters.due_date).setHours(0, 0, 0, 0),
        [Op.lt]: new Date(filters.due_date).setHours(23, 59, 59, 999)
      };
    }

    const tasks = await Task.findAll({
      where,
      order: [
        [sequelize.literal('due_date IS NULL'), 'ASC'],
        ['due_date', 'ASC'],
        ['created_at', 'DESC']
      ]
    });

    return tasks.map(task => task.toJSON());
  }

  static async findById(taskId, userId) {
    const task = await Task.findOne({
      where: { task_id: taskId, user_id: userId }
    });
    return task ? task.toJSON() : null;
  }

  static async update(taskId, userId, updates) {
    const task = await Task.findOne({
      where: { task_id: taskId, user_id: userId }
    });
    
    if (!task) return null;
    
    await task.update(updates);
    return task.toJSON();
  }

  static async markComplete(taskId, userId) {
    const task = await Task.findOne({
      where: { task_id: taskId, user_id: userId }
    });
    
    if (!task) return null;
    
    await task.update({
      status: 'completed',
      completed_at: new Date()
    });
    return task.toJSON();
  }

  static async delete(taskId, userId) {
    const task = await Task.findOne({
      where: { task_id: taskId, user_id: userId }
    });
    
    if (!task) return null;
    
    const taskData = task.toJSON();
    await task.destroy();
    return taskData;
  }

  static async getStats(userId) {
    const tasks = await Task.findAll({
      where: { user_id: userId },
      attributes: ['status', 'completed_at', 'due_date']
    });

    const today = new Date().setHours(0, 0, 0, 0);
    
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      completed_today: tasks.filter(t => 
        t.status === 'completed' && 
        t.completed_at && 
        new Date(t.completed_at).setHours(0, 0, 0, 0) === today
      ).length,
      overdue: tasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < new Date() && 
        t.status !== 'completed'
      ).length
    };
  }

  static async createSubtask(userId, parentTaskId, subtaskData) {
    const parentTask = await Task.findOne({
      where: { task_id: parentTaskId, user_id: userId }
    });
    
    if (!parentTask) {
      throw new Error('Parent task not found');
    }

    const subtask = await Task.create({
      user_id: userId,
      parent_task_id: parentTaskId,
      ...subtaskData
    });
    
    return subtask.toJSON();
  }

  static async getSubtasks(parentTaskId, userId) {
    const parentTask = await Task.findOne({
      where: { task_id: parentTaskId, user_id: userId }
    });
    
    if (!parentTask) {
      throw new Error('Parent task not found');
    }

    const subtasks = await Task.findAll({
      where: { parent_task_id: parentTaskId, user_id: userId },
      order: [['created_at', 'DESC']]
    });
    
    return subtasks.map(task => task.toJSON());
  }

  static async getTaskWithSubtasks(taskId, userId) {
    const task = await Task.findOne({
      where: { task_id: taskId, user_id: userId }
    });
    
    if (!task) return null;

    const subtasks = await Task.findAll({
      where: { parent_task_id: taskId, user_id: userId },
      order: [['created_at', 'DESC']]
    });
    
    const subtasksData = subtasks.map(st => st.toJSON());
    
    return {
      ...task.toJSON(),
      subtasks: subtasksData,
      subtasks_count: subtasksData.length,
      subtasks_completed: subtasksData.filter(st => st.status === 'completed').length
    };
  }

  static async getMainTasks(userId, filters = {}) {
    const where = { 
      user_id: userId,
      parent_task_id: null
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.category_id) where.category_id = filters.category_id;

    const tasks = await Task.findAll({
      where,
      order: [
        [sequelize.literal('due_date IS NULL'), 'ASC'],
        ['due_date', 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    return tasks.map(task => task.toJSON());
  }
}

export default TaskModel;
