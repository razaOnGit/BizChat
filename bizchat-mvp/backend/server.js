require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'BizChat MVP API',
    version: '1.0.0',
    endpoints: {
      conversations: {
        'GET /api/conversations/business/:businessId': 'Get all conversations for a business',
        'GET /api/conversations/:id/messages': 'Get messages for a conversation',
        'POST /api/conversations/:id/messages': 'Send a new message'
      },
      upload: {
        'POST /api/upload': 'Upload a file'
      },
      system: {
        'GET /api/health': 'Health check',
        'GET /api/docs': 'API documentation'
      }
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Socket.io handling
const SocketHandler = require('./src/socket/socketHandler');
const socketHandler = new SocketHandler(io);
io.on('connection', (socket) => socketHandler.handleConnection(socket));

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
server.listen(port, () => {
  console.log(`🚀 BizChat MVP Server running on http://localhost:${port}`);
  console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${port}/api/health`);
});

// Test database connection after startup
setTimeout(async () => {
  try {
    console.log('\n🔍 Testing database connection...');
    const database = require('./src/models/database');
    const conversations = await database.getConversations('tech-store');
    console.log(`✅ Database connected! Found ${conversations.length} conversations:`);
    conversations.forEach((conv, index) => {
      console.log(`  ${index + 1}. ${conv.customer_name} - "${conv.last_message || 'No message'}"`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}, 3000);

module.exports = app;