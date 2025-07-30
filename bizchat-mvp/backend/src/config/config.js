const path = require('path');

module.exports = {
  // Database configuration
  dbPath: path.join(__dirname, '../../database.sqlite'),
  
  // Server configuration
  port: process.env.PORT || 3001,
  
  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  
  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    uploadDir: path.join(__dirname, '../../uploads')
  },
  
  // Socket.io configuration
  socket: {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  }
};