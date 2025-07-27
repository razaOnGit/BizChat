import React from 'react';
import './ChatHeader.css';

const ChatHeader = ({ conversation }) => {
  return (
    <div className="chat-header">
      <div className="customer-info">
        <div className="customer-avatar">
          {conversation.customer_name.charAt(0).toUpperCase()}
        </div>
        <div className="customer-details">
          <h3>{conversation.customer_name}</h3>
          <span className="customer-phone">{conversation.customer_phone}</span>
        </div>
      </div>
      
      <div className="chat-actions">
        <button className="action-button">📞</button>
        <button className="action-button">ℹ️</button>
      </div>
    </div>
  );
};

export default ChatHeader;