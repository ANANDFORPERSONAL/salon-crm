const databaseManager = require('../config/database-manager');
const modelFactory = require('../models/model-factory');

/**
 * Middleware to set up business-specific database models
 * This should be used after authentication middleware
 */
const setupBusinessDatabase = async (req, res, next) => {
  try {
    // Get business ID from user
    const businessId = req.user?.branchId;
    
    console.log('🔍 Business DB Middleware Debug:', {
      user: req.user ? {
        id: req.user._id,
        email: req.user.email,
        branchId: req.user.branchId,
        role: req.user.role
      } : 'No user',
      businessId: businessId
    });
    
    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID not found in user data'
      });
    }

    // Get business-specific database connection
    const businessConnection = await databaseManager.getConnection(businessId);
    
    // Create business-specific models
    const businessModels = modelFactory.createBusinessModels(businessConnection);
    
    // Attach models to request object
    req.businessModels = businessModels;
    req.businessConnection = businessConnection;
    
    next();
  } catch (error) {
    console.error('Error setting up business database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to business database'
    });
  }
};

/**
 * Middleware to set up main database models
 * This should be used for admin operations
 */
const setupMainDatabase = async (req, res, next) => {
  try {
    // Get main database connection
    const mainConnection = await databaseManager.getMainConnection();
    
    // Create main database models
    const mainModels = modelFactory.createMainModels(mainConnection);
    
    // Attach models to request object
    req.mainModels = mainModels;
    req.mainConnection = mainConnection;
    
    next();
  } catch (error) {
    console.error('Error setting up main database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to main database'
    });
  }
};

module.exports = {
  setupBusinessDatabase,
  setupMainDatabase
};
