import { FocusSession, ProductivityStreak, Achievement, Task, sequelize } from './orm/index.js';
import { Op } from 'sequelize';

class ProductivityModel {
  static async createFocusSession(userId, sessionData) {
    const session = await FocusSession.create({
      user_id: userId,
      timer_duration: sessionData.timer_duration || 25,
      ambient_sound: sessionData.ambient_sound || null,
      sound_volume: sessionData.sound_volume || 50,
      status: 'active',
      ...sessionData
    });
    return session.toJSON();
  }

  static async updateFocusSession(sessionId, userId, updates) {
    const session = await FocusSession.findOne({
      where: { session_id: sessionId, user_id: userId }
    });
    
    if (!session) return null;
    
    await session.update(updates);
    return session.toJSON();
  }

  static async endFocusSession(sessionId, userId) {
    const session = await FocusSession.findOne({
      where: { session_id: sessionId, user_id: userId }
    });
    
    if (!session) return null;
    
    await session.update({
      status: 'completed',
      ended_at: new Date()
    });
    return session.toJSON();
  }

  static async findFocusSessions(userId, options = {}) {
    const { page = 1, limit = 20, start_date, end_date } = options;
    const offset = (page - 1) * limit;

    const where = { user_id: userId };

    if (start_date) {
      where.started_at = { [Op.gte]: new Date(start_date) };
    }

    if (end_date) {
      if (where.started_at) {
        where.started_at[Op.lte] = new Date(end_date);
      } else {
        where.started_at = { [Op.lte]: new Date(end_date) };
      }
    }

    const sessions = await FocusSession.findAll({
      where,
      order: [['started_at', 'DESC']],
      limit,
      offset
    });
    
    return sessions.map(s => s.toJSON());
  }

  static async getStreak(userId) {
    const streak = await ProductivityStreak.findOne({
      where: { user_id: userId },
      order: [['streak_date', 'DESC']]
    });
    return streak ? streak.toJSON() : null;
  }

  static async updateStreak(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const [streak, created] = await ProductivityStreak.findOrCreate({
      where: { user_id: userId, streak_date: today },
      defaults: {
        user_id: userId,
        streak_date: today,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        total_points: 10
      }
    });

    if (!created) {
      await streak.update({
        current_streak: streak.current_streak + 1,
        longest_streak: Math.max(streak.longest_streak, streak.current_streak + 1),
        last_activity_date: today,
        total_points: streak.total_points + 10
      });
    }

    return streak.toJSON();
  }

  static async getAchievements(userId) {
    const achievements = await Achievement.findAll({
      where: { user_id: userId },
      order: [['earned_at', 'DESC']]
    });
    return achievements.map(a => a.toJSON());
  }

  static async createAchievement(userId, achievementData) {
    const achievement = await Achievement.create({
      user_id: userId,
      ...achievementData
    });
    return achievement.toJSON();
  }

  static async getProductivitySummary(userId, startDate, endDate) {
    const sessions = await FocusSession.findAll({
      where: {
        user_id: userId,
        started_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.fn('DATE', sequelize.col('started_at')))), 'focus_days'],
        [sequelize.fn('SUM', sequelize.col('elapsed_time')), 'total_focus_minutes'],
        [sequelize.fn('COUNT', sequelize.col('session_id')), 'total_sessions'],
        [sequelize.fn('AVG', sequelize.col('elapsed_time')), 'avg_session_minutes']
      ],
      raw: true
    });

    const tasksCompleted = await Task.count({
      where: {
        user_id: userId,
        status: 'completed',
        completed_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    });

    const currentStreak = await ProductivityStreak.findOne({
      where: { user_id: userId },
      order: [['streak_date', 'DESC']],
      attributes: ['current_streak']
    });

    return {
      focus_days: parseInt(sessions[0]?.focus_days || 0),
      total_focus_minutes: parseInt(sessions[0]?.total_focus_minutes || 0),
      total_sessions: parseInt(sessions[0]?.total_sessions || 0),
      avg_session_minutes: parseFloat(sessions[0]?.avg_session_minutes || 0).toFixed(2),
      tasks_completed: tasksCompleted,
      current_streak: currentStreak?.current_streak || 0
    };
  }
}

export default ProductivityModel;
