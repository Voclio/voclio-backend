import express from 'express';
import authRoutes from './auth.routes.js';
import noteRoutes from './note.routes.js';
import taskRoutes from './task.routes.js';
import voiceRoutes from './voice.routes.js';
import tagRoutes from './tag.routes.js';
import reminderRoutes from './reminder.routes.js';
import notificationRoutes from './notification.routes.js';
import settingsRoutes from './settings.routes.js';
import productivityRoutes from './productivity.routes.js';
import calendarRoutes from './calendar.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import adminRoutes from './admin.routes.js';
import categoryRoutes from './category.routes.js';
const router = express.Router();

// Main routes aggregator
router.use('/auth', authRoutes);
router.use('/notes', noteRoutes);
router.use('/tasks', taskRoutes);
router.use('/voice', voiceRoutes);
router.use('/tags', tagRoutes);
router.use('/reminders', reminderRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/productivity', productivityRoutes);
router.use('/calendar', calendarRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoryRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Voclio API',
    version: '1.0.0',
    description: 'Voice Notes and Task Management System',
    endpoints: {
      auth: '/api/auth',
      notes: '/api/notes',
      tasks: '/api/tasks',
      voice: '/api/voice',
      tags: '/api/tags',
      reminders: '/api/reminders'
    }
  });
});

export default router;
