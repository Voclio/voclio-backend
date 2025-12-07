const TaskModel = require('../models/task.model');
const NoteModel = require('../models/note.model');
const ReminderModel = require('../models/reminder.model');
const ProductivityModel = require('../models/productivity.model');
const VoiceRecordingModel = require('../models/voice.model');
const pool = require('../config/database');
const { successResponse } = require('../utils/responses');

class DashboardController {
  static async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.user_id;

      // Get task statistics with progress
      const taskStats = await TaskModel.getStats(userId);
      const totalTasks = parseInt(taskStats.total) || 0;
      const completedTasks = parseInt(taskStats.completed) || 0;
      const overallProgress = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

      // Get upcoming tasks (next 7 days)
      const upcomingTasks = await pool.query(
        `SELECT task_id, title, due_date, priority, status, category_id
         FROM tasks 
         WHERE user_id = $1 
         AND status != 'completed'
         AND due_date IS NOT NULL
         AND due_date >= CURRENT_DATE
         AND due_date <= CURRENT_DATE + INTERVAL '7 days'
         ORDER BY due_date ASC
         LIMIT 5`,
        [userId]
      );

      // Get recent notes
      const recentNotes = await pool.query(
        `SELECT note_id, title, content, created_at
         FROM notes 
         WHERE user_id = $1 
         ORDER BY created_at DESC
         LIMIT 3`,
        [userId]
      );

      // Get productivity streak
      const streak = await ProductivityModel.getStreak(userId);

      // Get today's focus time
      const todayFocus = await pool.query(
        `SELECT COALESCE(SUM(elapsed_time), 0) as total_minutes
         FROM focus_sessions
         WHERE user_id = $1
         AND DATE(started_at) = CURRENT_DATE`,
        [userId]
      );

      // Get upcoming reminders
      const upcomingReminders = await ReminderModel.findUpcoming(userId);

      // Get notes count
      const notesCount = await pool.query(
        'SELECT COUNT(*) FROM notes WHERE user_id = $1',
        [userId]
      );

      // Get voice recordings count
      const voiceCount = await pool.query(
        'SELECT COUNT(*) FROM voice_recordings WHERE user_id = $1',
        [userId]
      );

      // Get achievements count
      const achievementsCount = await pool.query(
        'SELECT COUNT(*) FROM achievements WHERE user_id = $1',
        [userId]
      );

      return successResponse(res, {
        overview: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          pending_tasks: parseInt(taskStats.todo) + parseInt(taskStats.in_progress),
          overdue_tasks: parseInt(taskStats.overdue),
          overall_progress: overallProgress,
          total_notes: parseInt(notesCount.rows[0].count),
          total_recordings: parseInt(voiceCount.rows[0].count),
          total_achievements: parseInt(achievementsCount.rows[0].count)
        },
        upcoming_tasks: upcomingTasks.rows,
        recent_notes: recentNotes.rows.map(note => ({
          note_id: note.note_id,
          title: note.title,
          preview: note.content ? note.content.substring(0, 100) + '...' : '',
          created_at: note.created_at
        })),
        productivity: {
          current_streak: streak ? streak.current_streak : 0,
          longest_streak: streak ? streak.longest_streak : 0,
          today_focus_minutes: parseInt(todayFocus.rows[0].total_minutes) || 0
        },
        upcoming_reminders: upcomingReminders.slice(0, 3),
        quick_actions: [
          { id: 'record_voice', label: 'Record Voice Note', icon: 'microphone' },
          { id: 'create_task', label: 'Create Task', icon: 'check-circle' },
          { id: 'view_calendar', label: 'View Calendar', icon: 'calendar' },
          { id: 'create_note', label: 'Create Note', icon: 'file-text' }
        ]
      });

    } catch (error) {
      next(error);
    }
  }

  static async getQuickStats(req, res, next) {
    try {
      const userId = req.user.user_id;

      const stats = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM tasks WHERE user_id = $1) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'completed') as completed_tasks,
          (SELECT COUNT(*) FROM notes WHERE user_id = $1) as total_notes,
          (SELECT COUNT(*) FROM reminders WHERE user_id = $1) as total_reminders,
          (SELECT COUNT(*) FROM focus_sessions WHERE user_id = $1) as focus_sessions,
          (SELECT COALESCE(SUM(elapsed_time), 0) FROM focus_sessions WHERE user_id = $1) as total_focus_minutes`,
        [userId]
      );

      const data = stats.rows[0];
      const totalTasks = parseInt(data.total_tasks) || 0;
      const completedTasks = parseInt(data.completed_tasks) || 0;

      return successResponse(res, {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          progress_percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        notes: parseInt(data.total_notes) || 0,
        reminders: parseInt(data.total_reminders) || 0,
        productivity: {
          sessions: parseInt(data.focus_sessions) || 0,
          total_minutes: parseInt(data.total_focus_minutes) || 0,
          total_hours: Math.round((parseInt(data.total_focus_minutes) || 0) / 60 * 10) / 10
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
