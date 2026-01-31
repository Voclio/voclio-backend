import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();
import {
  notificationIdValidator
} from '../validators/notification.validator.js';

// All routes require authentication
router.use(authMiddleware);

router.get('/', NotificationController.getAllNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/:id', notificationIdValidator, NotificationController.getNotificationById);
router.put('/mark-all-read', NotificationController.markAllAsRead);
router.put('/:id/read', notificationIdValidator, NotificationController.markAsRead);
router.delete('/:id', notificationIdValidator, NotificationController.deleteNotification);

export default router;
