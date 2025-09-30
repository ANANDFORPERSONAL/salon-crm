const jwt = require('jsonwebtoken');
const databaseManager = require('../config/database-manager');

// Use the same JWT_SECRET as server.js
// Ensure dotenv is loaded first
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const authenticateToken = (req, res, next) => {
  console.log('🔍 AuthenticateToken middleware called');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('🔍 No token found in request');
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  // Reject mock tokens - only allow real JWT tokens
  if (token.startsWith('mock-token-')) {
    console.log('🔑 Mock token detected, rejecting for security');
    return res.status(401).json({ success: false, error: 'Invalid token format' });
  }

  // Regular JWT verification for production tokens
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('🔍 JWT verification error:', err);
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }

    console.log('🔍 JWT decoded successfully:', decoded);

    try {
      // Get main database connection
      const mainConnection = await databaseManager.getMainConnection();
      const User = mainConnection.model('User', require('../models/User').schema);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        console.log('🔍 User not found in main database for ID:', decoded.id);
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      console.log('🔍 Auth middleware user:', {
        id: user._id,
        email: user.email,
        branchId: user.branchId,
        role: user.role
      });

      // Ensure the user object has all required fields
      req.user = {
        _id: user._id,
        id: user._id,
        email: user.email,
        branchId: user.branchId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        avatar: user.avatar,
        hasLoginAccess: user.hasLoginAccess,
        allowAppointmentScheduling: user.allowAppointmentScheduling,
        isActive: user.isActive,
        permissions: user.permissions,
        specialties: user.specialties,
        hourlyRate: user.hourlyRate,
        commissionRate: user.commissionRate,
        notes: user.notes,
        commissionProfileIds: user.commissionProfileIds,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      console.log('🔍 Auth middleware req.user set:', {
        id: req.user.id,
        email: req.user.email,
        branchId: req.user.branchId,
        role: req.user.role
      });
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
