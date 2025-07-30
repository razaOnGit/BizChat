const { v4: uuidv4 } = require('uuid');

/**
 * Create a standardized success response
 * @param {*} data - The data to return
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted success response
 */
const createSuccessResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId: uuidv4()
  };
};

/**
 * Create a standardized error response
 * @param {string} error - Error type
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Object} Formatted error response
 */
const createErrorResponse = (error = 'Error', message = 'An error occurred', statusCode = 500, details = null) => {
  return {
    success: false,
    statusCode,
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId: uuidv4()
  };
};

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
const validateRequiredFields = (body, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Generate a unique filename for uploads
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if a file type is an image
 * @param {string} mimeType - File MIME type
 * @returns {boolean} True if file is an image
 */
const isImageFile = (mimeType) => {
  return mimeType && mimeType.startsWith('image/');
};

/**
 * Parse pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} Parsed pagination parameters
 */
const parsePagination = (query) => {
  const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 items per page
  const offset = parseInt(query.offset) || 0;
  const page = Math.floor(offset / limit) + 1;
  
  return { limit, offset, page };
};

/**
 * Format conversation data for response
 * @param {Object} conversation - Raw conversation data
 * @returns {Object} Formatted conversation data
 */
const formatConversationData = (conversation) => {
  if (!conversation) return null;
  
  return {
    id: conversation.id,
    businessId: conversation.business_id,
    customerPhone: conversation.customer_phone,
    customerName: conversation.customer_name,
    status: conversation.status,
    lastMessage: conversation.last_message,
    lastMessageTime: conversation.last_message_time,
    unreadCount: conversation.unread_count || 0,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at
  };
};

/**
 * Format message data for response
 * @param {Object} message - Raw message data
 * @returns {Object} Formatted message data
 */
const formatMessageData = (message) => {
  if (!message) return null;
  
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    senderType: message.sender_type,
    content: message.content,
    messageType: message.message_type,
    fileName: message.file_name,
    fileUrl: message.file_url,
    fileSize: message.file_size,
    status: message.status,
    timestamp: message.timestamp,
    createdAt: message.created_at
  };
};

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information
 */
const logError = (error, context = 'Unknown', additionalInfo = {}) => {
  console.error(`[${new Date().toISOString()}] ERROR in ${context}:`, {
    message: error.message,
    stack: error.stack,
    ...additionalInfo
  });
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} data - Additional data
 */
const logInfo = (message, data = {}) => {
  console.log(`[${new Date().toISOString()}] INFO: ${message}`, data);
};

/**
 * Async wrapper for better error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Check if string is valid phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Check if string is valid email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  validateRequiredFields,
  sanitizeInput,
  generateUniqueFilename,
  formatFileSize,
  isImageFile,
  parsePagination,
  formatConversationData,
  formatMessageData,
  logError,
  logInfo,
  asyncHandler,
  generateRandomString,
  isValidPhoneNumber,
  isValidEmail
};