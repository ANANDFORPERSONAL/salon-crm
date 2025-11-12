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
      // First try to find user in main database
      const mainConnection = await databaseManager.getMainConnection();
      const User = mainConnection.model('User', require('../models/User').schema);
      
      let user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('🔍 User not found in main database, checking if it\'s a staff user');
        
        let staffUser = null;
        let businessId = decoded.branchId || null;
        
        // If branchId is in token, directly check that business database
        if (businessId) {
          try {
            const businessDb = await databaseManager.getConnection(businessId, mainConnection);
            const Staff = businessDb.model('Staff', require('../models/Staff').schema);
            staffUser = await Staff.findById(decoded.id).select('-password');
            if (staffUser) {
              console.log('🔍 Staff user found in business database (from token branchId):', businessId);
            }
          } catch (error) {
            console.log('🔍 Error checking business database with branchId from token:', error.message);
          }
        }
        
        // If not found and no branchId in token, check all business databases
        if (!staffUser && !businessId) {
          const Business = mainConnection.model('Business', require('../models/Business').schema);
          const businesses = await Business.find({}).lean();
          
          for (const business of businesses) {
            try {
              const businessDb = await databaseManager.getConnection(business.code || business._id, mainConnection);
              const Staff = businessDb.model('Staff', require('../models/Staff').schema);
              
              const staff = await Staff.findById(decoded.id).select('-password');
              if (staff) {
                staffUser = staff;
                businessId = business._id;
                console.log('🔍 Staff user found in business database:', business.name, business._id);
                break;
              }
            } catch (error) {
              console.log('🔍 Error checking business database:', business.name, error.message);
              // Continue to next business
            }
          }
        }
        
        if (!staffUser) {
          console.log('🔍 User not found in any database for ID:', decoded.id);
          return res.status(401).json({ success: false, error: 'User not found' });
        }
        
        // Convert staff user to user format
        user = {
          _id: staffUser._id,
          firstName: staffUser.name?.split(' ')[0] || '',
          lastName: staffUser.name?.split(' ').slice(1).join(' ') || '',
          email: staffUser.email,
          mobile: staffUser.phone,
          role: staffUser.role,
          branchId: businessId || staffUser.branchId,
          hasLoginAccess: staffUser.hasLoginAccess,
          allowAppointmentScheduling: staffUser.allowAppointmentScheduling,
          isActive: staffUser.isActive,
          specialties: staffUser.specialties,
          hourlyRate: staffUser.hourlyRate,
          commissionRate: staffUser.commissionRate,
          notes: staffUser.notes,
          commissionProfileIds: staffUser.commissionProfileIds,
          createdAt: staffUser.createdAt,
          updatedAt: staffUser.updatedAt
        };
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
