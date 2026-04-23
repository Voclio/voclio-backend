/**
 * Request timeout middleware
 * Prevents long-running requests from hanging indefinitely
 */
const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    // Set timeout for the request
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout - operation took too long to complete'
          }
        });
      }
    });

    // Set timeout for the response
    res.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout - operation took too long to complete'
          }
        });
      }
    });

    next();
  };
};

// Specific timeout for AI/voice processing endpoints (longer timeout)
export const aiTimeoutMiddleware = timeoutMiddleware(120000); // 2 minutes

// Default timeout for regular endpoints
export const defaultTimeoutMiddleware = timeoutMiddleware(30000); // 30 seconds

export default defaultTimeoutMiddleware;
