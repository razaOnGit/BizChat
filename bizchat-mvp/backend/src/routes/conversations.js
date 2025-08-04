const express = require('express');
const router = express.Router();
const database = require('../models/database');

// Get all conversations for a business
router.get('/business/:businessId', async (req, res) => {
  try {
    const conversations = await database.getConversations(req.params.businessId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await database.getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/:id/messages', async (req, res) => {
  try {
    console.log('=== MESSAGE CREATION DEBUG ===');
    console.log('Received message data:', JSON.stringify(req.body, null, 2));
    console.log('Conversation ID:', req.params.id);
    console.log('Request headers:', req.headers);
    
    const { senderType, senderName, senderId, content, messageType, fileUrl, fileName } = req.body;
    
    // Validate required fields
    if (!senderType) {
      console.error('Missing senderType');
      return res.status(400).json({ error: 'senderType is required' });
    }
    
    if (!senderId && !senderName) {
      console.error('Missing senderId and senderName');
      return res.status(400).json({ error: 'senderId or senderName is required' });
    }
    
    if (!content && !fileUrl) {
      console.error('Missing content and fileUrl');
      return res.status(400).json({ error: 'content or fileUrl is required' });
    }
    
    console.log('Creating message with data:', {
      conversationId: req.params.id,
      senderType,
      senderName,
      senderId,
      content,
      messageType,
      fileUrl,
      fileName
    });
    
    const message = await database.createMessage({
      conversationId: req.params.id,
      senderType,
      senderName,
      senderId,
      content,
      messageType,
      fileUrl,
      fileName
    });
    
    console.log('✅ Message created successfully:', message);
    
    // Update conversation's last message
    try {
      await database.updateConversationLastMessage(
        req.params.id, 
        content || `Sent a ${messageType || 'file'}`, 
        message.timestamp
      );
      console.log('✅ Conversation last message updated');
    } catch (updateError) {
      console.error('❌ Error updating conversation last message:', updateError);
      // Don't fail the request if this fails
    }
    
    // Emit to socket.io
    if (req.io) {
      req.io.to(`conversation_${req.params.id}`).emit('new_message', message);
      console.log('✅ Socket event emitted');
    } else {
      console.log('⚠️ No socket.io instance available');
    }
    
    console.log('=== MESSAGE CREATION SUCCESS ===');
    res.json(message);
  } catch (error) {
    console.error('=== MESSAGE CREATION ERROR ===');
    console.error('Error in POST /messages:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: error.message,
      details: error.name,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;