import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ typing }) => {
  if (!typing) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-bubble">
        <span className="typing-text">{typing.senderName} is typing</span>
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;