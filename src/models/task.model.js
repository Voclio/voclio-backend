const pool = require('../config/database');

class TaskModel {
  static async create(userId, taskData) {
    const { title, description, due_date, priority, category_id, note_id } = taskData;
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, due_date, priority, category_id, note_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, title, description || null, due_date || null, priority || 'medium', category_id || null, note_id || null]
    );
    return result.rows[0];
  }

  static async bulkCreate(userId, tasksData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tasks = [];

      for (const taskData of tasksData) {
        const { title, description, due_date, priority, category_id } = taskData;
        const result = await client.query(
          `INSERT INTO tasks (user_id, title, description, due_date, priority, category_id) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [userId, title, description || null, due_date || null, priority || 'medium', category_id || null]
        );
        tasks.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return tasks;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll(userId, filters = {}) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    if (filters.priority) {
      params.push(filters.priority);
      query += ` AND priority = $${params.length}`;
    }

    if (filters.category_id) {
      params.push(filters.category_id);
      query += ` AND category_id = $${params.length}`;
    }

    if (filters.due_date) {
      params.push(filters.due_date);
      query += ` AND DATE(due_date) = $${params.length}`;
    }

    query += ' ORDER BY due_date ASC NULLS LAST, created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(taskId, userId) {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE task_id = $1 AND user_id = $2',
      [taskId, userId]
    );
    return result.rows[0];
  }

  static async update(taskId, userId, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${index}`);
      values.push(updates[key]);
      index++;
    });

    values.push(taskId, userId);
    const result = await pool.query(
      `UPDATE tasks 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE task_id = $${index} AND user_id = $${index + 1}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async markComplete(taskId, userId) {
    const result = await pool.query(
      `UPDATE tasks 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE task_id = $1 AND user_id = $2
       RETURNING *`,
      [taskId, userId]
    );
    return result.rows[0];
  }

  static async delete(taskId, userId) {
    const result = await pool.query(
      'DELETE FROM tasks WHERE task_id = $1 AND user_id = $2 RETURNING *',
      [taskId, userId]
    );
    return result.rows[0];
  }

  static async getStats(userId) {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'todo') as todo,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE) as completed_today,
         COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue
       FROM tasks 
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = TaskModel;
