const { errorResponse } = require('../utils/responses');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return errorResponse(res, err, err.statusCode);
  }

  // Database errors
  if (err.code === '23505') { // Unique violation
    return errorResponse(res, {
      code: 'CONFLICT',
      message: 'Resource already exists',
      details: err.detail
    }, 409);
  }

  if (err.code === '23503') { // Foreign key violation
    return errorResponse(res, {
      code: 'INVALID_REFERENCE',
      message: 'Referenced resource does not exist',
      details: err.detail
    }, 400);
  }

  if (err.code === '23502') { // Not null violation
    return errorResponse(res, {
      code: 'VALIDATION_ERROR',
      message: 'Required field missing',
      details: err.column
    }, 400);
  }

  // Default error
  return errorResponse(res, {
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal error occurred' 
      : err.message
  }, 500);
};

module.exports = errorHandler;
