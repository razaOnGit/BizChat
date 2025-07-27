import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message }) => {
  const isBusinessMessage = message.sender_type === 'business';
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    if (message.message_type === 'image') {
      return (
        <div>
          <img 
            src={`http://localhost:5000${message.file_url}`}
            alt={message.file_name}
            className="message-image"
          />
          {message.content && <p>{message.content}</p>}
        </div>
      );
    } else if (message.message_type === 'file') {
      return (
        <div>
          <a 
            href={`http://localhost:5000${message.file_url}`}
            download={message.file_name}
            className="file-link"
          >
            📄 {message.file_name}
          </a>
          {message.content && <p>{message.content}</p>}
        </div>
      );
    } else {
      return <p>{message.content}</p>;
    }
  };

  return (
    <div className={`message-bubble ${isBusinessMessage ? 'business' : 'customer'}`}>
      <div className="message-header">
        <span className="sender-name">{message.sender_name}</span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      
      <div className="message-content">
        {renderContent()}
      </div>
      
      <div className="message-status">
        {message.status}
      </div>
    </div>
  );
};

export default MessageBubble;