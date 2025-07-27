const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { validateMessage, validateConversationId, validateBusinessId, validatePagination } = require('../middleware/validation');

// Get all conversations for a business
router.get('/business/:businessId', 
  validateBusinessId,
  conversationController.getBusinessConversations
);

// Get messages for a conversation
router.get('/:id/messages', 
  validateConversationId,
  validatePagination,
  conversationController.getConversationMessages
);

// Get conversation details
router.get('/:id',
  validateConversationId,
  conversationController.getConversationDetails
);

// Send a message
router.post('/:id/messages', 
  validateConversationId,
  validateMessage,
  conversationController.sendMessage
);

// Update conversation status
router.patch('/:id/status',
  validateConversationId,
  conversationController.updateConversationStatus
);

module.exports = router;