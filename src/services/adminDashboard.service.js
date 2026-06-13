import { Op } from 'sequelize';
import {
  User,
  Task,
  Note,
  VoiceRecording,
  Notification,
  Session,
  ActivityLog,
  GoogleCalendarSync,
  sequelize
} from '../models/orm/index.js';

const percentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const periodToDays = period => {
  const map = { '7d': 7, '30d': 30, '90d': 90 };
  return map[period] || 7;
};

class AdminDashboardService {
  static async getStats() {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersThisWeek,
      usersLastWeek,
      activeUsers,
      activeUsersLastWeek,
      totalTasks,
      tasksThisWeek,
      tasksLastWeek,
      apiOpsThisWeek,
      apiOpsLastWeek,
      totalRecordings,
      recordingsThisWeek,
      recordingsLastWeek,
      calendarConnections,
      oauthUsers
    ] = await Promise.all([
      User.count(),
      User.count({ where: { created_at: { [Op.gte]: weekAgo } } }),
      User.count({ where: { created_at: { [Op.between]: [twoWeeksAgo, weekAgo] } } }),
      User.count({ where: { is_active: true } }),
      User.count({
        where: {
          is_active: true,
          updated_at: { [Op.between]: [twoWeeksAgo, weekAgo] }
        }
      }),
      Task.count(),
      Task.count({ where: { created_at: { [Op.gte]: weekAgo } } }),
      Task.count({ where: { created_at: { [Op.between]: [twoWeeksAgo, weekAgo] } } }),
      VoiceRecording.count({
        where: { transcription_text: { [Op.ne]: null }, created_at: { [Op.gte]: weekAgo } }
      }),
      VoiceRecording.count({
        where: {
          transcription_text: { [Op.ne]: null },
          created_at: { [Op.between]: [twoWeeksAgo, weekAgo] }
        }
      }),
      VoiceRecording.count(),
      VoiceRecording.count({ where: { created_at: { [Op.gte]: weekAgo } } }),
      VoiceRecording.count({ where: { created_at: { [Op.between]: [twoWeeksAgo, weekAgo] } } }),
      GoogleCalendarSync.count({ where: { sync_enabled: true } }).catch(() => 0),
      User.count({ where: { oauth_provider: { [Op.not]: null } } })
    ]);

    const notesThisMonth = await Note.count({ where: { created_at: { [Op.gte]: monthAgo } } });
    const notesLastMonth = await Note.count({
      where: { created_at: { [Op.between]: [twoMonthsAgo, monthAgo] } }
    });

