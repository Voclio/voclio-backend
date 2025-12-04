const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  notificationIdValidator
} = require('../validators/notification.validator');

// All routes require authentication
router.use(authMiddleware);

router.get('/', NotificationController.getAllNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/:id', notificationIdValidator, NotificationController.getNotificationById);
router.put('/mark-all-read', NotificationController.markAllAsRead);
router.put('/:id/read', notificationIdValidator, NotificationController.markAsRead);
router.delete('/:id', notificationIdValidator, NotificationController.deleteNotification);

module.exports = router;
