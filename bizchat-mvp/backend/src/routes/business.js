const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { validateBusinessId } = require('../middleware/validation');

// Get business information
router.get('/:businessId', 
  validateBusinessId,
  businessController.getBusinessInfo
);

// Update business status
router.patch('/:businessId/status',
  validateBusinessId,
  businessController.updateBusinessStatus
);

// Get business statistics
router.get('/:businessId/stats',
  validateBusinessId,
  businessController.getBusinessStatistics
);

// Get business profile (includes info + stats)
router.get('/:businessId/profile',
  validateBusinessId,
  businessController.getBusinessProfile
);

// Update business information
router.patch('/:businessId',
  validateBusinessId,
  businessController.updateBusinessInfo
);

// Get business activity summary
router.get('/:businessId/activity',
  validateBusinessId,
  businessController.getBusinessActivity
);

module.exports = router;