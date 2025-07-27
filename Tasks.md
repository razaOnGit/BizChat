# BizChat MVP - Implementation Tasks

## 📋 Task Breakdown for Senior Software Engineer

**Total Timeline:** 8 hours (1 working day)  
**Project:** Business Chat Application MVP  
**Goal:** Demonstrate core messaging capabilities for BotSpace interview

---

## 🏗️ Phase 1: Project Setup & Architecture (30 minutes)

### Task 1.1: Initialize Project Structure (15 minutes)
- [x] Create main project directory `bizchat-mvp`
- [x] Initialize backend with Node.js
  - [x] `npm init -y` in backend folder
  - [x] Install dependencies: `express socket.io cors multer sqlite3 uuid path`
- [x] Initialize frontend with React
  - [x] `npx create-react-app frontend`
  - [x] Install dependencies: `socket.io-client axios react-router-dom`
- [x] Create folder structure:
  ```
  bizchat-mvp/
  ├── backend/
  │   ├── src/
  │   │   ├── config/
  │   │   ├── controllers/
  │   │   ├── models/
  │   │   ├── routes/
  │   │   ├── middleware/
  │   │   └── utils/
  │   ├── uploads/
  │   └── server.js
  └── frontend/

      ├── src/






      │   ├── components/
      │   ├── services/
      │   ├── hooks/
      │   └── utils/
      └── public/
  ```



### Task 1.2: Environment Configuration (15 minutes)
- [x] Create `.env` file for backend with:
  - [x] PORT=5000
  - [x] NODE_ENV=development
  - [x] UPLOAD_DIR=./uploads
  - [x] DB_PATH=./database.sqlite
- [ ] Create `config.js` file with environment variables
- [x] Set up CORS configuration for development

**Deliverable:** ✅ Project structure with proper configuration

---

## 🔧 Phase 2: Backend Development (2.5 hours)

### Task 2.1: Database Setup & Models (45 minutes)
- [x] Create SQLite database connection in `models/database.js`
- [x] Implement database schema:
  - [x] `businesses` table (id, name, logo_url, status, created_at)
  - [x] `conversations` table (id, customer_name, customer_phone, business_id, status, last_message_at, created_at)
  - [x] `messages` table (id, conversation_id, sender_type, sender_name, content, message_type, file_url, file_name, status, timestamp)
- [x] Create database initialization methods
- [x] Implement seed data for demo:
  - [x] Demo business: "Tech Store Support"
  - [x] 3 mock conversations with customers
- [x] Create database query methods:
  - [x] `getConversations(businessId)`
  - [x] `getMessages(conversationId, limit)`
  - [x] `createMessage(messageData)`

**Deliverable:** ✅ Working database with demo data

### Task 2.2: API Routes Development (60 minutes)
- [x] Create `routes/conversations.js`:
  - [x] GET `/business/:businessId` - Fetch all conversations
  - [x] GET `/:id/messages` - Fetch messages for conversation
  - [x] POST `/:id/messages` - Send new message
- [x] Create `routes/upload.js`:
  - [x] POST `/` - Handle file uploads with Multer
  - [x] File validation (images, PDFs, docs)
  - [x] 10MB file size limit
  - [x] Generate unique filenames with UUID
- [x] Implement error handling and validation
- [x] Add CORS middleware
- [x] Create health check endpoint

**Deliverable:** ✅ RESTful API endpoints with file upload

### Task 2.3: Socket.io Real-time Implementation (45 minutes)
- [x] Create `socket/socketHandler.js` class
- [x] Implement socket event handlers:
  - [x] `join_business` - Join business room
  - [x] `join_conversation` - Join conversation room
  - [x] `typing_start` / `typing_stop` - Typing indicators
  - [x] `message_delivered` - Message status updates
  - [x] `disconnect` - Clean up connections
- [x] Create user connection tracking with Map()
- [x] Implement room-based message broadcasting
- [x] Add logging for debugging

**Deliverable:** ✅ Real-time messaging with typing indicators

### Task 2.4: Main Server Setup (30 minutes)
- [x] Create main `server.js` file
- [x] Configure Express app with middleware
- [x] Integrate Socket.io with HTTP server
- [x] Mount API routes
- [x] Serve static files from uploads directory
- [x] Make Socket.io instance available to routes
- [x] Start server with proper error handling
- [x] Add development logging

**Deliverable:** ✅ Complete backend server ready for testing

