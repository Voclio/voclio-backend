import TaskModel from "../models/task.model.js";
import NoteModel from "../models/note.model.js";
import ReminderModel from "../models/reminder.model.js";
import ProductivityModel from "../models/productivity.model.js";
import {
  User,
  Task,
  Note,
  VoiceRecording,
  Achievement,
  FocusSession,
  sequelize,
} from "../models/orm/index.js";
import { successResponse } from "../utils/responses.js";
import { Op } from "sequelize";

class DashboardController {
  static async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.user_id;

      // Get task statistics with progress
      const taskStats = await TaskModel.getStats(userId);
      const totalTasks = parseInt(taskStats.total) || 0;
      const completedTasks = parseInt(taskStats.completed) || 0;
      const overallProgress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Get upcoming tasks (next 7 days)
      const upcomingTasks = await Task.findAll({
        where: {
          user_id: userId,
          status: { [Op.ne]: "completed" },
          due_date: {
            [Op.and]: [
              { [Op.gte]: new Date() },
              { [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            ],
          },
        },
        attributes: [
          "task_id",
          "title",
          "due_date",
          "priority",
          "status",
          "category_id",
        ],
        order: [["due_date", "ASC"]],
        limit: 5,
        raw: true,
      });

      // Get recent notes
      const recentNotes = await Note.findAll({
        where: { user_id: userId },
        attributes: ["note_id", "title", "content", "created_at"],
        order: [["created_at", "DESC"]],
        limit: 3,
        raw: true,
      });

      // Get productivity streak
      const streak = await ProductivityModel.getStreak(userId);

      // Get today's focus time
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayFocus = await FocusSession.sum("elapsed_time", {
        where: {
          user_id: userId,
          start_time: { [Op.gte]: todayStart },
        },
      });

      // Get upcoming reminders
      const upcomingReminders = await ReminderModel.findUpcoming(userId);

      // Get counts
      const notesCount = await Note.count({ where: { user_id: userId } });
      const voiceCount = await VoiceRecording.count({
        where: { user_id: userId },
      });
      const achievementsCount = await Achievement.count({
        where: { user_id: userId },
      });

      return successResponse(res, {
        overview: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          pending_tasks:
            parseInt(taskStats.todo) + parseInt(taskStats.in_progress),
          overdue_tasks: parseInt(taskStats.overdue),
          overall_progress: overallProgress,
          total_notes: notesCount,
          total_recordings: voiceCount,
          total_achievements: achievementsCount,
        },
        upcoming_tasks: upcomingTasks,
        recent_notes: recentNotes.map((note) => ({
          note_id: note.note_id,
          title: note.title,
          preview: note.content ? note.content.substring(0, 100) + "..." : "",
          created_at: note.created_at,
        })),
        productivity: {
          current_streak: streak ? streak.current_streak : 0,
          longest_streak: streak ? streak.longest_streak : 0,
          today_focus_minutes: parseInt(todayFocus) || 0,
        },
        upcoming_reminders: upcomingReminders.slice(0, 3),
        quick_actions: [
          {
            id: "record_voice",
            label: "Record Voice Note",
            icon: "microphone",
          },
          { id: "create_task", label: "Create Task", icon: "check-circle" },
          { id: "view_calendar", label: "View Calendar", icon: "calendar" },
          { id: "create_note", label: "Create Note", icon: "file-text" },
        ],
      });
    } catch (error) {
      next(error);
    }
  }

  static async getQuickStats(req, res, next) {
    try {
      const userId = req.user.user_id;

      const totalTasks = await Task.count({ where: { user_id: userId } });
      const completedTasks = await Task.count({
        where: { user_id: userId, status: "completed" },
      });
      const totalNotes = await Note.count({ where: { user_id: userId } });
      const totalReminders = await Note.count({ where: { user_id: userId } });
      const focusSessions = await FocusSession.count({
        where: { user_id: userId },
      });
      const totalFocusMinutes =
        (await FocusSession.sum("elapsed_time", {
          where: { user_id: userId },
        })) || 0;

      return successResponse(res, {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          progress_percentage:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        },
        notes: totalNotes,
        reminders: totalReminders,
        productivity: {
          sessions: focusSessions,
          total_minutes: parseInt(totalFocusMinutes),
          total_hours: Math.round((parseInt(totalFocusMinutes) / 60) * 10) / 10,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