    return {
      total_users: {
        value: totalUsers,
        change_percent: percentChange(usersThisWeek, usersLastWeek)
      },
      active_users: {
        value: activeUsers,
        change_percent: percentChange(activeUsers, activeUsersLastWeek)
      },
      total_tasks: {
        value: totalTasks,
        change_percent: percentChange(tasksThisWeek, tasksLastWeek)
      },
      api_requests: {
        value: apiOpsThisWeek,
        change_percent: percentChange(apiOpsThisWeek, apiOpsLastWeek)
      },
      content_this_month: {
        value: notesThisMonth,
        change_percent: percentChange(notesThisMonth, notesLastMonth)
      },
      voice_recordings: {
        value: totalRecordings,
        change_percent: percentChange(recordingsThisWeek, recordingsLastWeek)
      },
      calendar_connections: {
        value: calendarConnections,
        change_percent: 0
      },
      oauth_integrations: {
        value: oauthUsers,
        change_percent: 0
      }
    };
  }

  static async getUsageChart(period = '7d') {
    const days = periodToDays(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [userRegs, transcriptions, tasks] = await Promise.all([
      User.findAll({
        where: { created_at: { [Op.gte]: startDate } },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        raw: true
      }),
      VoiceRecording.findAll({
        where: {
          transcription_text: { [Op.ne]: null },
          created_at: { [Op.gte]: startDate }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('recording_id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        raw: true
      }),
      Task.findAll({
        where: { created_at: { [Op.gte]: startDate } },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('task_id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        raw: true
      })
    ]);

    const byDate = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      byDate.set(key, { date: key, users: 0, api_requests: 0, tasks: 0 });
    }

    const addCounts = (rows, field) => {
      rows.forEach(row => {
        const key = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);
        if (byDate.has(key)) byDate.get(key)[field] = parseInt(row.count, 10);
      });
    };

    addCounts(userRegs, 'users');
    addCounts(transcriptions, 'api_requests');
    addCounts(tasks, 'tasks');

    const data = Array.from(byDate.values());

    return {
      period,
      labels: data.map(d => d.date),
      datasets: [
        { label: 'New Users', data: data.map(d => d.users) },
        { label: 'API Requests', data: data.map(d => d.api_requests) },
        { label: 'Tasks', data: data.map(d => d.tasks) }
      ],
      data
    };
  }

  static async getTrafficSources() {
    const [googleUsers, facebookUsers, oauthUsers, emailUsers, totalUsers] = await Promise.all([
      User.count({ where: { oauth_provider: 'google' } }),
      User.count({ where: { oauth_provider: 'facebook' } }),
      User.count({ where: { oauth_provider: { [Op.not]: null } } }),
      User.count({ where: { oauth_provider: null, password: { [Op.ne]: null } } }),
      User.count()
    ]);

    const webexUsers = await User.count({ where: { oauth_provider: 'webex' } }).catch(() => 0);
    const otherOauth = Math.max(0, oauthUsers - googleUsers - facebookUsers - webexUsers);
    const direct = Math.max(0, totalUsers - oauthUsers - emailUsers);

    const sources = [
      { name: 'Email Signup', value: emailUsers },
      { name: 'Google OAuth', value: googleUsers },
      { name: 'Facebook OAuth', value: facebookUsers },
      { name: 'Webex OAuth', value: webexUsers },
      { name: 'Other OAuth', value: otherOauth },
      { name: 'Direct / Other', value: direct }
    ].filter(s => s.value > 0);

    const total = sources.reduce((sum, s) => sum + s.value, 0) || 1;

    return {
      sources: sources.map(s => ({
        ...s,
        percent: Number(((s.value / total) * 100).toFixed(1))
      })),
      total_users: totalUsers
    };
  }

  static async getAdminNotifications(limit = 20) {
    let logs = [];
    try {
      logs = await ActivityLog.findAll({
        order: [['created_at', 'DESC']],
        limit,
        include: [
          { model: User, as: 'user', attributes: ['user_id', 'email', 'name'], required: false }
        ]
      });
    } catch {
      logs = [];
    }

    const [unreadCount, recentSessions] = await Promise.all([
      Notification.count({ where: { is_read: false } }),
      Session.count({ where: { expires_at: { [Op.gt]: new Date() } } })
    ]);

    const notifications = logs.map(log => ({
      id: log.log_id,
      title: log.activity_type.replace(/_/g, ' '),
      description: log.details?.message || log.activity_category || '',
      severity: log.severity,
      type: log.activity_category,
      user: log.user ? { id: log.user.user_id, email: log.user.email, name: log.user.name } : null,
      created_at: log.created_at,
      is_read: false
    }));

    return {
      notifications,
      unread_count: unreadCount,
      active_sessions: recentSessions
    };
  }

  static getUiStrings(locale = 'ar') {
    const strings = {
      ar: {
        'dashboard.title': 'لوحة التحكم',
        'dashboard.subtitle': 'نظرة عامة على النظام',
        'users.title': 'المستخدمين',
        'users.add': 'إضافة مستخدم',
        'users.search': 'بحث عن مستخدم...',
        'api.usage.title': 'استخدام API',
        'api.keys.title': 'مفاتيح API',
        'logs.title': 'سجل النشاط',
        'config.title': 'الإعدادات',
        'common.save': 'حفظ',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.cancel': 'إلغاء',
        'common.filter': 'تصفية',
        'common.no_data': 'لا توجد بيانات',
        'nav.dashboard': 'الرئيسية',
        'nav.users': 'المستخدمين',
        'nav.api_usage': 'استخدام API',
        'nav.api_keys': 'مفاتيح API',
        'nav.logs': 'السجلات',
        'nav.settings': 'الإعدادات',
        'nav.analytics': 'التحليلات',
        'nav.system': 'النظام',
        'nav.integrations': 'التكاملات'
      },
      en: {
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'System overview',
        'users.title': 'Users',
        'users.add': 'Add User',
        'users.search': 'Search users...',
        'api.usage.title': 'API Usage',
        'api.keys.title': 'API Keys',
        'logs.title': 'Activity Log',
        'config.title': 'Settings',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.cancel': 'Cancel',
        'common.filter': 'Filter',
        'common.no_data': 'No data found',
        'nav.dashboard': 'Dashboard',
        'nav.users': 'Users',
        'nav.api_usage': 'API Usage',
        'nav.api_keys': 'API Keys',
        'nav.logs': 'Logs',
        'nav.settings': 'Settings',
        'nav.analytics': 'Analytics',
        'nav.system': 'System',
        'nav.integrations': 'Integrations'
      }
    };

    return strings[locale] || strings.en;
  }
}

export default AdminDashboardService;