---

## ⚛️ Phase 3: Frontend Development (3 hours)

### Task 3.1: API Service Layer (30 minutes)
- [x] Create `services/api.js` with Axios configuration
- [x] Implement conversation API methods:
  - [x] `getConversations(businessId)`
  - [x] `getMessages(conversationId)`
  - [x] `sendMessage(conversationId, messageData)`
- [x] Implement upload API:
  - [x] `uploadFile(formData)`
- [x] Create `services/socket.js` service class:
  - [x] Connection management
  - [x] Room joining methods
  - [x] Typing indicator methods
  - [x] Event listener management
- [x] Add error handling and timeouts

**Deliverable:** ✅ API service layer with Socket.io integration

### Task 3.2: Custom React Hooks (30 minutes)
- [x] Create `hooks/useSocket.js`:
  - [x] Socket connection management
  - [x] Business room joining
  - [x] Cleanup on unmount
- [x] Create `hooks/useConversations.js`:
  - [x] Fetch conversations for business
  - [x] Loading and error states
  - [x] Refetch functionality
- [x] Create `hooks/useMessages.js`:
  - [x] Fetch messages for conversation
  - [x] Real-time message updates
  - [x] Typing indicator management
  - [x] Send message functionality

**Deliverable:** ✅ Reusable hooks for state management

### Task 3.3: Main React Components (90 minutes)
- [x] Create `Layout/AppLayout.js` (15 minutes):
  - [x] Main application layout
  - [x] Business header with status
  - [x] Three-panel layout (sidebar, chat, customer info)
  - [x] Socket connection initialization
- [x] Create `Conversations/ConversationSidebar.js` (20 minutes):
  - [x] List of conversations
  - [x] Search functionality
  - [x] Conversation selection
  - [x] Loading and error states
- [x] Create `Conversations/ConversationItem.js` (15 minutes):
  - [x] Individual conversation display
  - [x] Customer avatar, name, last message
  - [x] Unread count badge
  - [x] Status indicator
  - [x] Time formatting
- [x] Create `Chat/ChatArea.js` (15 minutes):
  - [x] Main chat interface
  - [x] Empty state when no conversation selected
  - [x] Integration with chat components
- [x] Create `Chat/MessageList.js` (15 minutes):
  - [x] Scrollable message container
  - [x] Auto-scroll to bottom
  - [x] Typing indicator display
  - [x] Loading state
- [x] Create `Chat/MessageInput.js` (20 minutes):
  - [x] Text input with auto-resize
  - [x] File upload button
  - [x] Send button
  - [x] Typing indicator emission
  - [x] Enter key handling

**Deliverable:** ✅ Complete React component structure

### Task 3.4: Basic Styling (30 minutes)
- [x] Create `AppLayout.css`:
  - [x] Professional header styling
  - [x] Three-panel responsive layout
  - [x] Business branding colors
- [x] Create `ConversationSidebar.css`:
  - [x] Sidebar layout and scrolling
  - [x] Conversation item styling
  - [x] Selected state indicators
  - [x] Unread badges
- [x] Create `ConversationItem.css`:
  - [x] Avatar styling
  - [x] Text truncation
  - [x] Status indicators
  - [x] Hover effects
- [x] Create `ChatArea.css`:
  - [x] Chat layout and empty states
  - [x] Clean, professional appearance
- [x] Create `MessageList.css` and `MessageInput.css`:
  - [x] Message bubble styling
  - [x] Input area design
  - [x] Button styling

**Deliverable:** ✅ Professional UI styling

---

## 🧪 Phase 4: Testing & Polish (1 hour)

### Task 4.1: Missing Component Implementation (30 minutes)
- [x] Create `Chat/MessageBubble.js`:
  - [x] Different styles for business vs customer messages
  - [x] File and image display
  - [x] Timestamp formatting
  - [x] Message status indicators
- [x] Create `Chat/ChatHeader.js`:
  - [x] Customer information display
  - [x] Action buttons (call, info)
  - [x] Professional header design
- [x] Create `Chat/TypingIndicator.js`:
  - [x] Animated typing dots
  - [x] Sender name display
- [x] Create `Customer/CustomerPanel.js`:
  - [x] Customer information display
  - [x] Quick action buttons
  - [x] Professional side panel design

**Deliverable:** ✅ Complete component implementation

