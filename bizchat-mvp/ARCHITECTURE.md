# BizChat MVP - System Architecture

## 🏗️ Architecture Overview

BizChat MVP follows a modern client-server architecture with real-time communication capabilities. The system is designed for scalability, maintainability, and optimal user experience.

```
┌─────────────────┐    WebSocket/HTTP    ┌─────────────────┐
│                 │ ◄─────────────────► │                 │
│   React Client  │                     │   Node.js API   │
│   (Frontend)    │                     │   (Backend)     │
│                 │                     │                 │
└─────────────────┘                     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │                 │
                                        │  SQLite Database│
                                        │                 │
                                        └─────────────────┘
```

## 🗄️ Database Schema

### Tables Structure

#### `businesses`
```sql
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  status TEXT DEFAULT 'online',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `conversations`
```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  business_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);
```

#### `messages`
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL, -- 'business' or 'customer'
  sender_name TEXT NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text', -- 'text', 'file', 'image'
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### Entity Relationships

```
businesses (1) ──── (many) conversations (1) ──── (many) messages
```

## 🔌 API Endpoints

### REST API Routes

#### Conversations
- `GET /api/conversations/business/:businessId` - Get all conversations for a business
- `GET /api/conversations/:id/messages` - Get messages for a conversation
- `POST /api/conversations/:id/messages` - Send a new message

#### File Upload
- `POST /api/upload` - Upload files (images, PDFs, documents)

#### Health Check
- `GET /api/health` - Server health status

### Request/Response Examples

#### Get Conversations
```javascript
// Request
GET /api/conversations/business/tech-store

// Response
[
  {
    "id": 1,
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "business_id": "tech-store",
    "status": "active",
    "last_message": "Hello, I need help",
    "last_message_time": "2024-01-15T10:30:00Z",
    "unread_count": 2,
    "created_at": "2024-01-15T09:00:00Z"
  }
]
```

#### Send Message
```javascript
// Request
POST /api/conversations/1/messages
{
  "senderType": "business",
  "senderName": "Support Agent",
  "content": "How can I help you?",
  "messageType": "text"
}

// Response
{
  "id": 123,
  "conversation_id": 1,
  "sender_type": "business",
  "sender_name": "Support Agent",
  "content": "How can I help you?",
  "message_type": "text",
  "status": "sent",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

## 🔄 Socket.io Events

### Real-time Communication Flow

```
Client                          Server
  │                              │
  ├─ join_business ─────────────► │ (joins business room)
  │                              │
  ├─ join_conversation ─────────► │ (joins conversation room)
  │                              │
  ├─ typing_start ──────────────► │ ──► broadcast to room
  │                              │
  ├─ typing_stop ───────────────► │ ──► broadcast to room
  │                              │
  │ ◄─ new_message ──────────────┤ (new message received)
  │                              │
  │ ◄─ user_typing ──────────────┤ (typing indicator)
  │                              │
  │ ◄─ user_stop_typing ─────────┤ (stop typing indicator)
```

### Event Definitions

#### Client → Server Events
```javascript
// Join business room for notifications
socket.emit('join_business', businessId);

// Join specific conversation
socket.emit('join_conversation', conversationId);

// Typing indicators
socket.emit('typing_start', {
  conversationId,
  senderName,
  senderType
});

socket.emit('typing_stop', {
  conversationId,
  senderName,
  senderType
});
```

#### Server → Client Events
```javascript
// New message broadcast
socket.emit('new_message', {
  id: 123,
  conversation_id: 1,
  sender_type: 'customer',
  sender_name: 'John Doe',
  content: 'Hello!',
  timestamp: '2024-01-15T10:30:00Z'
});

// Typing indicators
socket.emit('user_typing', {
  senderName: 'John Doe',
  senderType: 'customer'
});

socket.emit('user_stop_typing', {
  senderName: 'John Doe',
  senderType: 'customer'
});
```

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
└── AppLayout
    ├── ConversationSidebar
    │   └── ConversationItem (multiple)
    ├── ChatArea
    │   ├── ChatHeader
    │   ├── MessageList
    │   │   ├── MessageBubble (multiple)
    │   │   └── TypingIndicator
    │   └── MessageInput
    └── CustomerPanel
```

### State Management

#### Custom Hooks
- `useSocket(businessId)` - Manages Socket.io connection
- `useConversations(businessId)` - Fetches and manages conversations
- `useMessages(conversationId)` - Handles messages and real-time updates

#### Data Flow
```
API Service ──► Custom Hooks ──► React Components ──► UI Updates
     ▲                                    │
     └────────── User Actions ────────────┘
```

### Service Layer

#### API Service (`services/api.js`)
```javascript
// Conversation API methods
conversationAPI.getConversations(businessId)
conversationAPI.getMessages(conversationId)
conversationAPI.sendMessage(conversationId, messageData)

// Upload API methods
uploadAPI.uploadFile(formData)
```

#### Socket Service (`services/socket.js`)
```javascript
// Connection management
socketService.connect()
socketService.disconnect()

// Room management
socketService.joinBusiness(businessId)
socketService.joinConversation(conversationId)

// Messaging
socketService.sendTyping(conversationId, senderName, senderType)
socketService.stopTyping(conversationId, senderName, senderType)

// Event listeners
socketService.onNewMessage(callback)
socketService.onUserTyping(callback)
socketService.onUserStopTyping(callback)
```

## 🔒 Security Considerations

### File Upload Security
- File type validation (images, PDFs, documents only)
- File size limits (10MB maximum)
- Unique filename generation using UUID
- Secure file serving through Express static middleware

### CORS Configuration
- Configured for development and production environments
- Restricts origins to authorized domains

### Input Validation
- Message content sanitization
- File upload validation
- SQL injection prevention through parameterized queries

## 📈 Scalability Considerations

### Current Architecture Limitations
- SQLite database (single file, not suitable for high concurrency)
- In-memory Socket.io rooms (lost on server restart)
- Local file storage (not distributed)

### Recommended Improvements for Production
1. **Database**: Migrate to PostgreSQL or MongoDB
2. **File Storage**: Use AWS S3 or similar cloud storage
3. **Socket.io**: Implement Redis adapter for multi-server support
4. **Caching**: Add Redis for session and message caching
5. **Load Balancing**: Implement horizontal scaling with load balancers

## 🚀 Deployment Architecture

### Development Environment
```
localhost:3000 (React Dev Server) ──► localhost:5000 (Node.js Server)
                                              │
                                              ▼
                                      ./database.sqlite
                                      ./uploads/
```

### Production Environment
```
Vercel (Frontend) ──► Railway/Render (Backend) ──► SQLite Database
                                │
                                ▼
                        Cloud File Storage
```

## 🔧 Configuration Management

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development|production
UPLOAD_DIR=./uploads
DB_PATH=./database.sqlite
CORS_ORIGIN=http://localhost:3000
```

#### Frontend
```env
REACT_APP_API_URL=http://localhost:5000
```

## 📊 Performance Considerations

### Database Optimization
- Indexed queries on frequently accessed columns
- Efficient JOIN operations for conversation/message retrieval
- Pagination for message history (LIMIT/OFFSET)

### Real-time Performance
- Room-based message broadcasting (only to relevant users)
- Connection tracking with Map() for efficient lookups
- Typing indicator debouncing (2-second timeout)

### Frontend Optimization
- Component memoization for conversation lists
- Efficient re-rendering with proper React keys
- Lazy loading for message history
- Optimistic UI updates for better perceived performance

---

This architecture provides a solid foundation for a business chat application while maintaining simplicity and development speed for the MVP phase.