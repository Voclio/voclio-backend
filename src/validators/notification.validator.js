import { body, param } from 'express-validator';

const notificationIdValidator = [
  param('id').isInt().withMessage('Notification ID must be a valid integer')
];

const registerDeviceTokenValidator = [
  body('token')
    .isString()
    .trim()
    .isLength({ min: 10 })
    .withMessage('A valid device token is required'),
  body('platform')
    .optional()
    .isIn(['ios', 'android', 'web', 'unknown'])
    .withMessage('Platform must be ios, android, web, or unknown')
];

const unregisterDeviceTokenValidator = [
  body('token').optional().isString().trim().isLength({ min: 10 })
];

export { notificationIdValidator, registerDeviceTokenValidator, unregisterDeviceTokenValidator };
