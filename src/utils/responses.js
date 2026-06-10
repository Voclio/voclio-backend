/**
 * Standardized API response helpers
 */

const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, error, statusCode = 500) => {
  const normalized =
    typeof error === 'string' ? { code: 'ERROR', message: error } : error;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: normalized.code || 'INTERNAL_ERROR',
      message: normalized.message || 'An error occurred',
      details: normalized.details || null
    }
  });
};

const paginatedResponse = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};

export { successResponse, errorResponse, paginatedResponse };
