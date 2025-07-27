import React, { useState, useRef } from 'react';
import { uploadAPI } from '../../services/api';
import socketService from '../../services/socket';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, conversationId }) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  let typingTimeout = useRef(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await onSendMessage({
        senderType: 'business',
        senderName: 'Support Agent',
        content: message,
        messageType: 'text'
      });
      setMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadAPI.uploadFile(formData);
      
      await onSendMessage({
        senderType: 'business',
        senderName: 'Support Agent',
        content: response.data.originalName,
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: response.data.url,
        fileName: response.data.originalName
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(conversationId, 'Support Agent', 'business');
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(conversationId, 'Support Agent', 'business');
    }
    clearTimeout(typingTimeout.current);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      handleTyping();
    }
  };

  return (
    <div className="message-input-container">
      <div className="message-input">
        <button
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          📎
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx"
        />
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          disabled={uploading}
        />
        
        <button
          className="send-button"
          onClick={handleSend}
          disabled={!message.trim() || uploading}
        >
          {uploading ? '📤' : '➤'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;