### Task 4.2: Component Styling & Testing (30 minutes)
- [x] Add CSS for new components:
  - [x] `MessageBubble.css` - Chat bubble styling
  - [x] `ChatHeader.css` - Header layout
  - [x] `CustomerPanel.css` - Side panel design
- [x] Test real-time functionality:
  - [x] Open multiple browser tabs
  - [x] Test message sending/receiving
  - [x] Test file uploads
  - [x] Test typing indicators
- [x] Fix any styling or functionality issues
- [x] Add loading states and error handling

**Deliverable:** ✅ Fully functional MVP with professional UI

---

## 🚀 Phase 5: Deployment (1 hour)

### Task 5.1: Production Build Configuration (30 minutes)
- [x] Add production scripts to `backend/package.json`:
  - [x] `"start": "node server.js"`
  - [x] `"dev": "nodemon server.js"`
- [ ] Configure frontend environment variables:
  - [ ] `REACT_APP_API_URL` for production API
- [ ] Create production build:
  - [ ] `npm run build` in frontend
  - [ ] Test production build locally
- [ ] Create deployment configuration files

**Deliverable:** ✅ Production-ready build configuration

### Task 5.2: Deploy to Cloud Platforms (30 minutes)
- [ ] Deploy backend to Railway/Render:
  - [ ] Connect GitHub repository
  - [ ] Configure environment variables
  - [ ] Deploy and test API endpoints
- [ ] Deploy frontend to Vercel:
  - [ ] Connect GitHub repository
  - [ ] Configure build settings
  - [ ] Set production API URL
- [ ] Test deployed application:
  - [ ] Verify real-time messaging works
  - [ ] Test file uploads
  - [ ] Check responsive design

**Deliverable:** ✅ Live deployed MVP application

---

## 📚 Phase 6: Documentation (30 minutes)

### Task 6.1: Create Project Documentation (30 minutes)
- [x] Write comprehensive `README.md`:
  - [x] Project overview and features
  - [x] Tech stack details
  - [x] Installation instructions
  - [x] API documentation
  - [x] Deployment guide
- [x] Create `ARCHITECTURE.md`:
  - [x] System architecture overview
  - [x] Database schema
  - [x] API endpoints
  - [x] Socket.io events
- [x] Add inline code comments
- [x] Create demo data documentation

**Deliverable:** ✅ Complete project documentation

---

## ✅ Task Completion Checklist

### Backend Complete When:
- [x] ✅ SQLite database with seed data
- [x] ✅ RESTful API endpoints working
- [x] ✅ File upload functionality
- [x] ✅ Socket.io real-time messaging
- [x] ✅ Server running without errors

### Frontend Complete When:
- [x] ✅ All React components rendering
- [x] ✅ Real-time messaging working
- [x] ✅ File upload/display working
- [x] ✅ Professional UI styling
- [x] ✅ Responsive design

### MVP Complete When:
- [x] ✅ Can send/receive messages in real-time
- [x] ✅ Can upload and share files
- [x] ✅ Typing indicators working
- [x] ✅ Conversation management working
- [ ] ✅ Deployed and accessible online

---

## 🎯 Success Metrics

**Technical Demonstration:**
- [x] Real-time messaging between browser tabs
- [x] File sharing with preview
- [x] Professional business chat UI
- [x] Conversation switching
- [x] Message history persistence

**Business Value Demonstration:**
- [x] Clear business vs customer interface distinction
- [x] Professional branding and design
- [x] Scalable architecture foundation
- [ ] Production deployment capability

---

## 🚨 Priority Order

### Must Complete (Core MVP):
1. ✅ Database setup with demo data
2. ✅ Real-time messaging functionality
3. ✅ Basic React components
4. ✅ Professional UI styling
5. ✅ File upload capability

### Should Complete (Polish):
6. ✅ Typing indicators
7. ✅ Message status tracking
8. ✅ Customer information panel
9. [ ] Deployment

### Could Complete (Nice-to-have):
10. ✅ Advanced error handling
11. ✅ Loading animations
12. ✅ Comprehensive documentation

---

## 🔧 Tools & Resources

**Development:**
- VS Code with React/Node.js extensions
- Postman for API testing
- Chrome DevTools for debugging
- Multiple browser tabs for real-time testing

**Deployment:**
- Render for backend
- Vercel for frontend
- GitHub for version control

**Testing:**
- Open multiple browser tabs
- Test file uploads with different file types
- Test real-time messaging
- Verify responsive design

---

