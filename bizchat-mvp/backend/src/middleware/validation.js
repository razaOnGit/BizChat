const { createErrorResponse, validateRequiredFields, isValidPhoneNumber } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

/**
 * Validate message creation request
 */
const validateMessage = (req, res, next) => {
  const { content, conversationId, senderId, senderType } = req.body;
  
  const validation = validateRequiredFields(req.body, ['content', 'conversationId', 'senderId', 'senderType']);
  
  if (!validation.isValid) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400,
        { missingFields: validation.missingFields }
      )
    );
  }
  
  // Validate content length
  if (content.length > 1000) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Message content cannot exceed 1000 characters',
        400
      )
    );
  }
  
  // Validate sender type
  if (!['customer', 'business'].includes(senderType)) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Sender type must be either "customer" or "business"',
        400
      )
    );
  }
  
  next();
};

/**
 * Validate conversation ID parameter
 */
const validateConversationId = (req, res, next) => {
  const { conversationId } = req.params;
  
  if (!conversationId) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Conversation ID is required',
        400
      )
    );
  }
  
  // Basic UUID format validation (if using UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(conversationId) && isNaN(conversationId)) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid conversation ID format',
        400
      )
    );
  }
  
  next();
};

/**
 * Validate business ID parameter
 */
const validateBusinessId = (req, res, next) => {
  const { businessId } = req.params;
  
  if (!businessId) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Business ID is required',
        400
      )
    );
  }
  
  // Validate business ID format (alphanumeric with hyphens)
  const businessIdRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!businessIdRegex.test(businessId)) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid business ID format',
        400
      )
    );
  }
  
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Limit must be a number between 1 and 100',
          400
        )
      );
    }
  }
  
  if (offset !== undefined) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Offset must be a non-negative number',
          400
        )
      );
    }
  }
  
  next();
};

/**
 * Validate conversation creation request
 */
const validateConversationCreation = (req, res, next) => {
  const { businessId, customerPhone, customerName } = req.body;
  
  const validation = validateRequiredFields(req.body, ['businessId', 'customerPhone', 'customerName']);
  
  if (!validation.isValid) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400,
        { missingFields: validation.missingFields }
      )
    );
  }
  
  // Validate phone number format
  if (!isValidPhoneNumber(customerPhone)) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid phone number format',
        400
      )
    );
  }
  
  // Validate customer name length
  if (customerName.length < 2 || customerName.length > 100) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Customer name must be between 2 and 100 characters',
        400
      )
    );
  }
  
  next();
};

/**
 * Validate file upload
 */
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'No file uploaded',
        400
      )
    );
  }
  
  const { conversationId, senderId, senderType } = req.body;
  
  const validation = validateRequiredFields(req.body, ['conversationId', 'senderId', 'senderType']);
  
  if (!validation.isValid) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400,
        { missingFields: validation.missingFields }
      )
    );
  }
  
  // Validate sender type
  if (!['customer', 'business'].includes(senderType)) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Sender type must be either "customer" or "business"',
        400
      )
    );
  }
  
  next();
};

/**
 * Validate search parameters
 */
const validateSearch = (req, res, next) => {
  const { query } = req.query;
  
  if (query && query.length < 2) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Search query must be at least 2 characters long',
        400
      )
    );
  }
  
  next();
};

/**
 * Validate message status update
 */
const validateMessageStatus = (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Status is required',
        400
      )
    );
  }
  
  const validStatuses = ['sent', 'delivered', 'read', 'failed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        `Status must be one of: ${validStatuses.join(', ')}`,
        400
      )
    );
  }
  
  next();
};

module.exports = {
  validateMessage,
  validateConversationId,
  validateBusinessId,
  validatePagination,
  validateConversationCreation,
  validateFileUpload,
  validateSearch,
  validateMessageStatus
};