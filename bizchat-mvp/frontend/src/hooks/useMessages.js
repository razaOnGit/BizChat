import { useState, useEffect, useCallback } from 'react';
import { conversationAPI } from '../services/api';
import socketService from '../services/socket';

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await conversationAPI.getMessages(conversationId);
      setMessages(response.data);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      socketService.joinConversation(conversationId);
      
      // Listen for new messages
      const handleNewMessage = (message) => {
        if (message.conversation_id === parseInt(conversationId) || message.conversationId === parseInt(conversationId)) {
          setMessages(prev => [...prev, message]);
        }
      };

      // Listen for typing indicators
      const handleUserTyping = (data) => {
        setTyping(data);
      };

      const handleUserStopTyping = () => {
        setTyping(null);
      };

      socketService.onNewMessage(handleNewMessage);
      socketService.onUserTyping(handleUserTyping);
      socketService.onUserStopTyping(handleUserStopTyping);

      // Cleanup function
      return () => {
        setTyping(null);
      };
    } else {
      setMessages([]);
      setLoading(false);
      setTyping(null);
    }
  }, [conversationId, loadMessages]);

  const sendMessage = async (messageData) => {
    try {
      const response = await conversationAPI.sendMessage(conversationId, messageData);
      // Message will be added via socket event
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  return { messages, loading, typing, sendMessage };
};