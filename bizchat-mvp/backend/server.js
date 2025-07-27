require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import configuration and utilities
const config = require('./src/config/config');
const SocketHandler = require('./src/socket/socketHandler');
const errorHandler = require('./src/middleware/errorHandler');
const { logger, socketLogger } = require('./src/middleware/logger');
const { createSuccessResponse } = require('./src/utils/helpers');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global middleware
app.use(logger); // Request logging
app.use(cors({ 
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/conversations', require('./src/routes/conversations'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/business', require('./src/routes/business'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json(createSuccessResponse({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  }, 'Server is healthy'));
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'BizChat MVP API',
    version: '1.0.0',
    endpoints: {
      conversations: {
        'GET /api/conversations/business/:businessId': 'Get all conversations for a business',
        'GET /api/conversations/:id': 'Get conversation details',
        'GET /api/conversations/:id/messages': 'Get messages for a conversation',
        'POST /api/conversations/:id/messages': 'Send a new message',
        'PATCH /api/conversations/:id/status': 'Update conversation status'
      },
      business: {
        'GET /api/business/:businessId': 'Get business information',
        'PATCH /api/business/:businessId/status': 'Update business status',
        'GET /api/business/:businessId/stats': 'Get business statistics'
      },
      upload: {
        'POST /api/upload': 'Upload a file',
        'GET /api/upload/:filename': 'Get file information',
        'DELETE /api/upload/:filename': 'Delete a file'
      },
      system: {
        'GET /api/health': 'Health check',
        'GET /api/docs': 'API documentation'
      }
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: '/api/docs'
  });
});

// Socket.io middleware and handling
io.use(socketLogger);
const socketHandler = new SocketHandler(io);
io.on('connection', (socket) => socketHandler.handleConnection(socket));

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start server
server.listen(config.port, () => {
  console.log(`🚀 BizChat MVP Server running on port ${config.port}`);
  console.log(`📡 CORS enabled for: ${config.corsOrigin}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${config.port}/api/health`);
});

module.exports = app;