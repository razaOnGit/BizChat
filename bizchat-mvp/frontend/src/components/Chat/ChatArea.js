import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useMessages } from '../../hooks/useMessages';
import './ChatArea.css';

const ChatArea = ({ conversation }) => {
  // Always call hooks at the top level
  const { messages, loading, typing, sendMessage } = useMessages(conversation?.id);

  if (!conversation) {
    return (
      <div className="chat-area-empty">
        <div className="empty-state">
          <h3>Select a conversation to start chatting</h3>
          <p>Choose a customer from the sidebar to view their messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <ChatHeader conversation={conversation} />
      
      <MessageList 
        messages={messages}
        loading={loading}
        typing={typing}
      />
      
      <MessageInput 
        onSendMessage={sendMessage}
        conversationId={conversation.id}
      />
    </div>
  );
};

export default ChatArea;