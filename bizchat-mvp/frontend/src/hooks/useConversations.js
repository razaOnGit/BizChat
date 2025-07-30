import { useState, useEffect, useCallback } from 'react';
import { conversationAPI } from '../services/api';

export const useConversations = (businessId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!businessId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await conversationAPI.getConversations(businessId);
      
      // Handle different response structures
      let conversationsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          conversationsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          conversationsData = response.data.data;
        }
      }
      
      setConversations(conversationsData);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return { conversations, loading, error, refetch: loadConversations };
};