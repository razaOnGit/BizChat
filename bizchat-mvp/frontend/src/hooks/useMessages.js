import { useState, useEffect, useCallback, useRef } from 'react';
import { conversationAPI } from '../services/api';
import socketService from '../services/socket';

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typing, setTyping] = useState(null);
  
  // Use refs to store current callback references for cleanup
  const handlersRef = useRef({});
  const currentConversationRef = useRef(conversationId);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await conversationAPI.getMessages(conversationId);
      
      // Only update if this is still the current conversation
      if (currentConversationRef.current === conversationId) {
        setMessages(response.data?.messages || response.data || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      
      // Only update error if this is still the current conversation
      if (currentConversationRef.current === conversationId) {
        setError(err.message || 'Failed to load messages');
        setMessages([]);
      }
    } finally {
      // Only update loading if this is still the current conversation
      if (currentConversationRef.current === conversationId) {
        setLoading(false);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    // Update current conversation reference
    currentConversationRef.current = conversationId;

    if (conversationId) {
      // Load messages
      loadMessages();
      
      // Join conversation room
      socketService.joinConversation(conversationId);
      
      // Define event handlers
      const handleNewMessage = (message) => {
        // Check if message belongs to current conversation
        const messageConvId = message.conversation_id || message.conversationId;
        if (messageConvId === parseInt(conversationId)) {
          setMessages(prev => {
            // Prevent duplicate messages
            const messageExists = prev.some(m => m.id === message.id);
            if (messageExists) return prev;
            return [...prev, message];
          });
        }
      };

      const handleUserTyping = (data) => {
        // Only show typing for current conversation
        if (data.conversationId === parseInt(conversationId)) {
          setTyping(data);
        }
      };

      const handleUserStopTyping = (data) => {
        // Only clear typing for current conversation
        if (!data || data.conversationId === parseInt(conversationId)) {
          setTyping(null);
        }
      };

      const handleMessageDelivered = (data) => {
        if (data.conversationId === parseInt(conversationId)) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, status: 'delivered' }
              : msg
          ));
        }
      };

      const handleMessageRead = (data) => {
        if (data.conversationId === parseInt(conversationId)) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, status: 'read' }
              : msg
          ));
        }
      };

      const handleError = (error) => {
        console.error('Socket error:', error);
        setError(error.message || 'Connection error');
      };

      // Store handlers in ref for cleanup
      handlersRef.current = {
        handleNewMessage,
        handleUserTyping,
        handleUserStopTyping,
        handleMessageDelivered,
        handleMessageRead,
        handleError
      };

      // Add socket listeners
      socketService.onNewMessage(handleNewMessage);
      socketService.onUserTyping(handleUserTyping);
      socketService.onUserStopTyping(handleUserStopTyping);
      socketService.onMessageDelivered(handleMessageDelivered);
      socketService.onMessageRead(handleMessageRead);
      socketService.onError(handleError);

      // Cleanup function - CRITICAL for preventing memory leaks
      return () => {
        // Leave conversation room
        socketService.leaveConversation(conversationId);
        
        // Remove all socket listeners using stored references
        const handlers = handlersRef.current;
        if (handlers.handleNewMessage) {
          socketService.removeListener('new_message', handlers.handleNewMessage);
        }
        if (handlers.handleUserTyping) {
          socketService.removeListener('user_typing', handlers.handleUserTyping);
        }
        if (handlers.handleUserStopTyping) {
          socketService.removeListener('user_stop_typing', handlers.handleUserStopTyping);
        }
        if (handlers.handleMessageDelivered) {
          socketService.removeListener('message_delivered', handlers.handleMessageDelivered);
        }
        if (handlers.handleMessageRead) {
          socketService.removeListener('message_read', handlers.handleMessageRead);
        }
        if (handlers.handleError) {
          socketService.removeListener('error', handlers.handleError);
        }
        
        // Clear handlers reference
        handlersRef.current = {};
        
        // Clear typing state
        setTyping(null);
        setError(null);
      };
    } else {
      // Clear state when no conversation is selected
      setMessages([]);
      setLoading(false);
      setError(null);
      setTyping(null);
    }
  }, [conversationId, loadMessages]);

  const sendMessage = useCallback(async (messageData) => {
    if (!conversationId) {
      throw new Error('No conversation selected');
    }

    try {
      setError(null);
      const response = await conversationAPI.sendMessage(conversationId, messageData);
      
      // Message will be added via socket event, but add optimistically for better UX
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        conversationId: parseInt(conversationId),
        content: messageData.content,
        senderType: messageData.senderType,
        senderId: messageData.senderId,
        timestamp: new Date().toISOString(),
        status: 'sending',
        isOptimistic: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [conversationId]);

  const markAsRead = useCallback(async (messageId) => {
    try {
      // Emit socket event to mark message as read
      if (socketService.socket) {
        socketService.socket.emit('message_read', {
          messageId,
          conversationId: parseInt(conversationId)
        });
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [conversationId]);

  const retryLoadMessages = useCallback(() => {
    setError(null);
    loadMessages();
  }, [loadMessages]);

  return { 
    messages, 
    loading, 
    error,
    typing, 
    sendMessage,
    markAsRead,
    retryLoadMessages
  };
};