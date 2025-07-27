import React from 'react';
import './ConversationItem.css';

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar">
        {conversation.customer_name.charAt(0).toUpperCase()}
      </div>
      
      <div className="conversation-content">
        <div className="conversation-header">
          <span className="customer-name">{conversation.customer_name}</span>
          <span className="timestamp">{formatTime(conversation.last_message_time)}</span>
        </div>
        
        <div className="conversation-preview">
          <span className="last-message">
            {conversation.last_message || 'No messages yet'}
          </span>
          {conversation.unread_count > 0 && (
            <span className="unread-badge">{conversation.unread_count}</span>
          )}
        </div>
        
        <div className="conversation-meta">
          <span className={`status ${conversation.status}`}>
            {conversation.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;