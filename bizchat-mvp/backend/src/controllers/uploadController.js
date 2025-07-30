const fs = require('fs').promises;
const path = require('path');
const database = require('../models/database');
const { createSuccessResponse, createErrorResponse, generateUniqueFilename, formatFileSize, isImageFile, asyncHandler } = require('../utils/helpers');
const { handleFileUploadError, handleDatabaseError } = require('../middleware/errorHandler');
const { FILE_UPLOAD, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const config = require('../config/config');

/**
 * Validate file type and size
 */
const validateFile = (req, file, cb) => {
  // Check file type
  if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    const error = new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  cb(null, true);
};

/**
 * Upload a file
 */
const uploadFile = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'No file uploaded', 400)
      );
    }
    
    const { conversationId, senderId, senderType } = req.body;
    const file = req.file;
    
    // Check if conversation exists
    const conversation = await database.getConversationById(conversationId);
    if (!conversation) {
      // Clean up uploaded file if conversation doesn't exist
      await fs.unlink(file.path).catch(() => {});
      
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Conversation not found', 404)
      );
    }
    
    // Create file URL
    const fileUrl = `/uploads/${file.filename}`;
    
    // Determine message type based on file type
    const messageType = isImageFile(file.mimetype) ? 'image' : 'file';
    
    // Create message with file attachment
    const messageData = {
      conversationId: parseInt(conversationId),
      senderType,
      senderName: senderId,
      content: `Sent a ${messageType}`,
      messageType,
      fileUrl,
      fileName: file.originalname
    };
    
    const newMessage = await database.createMessage(messageData);
    
    // Update conversation timestamp
    await database.updateConversationTimestamp(conversationId);
    
    // Prepare response data
    const responseData = {
      message: newMessage,
      file: {
        id: file.filename,
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        mimetype: file.mimetype,
        url: fileUrl,
        isImage: isImageFile(file.mimetype),
        uploadedAt: new Date().toISOString()
      }
    };
    
    res.status(201).json(createSuccessResponse(
      responseData,
      SUCCESS_MESSAGES.FILE_UPLOADED
    ));
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    if (error.code === 'INVALID_FILE_TYPE') {
      throw handleFileUploadError(error);
    } else {
      throw handleDatabaseError(error, 'Upload File');
    }
  }
});

/**
 * Get file information
 */
const getFileInfo = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(config.upload.uploadDir, filename);
    
    // Check if file exists
    try {
      const stats = await fs.stat(filePath);
      
      // Get file extension and determine type
      const ext = path.extname(filename).toLowerCase();
      const mimetype = getMimeTypeFromExtension(ext);
      
      const fileInfo = {
        filename,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        mimetype,
        isImage: isImageFile(mimetype),
        url: `/uploads/${filename}`,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
      
      res.json(createSuccessResponse(
        fileInfo,
        SUCCESS_MESSAGES.DATA_RETRIEVED
      ));
    } catch (fileError) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'File not found', 404)
      );
    }
  } catch (error) {
    throw error;
  }
});

/**
 * Delete a file
 */
const deleteFile = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(config.upload.uploadDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (fileError) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'File not found', 404)
      );
    }
    
    // Delete the file
    await fs.unlink(filePath);
    
    res.json(createSuccessResponse(
      { filename, deleted: true },
      'File deleted successfully'
    ));
  } catch (error) {
    throw error;
  }
});

/**
 * Get MIME type from file extension
 */
const getMimeTypeFromExtension = (ext) => {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Clean up old files (utility function)
 */
const cleanupOldFiles = asyncHandler(async (maxAge = 30 * 24 * 60 * 60 * 1000) => { // 30 days
  try {
    const uploadDir = config.upload.uploadDir;
    const files = await fs.readdir(uploadDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
});

/**
 * Get upload statistics
 */
const getUploadStats = asyncHandler(async (req, res) => {
  try {
    const uploadDir = config.upload.uploadDir;
    const files = await fs.readdir(uploadDir);
    
    let totalSize = 0;
    let fileTypes = {};
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);
      const ext = path.extname(file).toLowerCase();
      
      totalSize += stats.size;
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    }
    
    const stats = {
      totalFiles: files.length,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      fileTypes,
      uploadDir
    };
    
    res.json(createSuccessResponse(
      stats,
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw error;
  }
});

// Export the constructor property for multer fileFilter
uploadController = {
  validateFile,
  uploadFile,
  getFileInfo,
  deleteFile,
  cleanupOldFiles,
  getUploadStats
};

// Add constructor property for multer compatibility
uploadController.constructor = { validateFile };

module.exports = uploadController;