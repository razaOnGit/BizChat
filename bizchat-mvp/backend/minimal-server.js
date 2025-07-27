// Minimal server for testing
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = 5000;

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_business', (businessId) => {
    socket.join(`business_${businessId}`);
    console.log(`User ${socket.id} joined business ${businessId}`);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', data);
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stop_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Test routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Minimal server is working!',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

app.get('/api/conversations/business/tech-store', (req, res) => {
  res.json([
    {
      id: 1,
      customer_name: 'John Doe',
      customer_phone: '+1234567890',
      status: 'active',
      last_message: 'Hello, I need help with my order',
      last_message_time: new Date().toISOString(),
      unread_count: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      customer_name: 'Sarah Johnson',
      customer_phone: '+1234567891',
      status: 'active',
      last_message: 'Is my order ready for pickup?',
      last_message_time: new Date().toISOString(),
      unread_count: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      customer_name: 'Mike Chen',
      customer_phone: '+1234567892',
      status: 'resolved',
      last_message: 'Thank you for the quick response!',
      last_message_time: new Date().toISOString(),
      unread_count: 0,
      created_at: new Date().toISOString()
    }
  ]);
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const conversationId = req.params.id;
  const messages = [
    {
      id: 1,
      conversation_id: parseInt(conversationId),
      sender_type: 'customer',
      sender_name: 'John Doe',
      content: 'Hello, I need help with my order',
      message_type: 'text',
      status: 'delivered',
      timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    },
    {
      id: 2,
      conversation_id: parseInt(conversationId),
      sender_type: 'business',
      sender_name: 'Support Agent',
      content: 'Hi John! I\'d be happy to help you with that. Can you please provide your order number?',
      message_type: 'text',
      status: 'delivered',
      timestamp: new Date(Date.now() - 240000).toISOString() // 4 minutes ago
    },
    {
      id: 3,
      conversation_id: parseInt(conversationId),
      sender_type: 'customer',
      sender_name: 'John Doe',
      content: 'Sure, it\'s #ORD-12345',
      message_type: 'text',
      status: 'delivered',
      timestamp: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
    }
  ];
  
  res.json(messages);
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const conversationId = req.params.id;
  const { senderType, senderName, content, messageType } = req.body;
  
  const newMessage = {
    id: Date.now(),
    conversation_id: parseInt(conversationId),
    sender_type: senderType,
    sender_name: senderName,
    content: content,
    message_type: messageType || 'text',
    status: 'sent',
    timestamp: new Date().toISOString()
  };

  // Emit to socket room
  io.to(`conversation_${conversationId}`).emit('new_message', newMessage);
  
  res.status(201).json(newMessage);
});

// File upload endpoint (mock)
app.post('/api/upload', (req, res) => {
  res.json({
    filename: 'mock-file.jpg',
    originalName: 'uploaded-file.jpg',
    url: '/uploads/mock-file.jpg',
    size: 12345
  });
});

server.listen(port, () => {
  console.log(`🚀 Minimal server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`💬 Test conversations: http://localhost:${port}/api/conversations/business/tech-store`);
  console.log(`🔌 Socket.io enabled for real-time messaging`);
});