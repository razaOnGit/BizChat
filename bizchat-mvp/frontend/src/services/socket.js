import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(serverUrl = 'http://localhost:5000') {
    if (!this.socket) {
      this.socket = io(serverUrl);
      this.setupEventListeners();
    }
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  joinBusiness(businessId) {
    if (this.socket) {
      this.socket.emit('join_business', businessId);
    }
  }

  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  sendTyping(conversationId, senderName, senderType) {
    if (this.socket) {
      this.socket.emit('typing_start', { conversationId, senderName, senderType });
    }
  }

  stopTyping(conversationId, senderName, senderType) {
    if (this.socket) {
      this.socket.emit('typing_stop', { conversationId, senderName, senderType });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;