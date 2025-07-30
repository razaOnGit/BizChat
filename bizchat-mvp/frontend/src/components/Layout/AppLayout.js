import React, { useState } from 'react';
import ConversationSidebar from '../Conversations/ConversationSidebar';
import ChatArea from '../Chat/ChatArea';
import CustomerPanel from '../Customer/CustomerPanel';
import ErrorBoundary from '../ErrorBoundary';
import { useSocket } from '../../hooks/useSocket';
import './AppLayout.css';

const AppLayout = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const businessId = 'tech-store'; // Demo business ID
  
  useSocket(businessId);

  return (
    <div className="app-layout">
      <div className="app-header">
        <div className="business-info">
          <h2>Tech Store Support</h2>
          <span className="status online">● Online</span>
        </div>
      </div>
      
      <div className="app-body">
        <ErrorBoundary>
          <ConversationSidebar
            businessId={businessId}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <ChatArea
            conversation={selectedConversation}
          />
        </ErrorBoundary>
        
        {selectedConversation && (
          <ErrorBoundary>
            <CustomerPanel
              conversation={selectedConversation}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default AppLayout;