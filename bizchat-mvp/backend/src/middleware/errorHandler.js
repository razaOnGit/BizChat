const { createErrorResponse, logError } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with context
  logError(err, 'Global Error Handler', {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Default error response
  let statusCode = 500;
  let errorType = 'SERVER_ERROR';
  let message = ERROR_MESSAGES.SERVER_ERROR;
  let details = null;

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'VALIDATION_ERROR';
    message = err.message || ERROR_MESSAGES.VALIDATION_ERROR;
    details = err.details || null;
  } else if (err.name === 'UnauthorizedError' || err.status === 401) {
    statusCode = 401;
    errorType = 'UNAUTHORIZED';
    message = ERROR_MESSAGES.UNAUTHORIZED;
  } else if (err.name === 'NotFoundError' || err.status === 404) {
    statusCode = 404;
    errorType = 'NOT_FOUND';
    message = ERROR_MESSAGES.NOT_FOUND;
  } else if (err.name === 'DatabaseError' || err.code === 'SQLITE_ERROR') {
    statusCode = 500;
    errorType = 'DATABASE_ERROR';
    message = ERROR_MESSAGES.DATABASE_ERROR;
    // Don't expose database details in production
    if (process.env.NODE_ENV !== 'production') {
      details = { dbError: err.message };
    }
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    errorType = 'FILE_UPLOAD_ERROR';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = ERROR_MESSAGES.FILE_TOO_LARGE;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = ERROR_MESSAGES.UPLOAD_FAILED;
    }
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorType = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorType = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload too large';
  } else if (err.status) {
    // Handle HTTP errors with status codes
    statusCode = err.status;
    errorType = 'HTTP_ERROR';
    message = err.message || 'HTTP Error';
  } else if (err.message) {
    // Handle custom errors with messages
    message = err.message;
    if (err.statusCode) {
      statusCode = err.statusCode;
    }
    if (err.type) {
      errorType = err.type;
    }
  }

  // Create standardized error response
  const errorResponse = createErrorResponse(errorType, message, statusCode, details);

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  error.status = 404;
  error.name = 'NotFoundError';
  next(error);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error with status code
 */
const createError = (message, statusCode = 500, type = 'CUSTOM_ERROR', details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.type = type;
  error.details = details;
  return error;
};

/**
 * Database error handler
 */
const handleDatabaseError = (err, context = 'Database Operation') => {
  logError(err, context);
  
  // Create a generic database error to avoid exposing sensitive info
  const dbError = new Error(ERROR_MESSAGES.DATABASE_ERROR);
  dbError.name = 'DatabaseError';
  dbError.statusCode = 500;
  
  return dbError;
};

/**
 * Validation error handler
 */
const handleValidationError = (message, details = null) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 400;
  error.details = details;
  return error;
};

/**
 * File upload error handler
 */
const handleFileUploadError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return createError(ERROR_MESSAGES.FILE_TOO_LARGE, 400, 'FILE_TOO_LARGE');
  } else if (err.code === 'INVALID_FILE_TYPE') {
    return createError(ERROR_MESSAGES.INVALID_FILE_TYPE, 400, 'INVALID_FILE_TYPE');
  } else {
    return createError(ERROR_MESSAGES.UPLOAD_FAILED, 400, 'UPLOAD_FAILED');
  }
};

/**
 * Socket error handler
 */
const handleSocketError = (socket, error, context = 'Socket Operation') => {
  logError(error, context, { socketId: socket.id });
  
  socket.emit('error', {
    message: 'An error occurred',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  createError,
  handleDatabaseError,
  handleValidationError,
  handleFileUploadError,
  handleSocketError
};