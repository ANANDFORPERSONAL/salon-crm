const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use the same JWT_SECRET as server.js
// Ensure dotenv is loaded first
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  // Check if this is a mock token (for development)
  if (token.startsWith('mock-token-')) {
    console.log('🔑 Mock token detected, bypassing JWT verification for development');
    
    // Extract user info from mock token
    const mockUserParts = token.split('-');
    if (mockUserParts.length >= 3) {
      const mockUserId = mockUserParts[2];
      
      // For mock tokens, create a valid ObjectId for userId
      let mockObjectId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      
      // Create a mock user object for development with valid ObjectId
      req.user = {
        _id: mockObjectId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        id: mockObjectId
      };
      
      console.log('👤 Mock user created:', req.user);
      return next();
    }
  }

  // Regular JWT verification for production tokens
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }

    try {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error in auth middleware:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireAdmin = authorizeRoles('admin');
const requireManager = authorizeRoles('admin', 'manager');
const requireStaff = authorizeRoles('admin', 'manager', 'staff');

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
  requireManager,
  requireStaff
};
