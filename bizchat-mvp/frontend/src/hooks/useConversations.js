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
      setConversations(response.data || []);
    } catch (err) {
      setError(err.message);
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