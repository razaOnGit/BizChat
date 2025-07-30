import React, { useState } from 'react';
import { useConversations } from '../../hooks/useConversations';
import ConversationItem from './ConversationItem';
import './ConversationSidebar.css';

const ConversationSidebar = ({ businessId, selectedConversation, onSelectConversation }) => {
  const { conversations, loading, error } = useConversations(businessId);
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) return <div className="sidebar-loading">Loading conversations...</div>;
  if (error) return <div className="sidebar-error">Error: {error}</div>;

  // Filter conversations based on search term
  const filteredConversations = (conversations || []).filter(conversation =>
    conversation?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="conversation-sidebar">
      <div className="sidebar-header">
        <h3>Conversations</h3>
        <div className="conversation-stats">
          {filteredConversations.length} active
        </div>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="conversation-list">
        {filteredConversations.map(conversation => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedConversation?.id === conversation.id}
            onClick={() => onSelectConversation(conversation)}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationSidebar;