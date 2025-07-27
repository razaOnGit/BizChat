import React from 'react';
import './CustomerPanel.css';

const CustomerPanel = ({ conversation }) => {
  return (
    <div className="customer-panel">
      <div className="panel-header">
        <h3>Customer Information</h3>
      </div>
      
      <div className="customer-details">
        <div className="detail-group">
          <label>Name</label>
          <span>{conversation.customer_name}</span>
        </div>
        
        <div className="detail-group">
          <label>Phone</label>
          <span>{conversation.customer_phone}</span>
        </div>
        
        <div className="detail-group">
          <label>Status</label>
          <span className={`status ${conversation.status}`}>
            {conversation.status}
          </span>
        </div>
        
        <div className="detail-group">
          <label>Created</label>
          <span>{new Date(conversation.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="quick-actions">
        <h4>Quick Actions</h4>
        <button className="action-btn">Mark as Resolved</button>
        <button className="action-btn">Transfer to Team</button>
        <button className="action-btn">Add Note</button>
      </div>
    </div>
  );
};

export default CustomerPanel;