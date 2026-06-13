import { FocusSession, ProductivityStreak, Achievement, Task, sequelize } from './orm/index.js';
import { Op } from 'sequelize';
import { ACHIEVEMENT_CATALOG, catalogEntry } from '../utils/achievementCatalog.js';

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.split('T')[0];
  return value.toISOString().split('T')[0];
}

function yesterdayDateOnly() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function todayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

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

    const wasCompleted = session.status === 'completed';
    const nextUpdates = { ...updates };

    if (nextUpdates.status === 'completed' && !wasCompleted) {
      nextUpdates.ended_at = new Date();
      nextUpdates.end_time = new Date();
    }

    await session.update(nextUpdates);

    if (!wasCompleted && session.status === 'completed') {
      await this.handleFocusSessionCompleted(userId, session.toJSON());
    }

    return session.toJSON();
  }

  static async endFocusSession(sessionId, userId) {
    const session = await FocusSession.findOne({
      where: { session_id: sessionId, user_id: userId }
    });

    if (!session) return null;

    if (session.status !== 'completed') {
      await session.update({
        status: 'completed',
        ended_at: new Date(),
        end_time: new Date()
      });
      await this.handleFocusSessionCompleted(userId, session.toJSON());
    }

    return session.toJSON();
  }

  static async handleFocusSessionCompleted(userId, session) {
    await this.updateStreak(userId);
    await this.evaluateAchievements(userId, session);
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

  static async getLatestStreakRecord(userId) {
    return ProductivityStreak.findOne({
      where: { user_id: userId },
      order: [['streak_date', 'DESC']]
    });
  }

  static async getStreak(userId) {
    const latest = await this.getLatestStreakRecord(userId);
    if (!latest) return null;

    const today = todayDateOnly();
    const yesterday = yesterdayDateOnly();
    const lastActivity = toDateOnly(latest.streak_date);

    if (lastActivity < yesterday) {
      return {
        current_streak: 0,
        longest_streak: latest.longest_streak || 0,
        streak_date: lastActivity
      };
    }

    return latest.toJSON();
  }

  static async updateStreak(userId) {
    const today = todayDateOnly();
    const yesterday = yesterdayDateOnly();
    const latest = await this.getLatestStreakRecord(userId);

    if (!latest) {
      const created = await ProductivityStreak.create({
        user_id: userId,
        streak_date: today,
        current_streak: 1,
        longest_streak: 1
      });
      return created.toJSON();
    }

    const lastActivity = toDateOnly(latest.streak_date);

    if (lastActivity === today) {
      return latest.toJSON();
    }

    const nextCurrent = lastActivity === yesterday ? (latest.current_streak || 0) + 1 : 1;
    const nextLongest = Math.max(latest.longest_streak || 0, nextCurrent);

    const [todayRecord, created] = await ProductivityStreak.findOrCreate({
      where: { user_id: userId, streak_date: today },
      defaults: {
        user_id: userId,
        streak_date: today,
        current_streak: nextCurrent,
        longest_streak: nextLongest
      }
    });

    if (!created) {
      await todayRecord.update({
        current_streak: nextCurrent,
        longest_streak: nextLongest
      });
    }

    return todayRecord.toJSON();
  }

  static async awardAchievementIfNew(userId, type) {
    const existing = await Achievement.findOne({
      where: { user_id: userId, achievement_type: type }
    });
    if (existing) return null;

    const definition = catalogEntry(type);
    if (!definition) return null;

    const achievement = await Achievement.create({
      user_id: userId,
      achievement_type: type,
      title: definition.title,
      description: definition.description
    });

    return achievement.toJSON();
  }

  static async evaluateTaskActivity(userId) {
    await this.updateStreak(userId);
    await this.evaluateAchievements(userId, {
      started_at: new Date(),
      elapsed_time: 0,
      timer_duration: 0
    });
  }

  static async evaluateAchievements(userId, session) {
    const completedSessions = await FocusSession.count({
      where: { user_id: userId, status: 'completed' }
    });

    if (completedSessions >= 1) {
      await this.awardAchievementIfNew(userId, 'first_focus');
    }

    const streak = await this.getStreak(userId);
    if ((streak?.current_streak || 0) >= 3) {
      await this.awardAchievementIfNew(userId, 'streak_3');
    }

    const startedAt = new Date(session.started_at || session.start_time || Date.now());
    const startHour = startedAt.getHours();
    if (startHour < 8) {
      await this.awardAchievementIfNew(userId, 'early_bird');
    }
    if (startHour >= 23) {
      await this.awardAchievementIfNew(userId, 'night_owl');
    }

    const elapsedMinutes = session.elapsed_time || session.timer_duration || 0;
    if (elapsedMinutes >= 60) {
      await this.awardAchievementIfNew(userId, 'focus_master');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tasksCompletedToday = await Task.count({
      where: {
        user_id: userId,
        status: 'completed',
        completed_at: { [Op.gte]: todayStart }
      }
    });
    if (tasksCompletedToday >= 10) {
      await this.awardAchievementIfNew(userId, 'task_warrior');
    }
  }

  static async getAchievementStats(userId) {
    const streak = await this.getStreak(userId);
    const completedSessions = await FocusSession.count({
      where: { user_id: userId, status: 'completed' }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tasksCompletedToday = await Task.count({
      where: {
        user_id: userId,
        status: 'completed',
        completed_at: { [Op.gte]: todayStart }
      }
    });

    const hasEarlyBird = await FocusSession.count({
      where: {
        user_id: userId,
        status: 'completed',
        [Op.and]: [
          sequelize.where(
            sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM started_at')),
            { [Op.lt]: 8 }
          )
        ]
      }
    });

    const hasNightOwl = await FocusSession.count({
      where: {
        user_id: userId,
        status: 'completed',
        [Op.and]: [
          sequelize.where(
            sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM started_at')),
            { [Op.gte]: 23 }
          )
        ]
      }
    });

    const maxSessionMinutes =
      (await FocusSession.max('elapsed_time', {
        where: { user_id: userId, status: 'completed' }
      })) || 0;

    return {
      currentStreak: streak?.current_streak || 0,
      completedSessions,
      tasksCompletedToday,
      hasEarlyBird: hasEarlyBird > 0,
      hasNightOwl: hasNightOwl > 0,
      maxSessionMinutes: parseInt(maxSessionMinutes, 10) || 0,
      totalPoints: 0
    };
  }

  static achievementProgress(type, stats) {
    switch (type) {
    case 'first_focus':
      return { current: Math.min(stats.completedSessions, 1), target: 1 };
    case 'streak_3':
      return { current: Math.min(stats.currentStreak, 3), target: 3 };
    case 'early_bird':
      return { current: stats.hasEarlyBird ? 1 : 0, target: 1 };
    case 'focus_master':
      return {
        current: Math.min(stats.maxSessionMinutes, 60),
        target: 60
      };
    case 'task_warrior':
      return {
        current: Math.min(stats.tasksCompletedToday, 10),
        target: 10
      };
    case 'night_owl':
      return { current: stats.hasNightOwl ? 1 : 0, target: 1 };
    default:
      return { current: 0, target: 1 };
    }
  }

  static async getAchievements(userId) {
    const [earned, stats] = await Promise.all([
      Achievement.findAll({
        where: { user_id: userId },
        order: [['earned_at', 'DESC']]
      }),
      this.getAchievementStats(userId)
    ]);

    const earnedMap = new Map(earned.map(item => [item.achievement_type, item]));

    return ACHIEVEMENT_CATALOG.map(definition => {
      const record = earnedMap.get(definition.type);
      const progress = this.achievementProgress(definition.type, stats);

      return {
        achievement_type: definition.type,
        title: definition.title,
        description: definition.description,
        icon: definition.icon,
        is_unlocked: Boolean(record),
        earned_at: record?.earned_at || null,
        progress_current: progress.current,
        progress_target: progress.target
      };
    });
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
        [
          sequelize.fn(
            'COUNT',
            sequelize.fn('DISTINCT', sequelize.fn('DATE', sequelize.col('started_at')))
          ),
          'focus_days'
        ],
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

    const currentStreak = await this.getStreak(userId);

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
