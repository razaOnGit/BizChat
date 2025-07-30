module.exports = {
  // Socket Events
  SOCKET_EVENTS: {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    
    // Room events
    JOIN_BUSINESS: 'join_business',
    JOIN_CONVERSATION: 'join_conversation',
    LEAVE_CONVERSATION: 'leave_conversation',
    
    // Message events
    NEW_MESSAGE: 'new_message',
    MESSAGE_SENT: 'message_sent',
    MESSAGE_DELIVERED: 'message_delivered',
    MESSAGE_READ: 'message_read',
    MESSAGE_STATUS_UPDATE: 'message_status_update',
    
    // Typing events
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    USER_TYPING: 'user_typing',
    USER_STOP_TYPING: 'user_stop_typing',
    
    // User events
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    
    // Error events
    ERROR: 'error',
    CONNECT_ERROR: 'connect_error'
  },
  
  // Timeouts
  TYPING_TIMEOUT: 3000, // 3 seconds
  CONNECTION_TIMEOUT: 5000, // 5 seconds
  RECONNECTION_DELAY: 1000, // 1 second
  
  // File Upload Constants
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    UPLOAD_PATH: 'uploads/',
    IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  },
  
  // Message Types
  MESSAGE_TYPES: {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    SYSTEM: 'system'
  },
  
  // Message Status
  MESSAGE_STATUS: {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed'
  },
  
  // User Roles
  USER_ROLES: {
    CUSTOMER: 'customer',
    BUSINESS: 'business',
    ADMIN: 'admin'
  },
  
  // Conversation Status
  CONVERSATION_STATUS: {
    ACTIVE: 'active',
    CLOSED: 'closed',
    ARCHIVED: 'archived'
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    INVALID_INPUT: 'Invalid input provided',
    UNAUTHORIZED: 'Unauthorized access',
    NOT_FOUND: 'Resource not found',
    SERVER_ERROR: 'Internal server error',
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type',
    UPLOAD_FAILED: 'File upload failed',
    DATABASE_ERROR: 'Database operation failed',
    VALIDATION_ERROR: 'Validation failed'
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    MESSAGE_SENT: 'Message sent successfully',
    FILE_UPLOADED: 'File uploaded successfully',
    CONVERSATION_CREATED: 'Conversation created successfully',
    USER_JOINED: 'User joined successfully',
    DATA_RETRIEVED: 'Data retrieved successfully'
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
    MESSAGE: 'Too many requests from this IP, please try again later'
  }
};