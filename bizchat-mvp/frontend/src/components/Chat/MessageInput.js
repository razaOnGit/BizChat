import React, { useState, useRef, useEffect, useCallback } from 'react';
import { uploadAPI } from '../../services/api';
import socketService from '../../services/socket';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, conversationId }) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Properly use useRef for timeout
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const isComponentMountedRef = useRef(true);

  // Cleanup function to clear typing timeout
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Handle component unmount cleanup
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      clearTypingTimeout();
      
      // Stop typing if component unmounts while typing
      if (isTyping) {
        socketService.stopTyping(conversationId, 'Support Agent', 'business');
      }
    };
  }, [clearTypingTimeout, isTyping, conversationId]);

  // Clear typing when conversation changes
  useEffect(() => {
    clearTypingTimeout();
    setIsTyping(false);
    setMessage('');
    setUploadError(null);
  }, [conversationId, clearTypingTimeout]);

  const handleStopTyping = useCallback(() => {
    if (isTyping && conversationId) {
      setIsTyping(false);
      socketService.stopTyping(conversationId, 'Support Agent', 'business');
    }
    clearTypingTimeout();
  }, [isTyping, conversationId, clearTypingTimeout]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || uploading) return;

    try {
      await onSendMessage({
        senderType: 'business',
        senderId: 'Support Agent',
        content: message.trim(),
        messageType: 'text'
      });
      
      // Only clear if component is still mounted
      if (isComponentMountedRef.current) {
        setMessage('');
        handleStopTyping();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add error state here for user feedback
    }
  }, [message, uploading, onSendMessage, handleStopTyping]);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      formData.append('senderId', 'Support Agent');
      formData.append('senderType', 'business');
      
      const response = await uploadAPI.uploadFile(formData);
      
      // Only proceed if component is still mounted
      if (isComponentMountedRef.current) {
        await onSendMessage({
          senderType: 'business',
          senderId: 'Support Agent',
          content: `Sent a ${file.type.startsWith('image/') ? 'image' : 'file'}: ${file.name}`,
          messageType: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: response.data.file?.url || response.data.url,
          fileName: file.name
        });
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      if (isComponentMountedRef.current) {
        setUploadError(error.message || 'Failed to upload file');
      }
    } finally {
      if (isComponentMountedRef.current) {
        setUploading(false);
        // Clear file input
        if (event.target) {
          event.target.value = '';
        }
      }
    }
  }, [conversationId, onSendMessage]);

  const handleTyping = useCallback(() => {
    if (!conversationId) return;

    // Start typing if not already typing
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(conversationId, 'Support Agent', 'business');
    }

    // Clear existing timeout
    clearTypingTimeout();
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isComponentMountedRef.current) {
        handleStopTyping();
      }
    }, 3000); // 3 seconds timeout
  }, [conversationId, isTyping, clearTypingTimeout, handleStopTyping]);

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key !== 'Enter') {
      // Only trigger typing for non-Enter keys
      handleTyping();
    }
  }, [handleSend, handleTyping]);

  const handleKeyUp = useCallback((e) => {
    // Stop typing when user stops typing for a moment
    if (e.key === 'Backspace' || e.key === 'Delete') {
      handleTyping();
    }
  }, [handleTyping]);

  const handleBlur = useCallback(() => {
    // Stop typing when input loses focus
    handleStopTyping();
  }, [handleStopTyping]);

  return (
    <div className="message-input-container">
      {uploadError && (
        <div className="upload-error">
          {uploadError}
          <button onClick={() => setUploadError(null)}>×</button>
        </div>
      )}
      
      <div className="message-input">
        <button
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !conversationId}
          title="Attach file"
        >
          {uploading ? '⏳' : '📎'}
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onKeyUp={handleKeyUp}
          onBlur={handleBlur}
          placeholder={conversationId ? "Type a message..." : "Select a conversation to start messaging"}
          rows={1}
          disabled={uploading || !conversationId}
          style={{ resize: 'none' }}
        />
        
        <button
          className="send-button"
          onClick={handleSend}
          disabled={!message.trim() || uploading || !conversationId}
          title="Send message"
        >
          {uploading ? '📤' : '➤'}
        </button>
      </div>
      
      {isTyping && (
        <div className="typing-indicator">
          Typing...
        </div>
      )}
    </div>
  );
};

export default MessageInput;