import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const conversationAPI = {
  getConversations: (businessId) => 
    api.get(`/conversations/business/${businessId}`),
    
  getMessages: (conversationId) => 
    api.get(`/conversations/${conversationId}/messages`),
    
  sendMessage: (conversationId, messageData) => 
    api.post(`/conversations/${conversationId}/messages`, messageData),
};

export const uploadAPI = {
  uploadFile: (formData) => 
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default api;