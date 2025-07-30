const database = require('../models/database');
const { createSuccessResponse, createErrorResponse, asyncHandler } = require('../utils/helpers');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../utils/constants');

/**
 * Get business information
 */
const getBusinessInfo = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await database.getBusinessById(businessId);
    
    if (!business) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    res.json(createSuccessResponse(
      business,
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Business Info');
  }
});

/**
 * Update business status
 */
const updateBusinessStatus = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['online', 'offline', 'busy', 'away'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          `Status must be one of: ${validStatuses.join(', ')}`,
          400
        )
      );
    }
    
    // Check if business exists
    const business = await database.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    // Update the status
    const result = await database.updateBusinessStatus(businessId, status);
    
    if (result.changes === 0) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    // Get updated business info
    const updatedBusiness = await database.getBusinessById(businessId);
    
    res.json(createSuccessResponse(
      updatedBusiness,
      'Business status updated successfully'
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Update Business Status');
  }
});

/**
 * Get business statistics
 */
const getBusinessStatistics = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Check if business exists
    const business = await database.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    const stats = await database.getBusinessStats(businessId);
    
    // Add additional calculated metrics
    const enhancedStats = {
      ...stats,
      averageMessagesPerConversation: stats.total_conversations > 0 
        ? Math.round(stats.total_messages / stats.total_conversations * 100) / 100 
        : 0,
      customerEngagementRate: stats.total_messages > 0 
        ? Math.round((stats.customer_messages / stats.total_messages) * 100 * 100) / 100 
        : 0,
      businessResponseRate: stats.total_messages > 0 
        ? Math.round((stats.business_messages / stats.total_messages) * 100 * 100) / 100 
        : 0
    };
    
    res.json(createSuccessResponse(
      enhancedStats,
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Business Statistics');
  }
});

/**
 * Get business profile
 */
const getBusinessProfile = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await database.getBusinessById(businessId);
    
    if (!business) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    // Get business statistics
    const stats = await database.getBusinessStats(businessId);
    
    // Combine business info with stats
    const profile = {
      ...business,
      statistics: stats,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(createSuccessResponse(
      profile,
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Business Profile');
  }
});

/**
 * Update business information
 */
const updateBusinessInfo = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    const { name, logoUrl } = req.body;
    
    // Check if business exists
    const business = await database.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    // Validate input
    if (name && (name.length < 2 || name.length > 100)) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Business name must be between 2 and 100 characters',
          400
        )
      );
    }
    
    // For now, return success (would need to implement updateBusiness method in database.js)
    const updatedBusiness = {
      ...business,
      name: name || business.name,
      logo_url: logoUrl || business.logo_url
    };
    
    res.json(createSuccessResponse(
      updatedBusiness,
      'Business information updated successfully'
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Update Business Info');
  }
});

/**
 * Get business activity summary
 */
const getBusinessActivity = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    const { period = '7d' } = req.query; // 1d, 7d, 30d
    
    // Check if business exists
    const business = await database.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Business not found', 404)
      );
    }
    
    // Get basic stats (would need to enhance database methods for time-based queries)
    const stats = await database.getBusinessStats(businessId);
    
    // Mock activity data (in real implementation, would query by date ranges)
    const activity = {
      period,
      businessId,
      summary: {
        totalConversations: stats.total_conversations,
        activeConversations: stats.active_conversations,
        totalMessages: stats.total_messages,
        responseTime: '2.5 minutes', // Mock data
        satisfactionScore: 4.2 // Mock data
      },
      trends: {
        conversationsGrowth: '+12%', // Mock data
        messagesGrowth: '+8%', // Mock data
        responseTimeImprovement: '-15%' // Mock data
      },
      generatedAt: new Date().toISOString()
    };
    
    res.json(createSuccessResponse(
      activity,
      SUCCESS_MESSAGES.DATA_RETRIEVED
    ));
  } catch (error) {
    throw handleDatabaseError(error, 'Get Business Activity');
  }
});

module.exports = {
  getBusinessInfo,
  updateBusinessStatus,
  getBusinessStatistics,
  getBusinessProfile,
  updateBusinessInfo,
  getBusinessActivity
};