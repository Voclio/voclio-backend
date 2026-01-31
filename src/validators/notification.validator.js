import { param } from 'express-validator';

const notificationIdValidator = [
  param('id')
    .isInt()
    .withMessage('Notification ID must be a valid integer')
];

export {
  notificationIdValidator
};
