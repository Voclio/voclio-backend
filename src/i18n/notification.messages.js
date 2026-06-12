const HOUR_LABEL = {
  en: (n) => `${n} hour${n === 1 ? '' : 's'}`,
  ar: (n) => `${n} ساعة`
};

const MINUTE_LABEL = {
  en: (n) => `${n} minute${n === 1 ? '' : 's'}`,
  ar: (n) => `${n} دقيقة`
};

export function resolveNotificationLanguage(language) {
  return language === 'ar' ? 'ar' : 'en';
}

export function notificationCopy(type, lang, data = {}) {
  const l = resolveNotificationLanguage(lang);
  const copy = MESSAGES[type]?.[l] ?? MESSAGES[type]?.en;
  if (!copy) {
    throw new Error(`Unknown notification type: ${type}`);
  }
  return {
    title: typeof copy.title === 'function' ? copy.title(data) : copy.title,
    message: typeof copy.message === 'function' ? copy.message(data) : copy.message
  };
}

const LEGACY_AR_TITLE_TO_TYPE = {
  'مهمة جديدة': 'taskCreated',
  'تحديث مهمة': 'taskUpdated',
  '✅ مهمة مكتملة': 'taskCompleted',
  '⏰ موعد المهمة قريب': 'taskDueSoon',
  '⚠️ مهمة متأخرة': 'taskOverdue',
  '🔔 تذكير': 'reminderTriggered',
  'تذكير جديد': 'reminderCreated',
  '📝 ملاحظة جديدة': 'noteCreated',
  '🎤 تم معالجة التسجيل الصوتي': 'voiceProcessed',
  '✨ تم إنشاء مهمة من الصوت': 'voiceToTaskCreated',
  '🏆 إنجاز جديد!': 'achievementEarned',
  '🔥 سلسلة إنجازات!': 'streakMilestone',
  '⏱️ جلسة تركيز مكتملة': 'focusSessionCompleted',
  '👋 مرحباً بك في Voclio': 'welcome',
  '🔒 تم تغيير كلمة المرور': 'passwordChanged',
  '✅ تم تأكيد البريد الإلكتروني': 'emailVerified'
};

const LEGACY_AR_MESSAGE_PARSERS = [
  {
    type: 'taskCreated',
    regex: /^تم إنشاء مهمة جديدة: (.+)$/,
    toData: (match) => ({ task: { title: match[1] } })
  },
  {
    type: 'taskUpdated',
    regex: /^تم تحديث المهمة: (.+)$/,
    toData: (match) => ({ task: { title: match[1] } })
  },
  {
    type: 'taskCompleted',
    regex: /^أحسنت! تم إكمال المهمة: (.+)$/,
    toData: (match) => ({ task: { title: match[1] } })
  },
  {
    type: 'taskDueSoon',
    regex: /^المهمة "(.+)" موعدها بعد (\d+) ساعة$/,
    toData: (match) => ({
      task: { title: match[1] },
      hoursLeft: Number.parseInt(match[2], 10)
    })
  },
  {
    type: 'taskOverdue',
    regex: /^المهمة "(.+)" تجاوزت موعدها$/,
    toData: (match) => ({ task: { title: match[1] } })
  },
  {
    type: 'reminderTriggered',
    regex: /^تذكير بالمهمة: (.+)$/,
    toData: (match) => ({ task: { title: match[1] } })
  },
  {
    type: 'noteCreated',
    regex: /^تم إنشاء ملاحظة: (.+)$/,
    toData: (match) => ({ note: { title: match[1] === 'بدون عنوان' ? '' : match[1] } })
  },
  {
    type: 'voiceToTaskCreated',
    regex: /^تم إنشاء المهمة: (.+)$/,
    toData: (match) => ({ task: { title: match[1] } })
  },
  {
    type: 'achievementEarned',
    regex: /^تهانينا! حصلت على: (.+)$/,
    toData: (match) => ({ achievement: { title: match[1] } })
  },
  {
    type: 'streakMilestone',
    regex: /^رائع! وصلت إلى (\d+) يوم متتالي$/,
    toData: (match) => ({ streak: { current_streak: Number.parseInt(match[1], 10) } })
  },
  {
    type: 'focusSessionCompleted',
    regex: /^أحسنت! أكملت جلسة تركيز لمدة (\d+) دقيقة$/,
    toData: (match) => ({
      session: { timer_duration: Number.parseInt(match[1], 10) * 60 }
    })
  },
  {
    type: 'welcome',
    regex: /^أهلاً (.+)! نحن سعداء بانضمامك$/,
    toData: (match) => ({ userName: match[1] })
  }
];

const STATIC_LEGACY_AR_MESSAGES = {
  reminderTriggered: 'لديك تذكير',
  reminderCreated: 'تم إنشاء تذكير جديد',
  voiceProcessed: 'تم تحويل التسجيل الصوتي إلى نص بنجاح',
  passwordChanged: 'تم تغيير كلمة المرور الخاصة بك بنجاح',
  emailVerified: 'تم تأكيد بريدك الإلكتروني بنجاح'
};

/**
 * Localize stored notifications for display (does not mutate DB).
 */
export function localizeNotificationForDisplay(notification, _language) {
  const type = LEGACY_AR_TITLE_TO_TYPE[notification.title];
  if (!type) {
    return notification;
  }

  const parser = LEGACY_AR_MESSAGE_PARSERS.find((entry) => entry.type === type);
  if (parser) {
    const match = notification.message.match(parser.regex);
    if (match) {
      const copy = notificationCopy(type, 'en', parser.toData(match));
      return { ...notification, title: copy.title, message: copy.message };
    }
  }

  if (STATIC_LEGACY_AR_MESSAGES[type] === notification.message) {
    const copy = notificationCopy(type, 'en', {});
    return { ...notification, title: copy.title, message: copy.message };
  }

  const titleOnly = notificationCopy(type, 'en', {});
  return { ...notification, title: titleOnly.title };
}

