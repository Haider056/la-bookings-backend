/**
 * UI Middleware
 * 
 * Handles formatting responses for UI components and web forms
 */

/**
 * Format success response for API and UI
 */
exports.formatSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Format error response for API and UI
 */
exports.formatError = (res, message = 'Error occurred', error = null, statusCode = 400) => {
  const response = {
    status: 'error',
    message
  };

  // Add error details in development environments
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = error.toString();
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Add CSRF protection to forms 
 * (can be expanded to use actual CSRF tokens)
 */
exports.addCsrfProtection = (req, res, next) => {
  // For now this is a placeholder that could be expanded with actual CSRF protection
  res.locals.csrfToken = Math.random().toString(36).substring(2, 15);
  next();
};

/**
 * Sanitize form inputs to prevent XSS
 */
exports.sanitizeInputs = (req, res, next) => {
  // Basic sanitization - this could be expanded with a proper library
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Simple HTML sanitization
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
    });
  }
  next();
}; 