const { logInfo } = require('../utils/helpers');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logInfo('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    logInfo('Outgoing Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode < 400,
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Error logging middleware (used before error handler)
 */
const errorLogger = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  next(err);
};

/**
 * Socket connection logger
 */
const socketLogger = (socket, next) => {
  logInfo('Socket Connection', {
    socketId: socket.id,
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  
  // Log socket disconnection
  socket.on('disconnect', (reason) => {
    logInfo('Socket Disconnection', {
      socketId: socket.id,
      reason,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

/**
 * Database operation logger
 */
const dbLogger = (operation, query, params = null) => {
  logInfo('Database Operation', {
    operation,
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''), // Truncate long queries
    params,
    timestamp: new Date().toISOString()
  });
};

/**
 * File upload logger
 */
const fileUploadLogger = (req, res, next) => {
  if (req.file) {
    logInfo('File Upload', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      destination: req.file.destination,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Performance monitoring middleware
 */
const performanceLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[${new Date().toISOString()}] SLOW REQUEST:`, {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
};

/**
 * Security event logger
 */
const securityLogger = (event, details = {}) => {
  console.warn(`[${new Date().toISOString()}] SECURITY EVENT: ${event}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Rate limit logger
 */
const rateLimitLogger = (req, res, next) => {
  // This would be used with rate limiting middleware
  const remaining = res.get('X-RateLimit-Remaining');
  
  if (remaining && parseInt(remaining) < 10) {
    console.warn(`[${new Date().toISOString()}] RATE LIMIT WARNING:`, {
      ip: req.ip,
      remaining,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  socketLogger,
  dbLogger,
  fileUploadLogger,
  performanceLogger,
  securityLogger,
  rateLimitLogger
};