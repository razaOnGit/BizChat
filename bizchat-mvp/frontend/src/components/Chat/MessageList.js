import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import './MessageList.css';

const MessageList = ({ messages, loading, typing }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  if (loading) {
    return <div className="message-list-loading">Loading messages...</div>;
  }

  return (
    <div className="message-list">
      <div className="messages-container">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {typing && <TypingIndicator typing={typing} />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;