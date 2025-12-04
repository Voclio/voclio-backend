const { param } = require('express-validator');

const notificationIdValidator = [
  param('id')
    .isInt()
    .withMessage('Notification ID must be a valid integer')
];

module.exports = {
  notificationIdValidator
};
