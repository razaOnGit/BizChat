import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // Track active listeners for cleanup
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(serverUrl = 'http://localhost:5000') {
    if (!this.socket) {
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts
      });
      this.setupEventListeners();
    }
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after', this.maxReconnectAttempts, 'attempts');
    });
  }

  joinBusiness(businessId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_business', businessId);
    }
  }

  joinConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  sendTyping(conversationId, senderName, senderType) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { conversationId, senderName, senderType });
    }
  }

  stopTyping(conversationId, senderName, senderType) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { conversationId, senderName, senderType });
    }
  }

  // Enhanced listener methods with proper cleanup tracking
  onNewMessage(callback) {
    if (this.socket) {
      // Remove existing listener first to prevent duplicates
      this.removeListener('new_message', callback);
      
      // Add new listener and track it
      this.socket.on('new_message', callback);
      this.trackListener('new_message', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.removeListener('user_typing', callback);
      this.socket.on('user_typing', callback);
      this.trackListener('user_typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.removeListener('user_stop_typing', callback);
      this.socket.on('user_stop_typing', callback);
      this.trackListener('user_stop_typing', callback);
    }
  }

  onMessageDelivered(callback) {
    if (this.socket) {
      this.removeListener('message_delivered', callback);
      this.socket.on('message_delivered', callback);
      this.trackListener('message_delivered', callback);
    }
  }

  onMessageRead(callback) {
    if (this.socket) {
      this.removeListener('message_read', callback);
      this.socket.on('message_read', callback);
      this.trackListener('message_read', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.removeListener('error', callback);
      this.socket.on('error', callback);
      this.trackListener('error', callback);
    }
  }

  // NEW: Track listeners for cleanup
  trackListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // NEW: Remove specific listener
  removeListener(event, callback) {
    if (this.socket && callback) {
      this.socket.off(event, callback);
      
      // Remove from tracking
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
        if (this.listeners.get(event).size === 0) {
          this.listeners.delete(event);
        }
      }
    }
  }

  // NEW: Remove all listeners for a specific event
  removeAllListeners(event) {
    if (this.socket) {
      if (event) {
        // Remove specific event listeners
        this.socket.removeAllListeners(event);
        this.listeners.delete(event);
      } else {
        // Remove all listeners
        this.socket.removeAllListeners();
        this.listeners.clear();
      }
    }
  }

  // NEW: Complete cleanup method
  cleanup() {
    if (this.socket) {
      // Remove all tracked listeners
      for (const [event, callbacks] of this.listeners.entries()) {
        for (const callback of callbacks) {
          this.socket.off(event, callback);
        }
      }
      
      // Clear tracking
      this.listeners.clear();
      
      // Remove all listeners (including system ones)
      this.socket.removeAllListeners();
    }
  }

  // NEW: Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      activeListeners: Array.from(this.listeners.keys())
    };
  }

  // NEW: Force reconnection
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  // Enhanced disconnect with proper cleanup
  disconnect() {
    if (this.socket) {
      // Clean up all listeners first
      this.cleanup();
      
      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }
}

const socketService = new SocketService();
export default socketService;