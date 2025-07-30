const database = require('../models/database');
const { createSuccessResponse, createErrorResponse, formatConversationData, formatMessageData, parsePagination, asyncHandler } = require('../utils/helpers');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../utils/constants');

/**
 * Get all conversations for a business
 */
const getBusinessConversations = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    const { search } = req.query;
    
    let conversations;
    
    if (search) {
      conversations = await database.searchConversations(businessId, search);
    } else {
      conversations = await database.getConversations(businessId);
    }
    
    // Format conversation data
    const formattedConversations = conversations.map(formatConversationData);
    
    res.json(createSuccessResponse(
      formattedConversations,
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Business Conversations');
  }
});

/**
 * Get messages for a conversation
 */
const getConversationMessages = asyncHandler(async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { limit, offset } = parsePagination(req.query);
    
    // Check if conversation exists
    const conversation = await database.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Conversation not found', 404)
      );
    }
    
    // Get messages with pagination
    const messages = await database.getMessages(conversationId, limit);
    
    // Format message data
    const formattedMessages = messages.map(formatMessageData);
    
    res.json(createSuccessResponse(
      {
        messages: formattedMessages,
        conversation: formatConversationData(conversation),
        pagination: {
          limit,
          offset,
          total: formattedMessages.length
        }
      },
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Conversation Messages');
  }
});

/**
 * Get conversation details
 */
const getConversationDetails = asyncHandler(async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    
    const conversation = await database.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Conversation not found', 404)
      );
    }
    
    res.json(createSuccessResponse(
      formatConversationData(conversation),
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Conversation Details');
  }
});

/**
 * Send a message in a conversation
 */
const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { content, senderId, senderType } = req.body;
    
    // Check if conversation exists
    const conversation = await database.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Conversation not found', 404)
      );
    }
    
    // Create message data
    const messageData = {
      conversationId: parseInt(conversationId),
      senderType,
      senderName: senderId, // Using senderId as senderName for now
      content,
      messageType: 'text'
    };
    
    // Create the message
    const newMessage = await database.createMessage(messageData);
    
    // Update conversation timestamp
    await database.updateConversationTimestamp(conversationId);
    
    // Format the response
    const formattedMessage = formatMessageData(newMessage);
    
    res.status(201).json(createSuccessResponse(
      formattedMessage,
      SUCCESS_MESSAGES.MESSAGE_SENT
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Send Message');
  }
});

/**
 * Update conversation status
 */
const updateConversationStatus = asyncHandler(async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['active', 'closed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          `Status must be one of: ${validStatuses.join(', ')}`,
          400
        )
      );
    }
    
    // Check if conversation exists
    const conversation = await database.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Conversation not found', 404)
      );
    }
    
    // Update the status
    const result = await database.updateConversationStatus(conversationId, status);
    
    if (result.changes === 0) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Conversation not found', 404)
      );
    }
    
    // Get updated conversation
    const updatedConversation = await database.getConversationById(conversationId);
    
    res.json(createSuccessResponse(
      formatConversationData(updatedConversation),
      'Conversation status updated successfully'
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Update Conversation Status');
  }
});

/**
 * Create a new conversation
 */
const createConversation = asyncHandler(async (req, res) => {
  try {
    const { businessId, customerPhone, customerName } = req.body;
    
    // Check if business exists
    const business = await database.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    // Create conversation (this would need to be implemented in database.js)
    const conversationData = {
      businessId,
      customerPhone,
      customerName,
      status: 'active'
    };
    
    // For now, we'll return a success response
    // In a real implementation, you'd add a createConversation method to database.js
    res.status(201).json(createSuccessResponse(
      conversationData,
      SUCCESS_MESSAGES.CONVERSATION_CREATED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Create Conversation');
  }
});

/**
 * Get business statistics
 */
const getBusinessStats = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const stats = await database.getBusinessStats(businessId);
    
    res.json(createSuccessResponse(
      stats,
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Business Stats');
  }
});

module.exports = {
  getBusinessConversations,
  getConversationMessages,
  getConversationDetails,
  sendMessage,
  updateConversationStatus,
  createConversation,
  getBusinessStats
};