const MESSAGES = {
  taskCreated: {
    en: {
      title: 'New task',
      message: ({ task }) => `A new task was created: ${task.title}`
    },
    ar: {
      title: 'مهمة جديدة',
      message: ({ task }) => `تم إنشاء مهمة جديدة: ${task.title}`
    }
  },
  taskUpdated: {
    en: {
      title: 'Task updated',
      message: ({ task }) => `Task updated: ${task.title}`
    },
    ar: {
      title: 'تحديث مهمة',
      message: ({ task }) => `تم تحديث المهمة: ${task.title}`
    }
  },
  taskCompleted: {
    en: {
      title: '✅ Task completed',
      message: ({ task }) => `Nice work! You completed: ${task.title}`
    },
    ar: {
      title: '✅ مهمة مكتملة',
      message: ({ task }) => `أحسنت! تم إكمال المهمة: ${task.title}`
    }
  },
  taskDueSoon: {
    en: {
      title: '⏰ Task due soon',
      message: ({ task, hoursLeft }) =>
        `Task "${task.title}" is due in ${HOUR_LABEL.en(hoursLeft)}`
    },
    ar: {
      title: '⏰ موعد المهمة قريب',
      message: ({ task, hoursLeft }) =>
        `المهمة "${task.title}" موعدها بعد ${HOUR_LABEL.ar(hoursLeft)}`
    }
  },
  taskOverdue: {
    en: {
      title: '⚠️ Overdue task',
      message: ({ task }) => `Task "${task.title}" is past its due date`
    },
    ar: {
      title: '⚠️ مهمة متأخرة',
      message: ({ task }) => `المهمة "${task.title}" تجاوزت موعدها`
    }
  },
  reminderTriggered: {
    en: {
      title: '🔔 Reminder',
      message: ({ task }) =>
        task ? `Reminder for task: ${task.title}` : 'You have a reminder'
    },
    ar: {
      title: '🔔 تذكير',
      message: ({ task }) => (task ? `تذكير بالمهمة: ${task.title}` : 'لديك تذكير')
    }
  },
  reminderCreated: {
    en: {
      title: 'New reminder',
      message: 'A new reminder was created'
    },
    ar: {
      title: 'تذكير جديد',
      message: 'تم إنشاء تذكير جديد'
    }
  },
  noteCreated: {
    en: {
      title: '📝 New note',
      message: ({ note }) => `Note created: ${note.title || 'Untitled'}`
    },
    ar: {
      title: '📝 ملاحظة جديدة',
      message: ({ note }) => `تم إنشاء ملاحظة: ${note.title || 'بدون عنوان'}`
    }
  },
  voiceProcessed: {
    en: {
      title: '🎤 Voice recording processed',
      message: 'Your voice recording was transcribed successfully'
    },
    ar: {
      title: '🎤 تم معالجة التسجيل الصوتي',
      message: 'تم تحويل التسجيل الصوتي إلى نص بنجاح'
    }
  },
  voiceToTaskCreated: {
    en: {
      title: '✨ Task created from voice',
      message: ({ task }) => `Task created: ${task.title}`
    },
    ar: {
      title: '✨ تم إنشاء مهمة من الصوت',
      message: ({ task }) => `تم إنشاء المهمة: ${task.title}`
    }
  },
  achievementEarned: {
    en: {
      title: '🏆 New achievement!',
      message: ({ achievement }) => `Congratulations! You earned: ${achievement.title}`
    },
    ar: {
      title: '🏆 إنجاز جديد!',
      message: ({ achievement }) => `تهانينا! حصلت على: ${achievement.title}`
    }
  },
  streakMilestone: {
    en: {
      title: '🔥 Streak milestone!',
      message: ({ streak }) => `Amazing! You reached a ${streak.current_streak}-day streak`
    },
    ar: {
      title: '🔥 سلسلة إنجازات!',
      message: ({ streak }) => `رائع! وصلت إلى ${streak.current_streak} يوم متتالي`
    }
  },
  focusSessionCompleted: {
    en: {
      title: '⏱️ Focus session complete',
      message: ({ session }) =>
        `Great job! You finished a ${MINUTE_LABEL.en(Math.floor(session.timer_duration / 60))} focus session`
    },
    ar: {
      title: '⏱️ جلسة تركيز مكتملة',
      message: ({ session }) =>
        `أحسنت! أكملت جلسة تركيز لمدة ${MINUTE_LABEL.ar(Math.floor(session.timer_duration / 60))}`
    }
  },
  welcome: {
    en: {
      title: '👋 Welcome to Voclio',
      message: ({ userName }) => `Hi ${userName}! We're glad you're here`
    },
    ar: {
      title: '👋 مرحباً بك في Voclio',
      message: ({ userName }) => `أهلاً ${userName}! نحن سعداء بانضمامك`
    }
  },
  passwordChanged: {
    en: {
      title: '🔒 Password changed',
      message: 'Your password was changed successfully'
    },
    ar: {
      title: '🔒 تم تغيير كلمة المرور',
      message: 'تم تغيير كلمة المرور الخاصة بك بنجاح'
    }
  },
  emailVerified: {
    en: {
      title: '✅ Email verified',
      message: 'Your email address was verified successfully'
    },
    ar: {
      title: '✅ تم تأكيد البريد الإلكتروني',
      message: 'تم تأكيد بريدك الإلكتروني بنجاح'
    }
  }
};
