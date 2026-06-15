import { Op } from 'sequelize';
import { User, Task, DeviceToken, ProductivityStreak } from '../models/orm/index.js';
import SettingsModel from '../models/settings.model.js';
import {
  getTemplateCatalogEntry,
  listNotificationTemplates,
  notificationCopy
} from '../i18n/notification.messages.js';

const ACTIVE_TASK_STATUSES = { [Op.notIn]: ['completed', 'cancelled'] };

class NotificationTemplateService {
  static listTemplates(lang = 'en') {
    return listNotificationTemplates(lang);
  }

  static async getUserLanguage(userId) {
    const settings = await SettingsModel.findByUserId(userId);
    return settings?.language === 'ar' ? 'ar' : 'en';
  }

  static async buildTemplateData(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'name', 'email']
    });
    if (!user) return {};

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [pendingCount, completedThisWeek, dueTodayTasks, overdueCount, streak] =
      await Promise.all([
        Task.count({ where: { user_id: userId, status: ACTIVE_TASK_STATUSES } }),
        Task.count({
          where: {
            user_id: userId,
            status: 'completed',
            updated_at: { [Op.gte]: weekAgo }
          }
        }),
        Task.findAll({
          where: {
            user_id: userId,
            status: ACTIVE_TASK_STATUSES,
            due_date: { [Op.between]: [startOfDay, endOfDay] }
          },
          attributes: ['task_id', 'title'],
          order: [['due_date', 'ASC']],
          limit: 5
        }),
        Task.count({
          where: {
            user_id: userId,
            status: ACTIVE_TASK_STATUSES,
            due_date: { [Op.lt]: startOfDay }
          }
        }),
        ProductivityStreak.findOne({
          where: { user_id: userId },
          order: [['updated_at', 'DESC']]
        })
      ]);

    return {
      userName: user.name || user.email?.split('@')[0] || 'there',
      pendingCount,
      completedCount: completedThisWeek,
      dueTodayCount: dueTodayTasks.length,
      firstTaskTitle: dueTodayTasks[0]?.title || 'your task',
      firstTaskId: dueTodayTasks[0]?.task_id ?? null,
      overdueCount,
      streakDays: streak?.current_streak ?? 0
    };
  }

  static async resolveCopyForUser(userId, templateKey) {
    const lang = await this.getUserLanguage(userId);
    const data = await this.buildTemplateData(userId);
    return notificationCopy(templateKey, lang, data);
  }

  static async resolveRelatedId(userId, templateKey, templateData) {
    if (templateKey === 'reminderTasksDueToday' && templateData.firstTaskId) {
      return templateData.firstTaskId;
    }

    if (['engagementPendingTasks', 'reminderOverdueNudge', 'taskDueSoon'].includes(templateKey)) {
      const task = await Task.findOne({
        where: { user_id: userId, status: ACTIVE_TASK_STATUSES },
        attributes: ['task_id'],
        order: [['due_date', 'ASC NULLS LAST'], ['created_at', 'DESC']]
      });
      return task?.task_id ?? null;
    }

    return null;
  }

  static async resolveAudienceUsers(audience, targetUserId = null) {
    switch (audience) {
      case 'single_user':
        if (!targetUserId) return [];
        return User.findAll({
          where: { user_id: targetUserId, is_active: true },
          attributes: ['user_id', 'email', 'name']
        });

      case 'with_push_token': {
        const tokens = await DeviceToken.findAll({
          attributes: ['user_id'],
          group: ['user_id']
        });
        const userIds = tokens.map(row => row.user_id);
        if (!userIds.length) return [];
        return User.findAll({
          where: { user_id: { [Op.in]: userIds }, is_active: true },
          attributes: ['user_id', 'email', 'name']
        });
      }

      case 'with_pending_tasks': {
        const tasks = await Task.findAll({
          where: { status: ACTIVE_TASK_STATUSES },
          attributes: ['user_id'],
          group: ['user_id']
        });
        const userIds = tasks.map(row => row.user_id);
        if (!userIds.length) return [];
        return User.findAll({
          where: { user_id: { [Op.in]: userIds }, is_active: true },
          attributes: ['user_id', 'email', 'name']
        });
      }

      case 'with_tasks_due_today': {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const tasks = await Task.findAll({
          where: {
            status: ACTIVE_TASK_STATUSES,
            due_date: { [Op.between]: [start, end] }
          },
          attributes: ['user_id'],
          group: ['user_id']
        });
        const userIds = tasks.map(row => row.user_id);
        if (!userIds.length) return [];
        return User.findAll({
          where: { user_id: { [Op.in]: userIds }, is_active: true },
          attributes: ['user_id', 'email', 'name']
        });
      }

      case 'with_overdue_tasks': {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const tasks = await Task.findAll({
          where: {
            status: ACTIVE_TASK_STATUSES,
            due_date: { [Op.lt]: start }
          },
          attributes: ['user_id'],
          group: ['user_id']
        });
        const userIds = tasks.map(row => row.user_id);
        if (!userIds.length) return [];
        return User.findAll({
          where: { user_id: { [Op.in]: userIds }, is_active: true },
          attributes: ['user_id', 'email', 'name']
        });
      }

      case 'inactive_7d': {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return User.findAll({
          where: {
            is_active: true,
            updated_at: { [Op.lt]: cutoff }
          },
          attributes: ['user_id', 'email', 'name']
        });
      }

      case 'all_active':
      default:
        return User.findAll({
          where: { is_active: true },
          attributes: ['user_id', 'email', 'name']
        });
    }
  }

  static getTemplateDefaults(templateKey) {
    return getTemplateCatalogEntry(templateKey);
  }
}

export default NotificationTemplateService;
