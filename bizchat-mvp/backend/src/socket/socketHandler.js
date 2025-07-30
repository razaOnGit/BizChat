const { SOCKET_EVENTS, TYPING_TIMEOUT } = require('../utils/constants');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.typingUsers = new Map();
  }

  handleConnection(socket) {
    console.log(`[Socket] User connected: ${socket.id} from ${socket.handshake.address}`);

    // Join business room
    socket.on(SOCKET_EVENTS.JOIN_BUSINESS, (businessId) => {
      socket.join(`business_${businessId}`);
      this.connectedUsers.set(socket.id, { 
        businessId, 
        type: 'business',
        joinedAt: new Date().toISOString()
      });
      

      
      console.log(`[Socket] Business ${businessId} joined by ${socket.id}`);
    });

    // Join conversation room
    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      
      // Update user info
      const userInfo = this.connectedUsers.get(socket.id) || {};
      userInfo.currentConversation = conversationId;
      this.connectedUsers.set(socket.id, userInfo);
      
      console.log(`[Socket] ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      
      // Clear typing status if user was typing
      this.clearTypingStatus(socket.id, conversationId);
      
      // Update user info
      const userInfo = this.connectedUsers.get(socket.id) || {};
      delete userInfo.currentConversation;
      this.connectedUsers.set(socket.id, userInfo);
      
      console.log(`[Socket] ${socket.id} left conversation ${conversationId}`);
    });

    // Handle typing events with timeout
    socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
      const { conversationId, senderName, senderType } = data;
      
      // Clear existing timeout
      this.clearTypingTimeout(socket.id);
      
      // Set typing status
      this.typingUsers.set(socket.id, {
        conversationId,
        senderName,
        senderType,
        startedAt: new Date().toISOString()
      });
      
      // Broadcast typing status
      socket.to(`conversation_${conversationId}`).emit(SOCKET_EVENTS.USER_TYPING, {
        senderName,
        senderType,
        timestamp: new Date().toISOString()
      });
      
      // Set auto-stop timeout
      const timeout = setTimeout(() => {
        this.clearTypingStatus(socket.id, conversationId);
      }, TYPING_TIMEOUT);
      
      this.typingUsers.get(socket.id).timeout = timeout;
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
      this.clearTypingStatus(socket.id, data.conversationId);
    });

    // Handle message status updates
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, (data) => {
      const { messageId, conversationId } = data;
      
      socket.to(`conversation_${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
        messageId,
        status: 'delivered',
        timestamp: new Date().toISOString()
      });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, (data) => {
      const { messageId, conversationId } = data;
      
      socket.to(`conversation_${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
        messageId,
        status: 'read',
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const userInfo = this.connectedUsers.get(socket.id);
      
      if (userInfo) {
        // Clear typing status
        if (userInfo.currentConversation) {
          this.clearTypingStatus(socket.id, userInfo.currentConversation);
        }
        

        
        this.connectedUsers.delete(socket.id);
      }
      
      console.log(`[Socket] User disconnected: ${socket.id} - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket] Error from ${socket.id}:`, error);
    });
  }

  // Helper method to clear typing status
  clearTypingStatus(socketId, conversationId) {
    const typingInfo = this.typingUsers.get(socketId);
    
    if (typingInfo && typingInfo.conversationId === conversationId) {
      // Clear timeout
      if (typingInfo.timeout) {
        clearTimeout(typingInfo.timeout);
      }
      
      // Broadcast stop typing
      this.io.to(`conversation_${conversationId}`).emit(SOCKET_EVENTS.USER_STOP_TYPING, {
        senderName: typingInfo.senderName,
        senderType: typingInfo.senderType,
        timestamp: new Date().toISOString()
      });
      
      this.typingUsers.delete(socketId);
    }
  }

  // Helper method to clear typing timeout
  clearTypingTimeout(socketId) {
    const typingInfo = this.typingUsers.get(socketId);
    if (typingInfo && typingInfo.timeout) {
      clearTimeout(typingInfo.timeout);
    }
  }


}

module.exports = SocketHandler;