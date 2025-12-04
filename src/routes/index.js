const express = require('express');
const router = express.Router();

// Main routes aggregator
router.use('/auth', require('./auth.routes'));
router.use('/notes', require('./note.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/voice', require('./voice.routes'));
router.use('/tags', require('./tag.routes'));
router.use('/reminders', require('./reminder.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/productivity', require('./productivity.routes'));
router.use('/admin', require('./admin.routes'));

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

module.exports = router;
