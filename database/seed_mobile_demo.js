/**
 * Seed a demo mobile user with sample data across all features.
 * Usage: node database/seed_mobile_demo.js
 */
import bcrypt from 'bcryptjs';
import {
  sequelize,
  User,
  Category,
  Tag,
  Note,
  Task,
  VoiceRecording,
  Reminder,
  Notification,
  FocusSession,
  ProductivityStreak,
  Achievement,
  UserSettings
} from '../src/models/orm/index.js';

const DEMO_EMAIL = 'demo@voclio.app';
const DEMO_PASSWORD = 'Demo12345678';
const DEMO_NAME = 'Demo User';

async function seed() {
  await sequelize.authenticate();
  console.log('✓ Database connected');

  const existing = await User.findOne({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await existing.destroy();
    console.log('↻ Removed existing demo user');
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await User.create({
    email: DEMO_EMAIL,
    password: passwordHash,
    name: DEMO_NAME,
    phone_number: '+201234567890',
    is_active: true,
    email_verified: true,
    is_admin: false
  });
  const userId = user.user_id;
  console.log(`✓ Created user #${userId} (${DEMO_EMAIL})`);

  await UserSettings.create({
    user_id: userId,
    theme: 'light',
    language: 'ar',
    timezone: 'Africa/Cairo'
  });

  const workCat = await Category.create({
    user_id: userId,
    name: 'Work',
    color: '#6D28D9',
    description: 'Work related tasks'
  });
  const personalCat = await Category.create({
    user_id: userId,
    name: 'Personal',
    color: '#10B981',
    description: 'Personal tasks'
  });

  const urgentTag = await Tag.create({
    user_id: userId,
    name: 'urgent',
    color: '#EF4444',
    description: 'High priority'
  });
  const ideasTag = await Tag.create({
    user_id: userId,
    name: 'ideas',
    color: '#F59E0B',
    description: 'Brainstorming'
  });

  const recording = await VoiceRecording.create({
    user_id: userId,
    file_path: 'https://example.com/demo-recording.m4a',
    file_size: 245000,
    duration: 45,
    format: 'audio/m4a',
    transcription_text:
      'Meeting notes: finish the mobile app integration, review API endpoints, and prepare demo for the team.',
    language: 'ar',
    status: 'completed'
  });

  const note1 = await Note.create({
    user_id: userId,
    title: 'Sprint Planning Notes',
    content:
      'Focus on mobile-backend integration this week. Prioritize auth, tasks, notes, and voice recording flows.',
    summary: 'Mobile integration sprint priorities',
    voice_recording_id: recording.recording_id
  });

  const note2 = await Note.create({
    user_id: userId,
    title: 'Product Ideas',
    content: 'Add widget support, dark mode sync, and offline caching for notes and tasks.',
    summary: 'Widget, theme sync, offline mode'
  });

  await note1.addTag(urgentTag);
  await note2.addTag(ideasTag);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);
  nextWeek.setHours(14, 0, 0, 0);

  const mainTask = await Task.create({
    user_id: userId,
    category_id: workCat.category_id,
    note_id: note1.note_id,
    title: 'Complete mobile API integration',
    description: 'Wire all datasources to voclio-backend',
    status: 'in_progress',
    priority: 'high',
    due_date: tomorrow
  });

  await Task.create({
    user_id: userId,
    parent_task_id: mainTask.task_id,
    title: 'Test login flow on emulator',
    status: 'completed',
    priority: 'medium',
    completed_at: new Date()
  });

  await Task.create({
    user_id: userId,
    parent_task_id: mainTask.task_id,
    title: 'Verify tasks CRUD',
    status: 'todo',
    priority: 'medium'
  });

  await Task.create({
    user_id: userId,
    category_id: personalCat.category_id,
    title: 'Gym session',
    description: 'Leg day workout',
    status: 'todo',
    priority: 'low',
    due_date: nextWeek
  });

  await Task.create({
    user_id: userId,
    category_id: workCat.category_id,
    title: 'Review pull request',
    status: 'completed',
    priority: 'medium',
    completed_at: new Date(),
    due_date: new Date()
  });

  const reminderTime = new Date();
  reminderTime.setHours(reminderTime.getHours() + 2);

  await Reminder.create({
    user_id: userId,
    task_id: mainTask.task_id,
    reminder_time: reminderTime,
    reminder_type: 'push',
    notification_types: ['push'],
    status: 'pending'
  });

  await Reminder.create({
    user_id: userId,
    reminder_time: tomorrow,
    reminder_type: 'push',
    status: 'pending'
  });

  await Notification.bulkCreate([
    {
      user_id: userId,
      title: 'Welcome to Voclio',
      message: 'Your demo account is ready with sample data.',
      type: 'general',
      is_read: false
    },
    {
      user_id: userId,
      title: 'Task reminder',
      message: 'Complete mobile API integration is due tomorrow.',
      type: 'task',
      is_read: false
    },
    {
      user_id: userId,
      title: 'Focus streak',
      message: 'You completed 3 focus sessions this week!',
      type: 'achievement',
      is_read: true
    }
  ]);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await FocusSession.bulkCreate([
    {
      user_id: userId,
      timer_duration: 25,
      elapsed_time: 1500,
      ambient_sound: 'rain',
      sound_volume: 60,
      status: 'completed',
      start_time: yesterday,
      end_time: yesterday,
      ended_at: yesterday
    },
    {
      user_id: userId,
      timer_duration: 50,
      elapsed_time: 3000,
      ambient_sound: 'forest',
      sound_volume: 40,
      status: 'completed',
      start_time: new Date(),
      end_time: new Date(),
      ended_at: new Date()
    }
  ]);

  const today = new Date().toISOString().split('T')[0];
  await ProductivityStreak.create({
    user_id: userId,
    streak_date: today,
    current_streak: 5,
    longest_streak: 12
  });

  await Achievement.bulkCreate([
    {
      user_id: userId,
      achievement_type: 'first_focus',
      title: 'First Focus',
      description: 'Complete your first focus session'
    },
    {
      user_id: userId,
      achievement_type: 'week_warrior',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak'
    },
    {
      user_id: userId,
      achievement_type: 'note_taker',
      title: 'Note Taker',
      description: 'Create 5 notes'
    }
  ]);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo account ready for mobile app');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  User ID:  ${userId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Seeded: categories, tags, notes, tasks, subtasks,');
  console.log('        reminders, notifications, focus sessions,');
  console.log('        streak, achievements, voice recording, settings\n');

  await sequelize.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
