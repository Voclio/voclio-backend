/**
 * Application constants
 */

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const REMINDER_TYPES = {
  ONE_TIME: 'one_time',
  RECURRING: 'recurring',
  BOTH: 'both'
};

const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  PUSH: 'push',
  WHATSAPP: 'whatsapp'
};

const OTP_TYPES = {
  LOGIN: 'login',
  REGISTRATION: 'registration',
  PASSWORD_RESET: 'password_reset',
  PHONE_VERIFICATION: 'phone_verification'
};

const FOCUS_SESSION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed'
};

const AUDIO_FORMATS = {
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  M4A: 'audio/mp4',
  OGG: 'audio/ogg',
  WEBM: 'audio/webm'
};

module.exports = {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  REMINDER_TYPES,
  NOTIFICATION_TYPES,
  OTP_TYPES,
  FOCUS_SESSION_STATUS,
  AUDIO_FORMATS
};
