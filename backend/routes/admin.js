const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Business = require('../models/Business');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Admin Authentication Middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid admin token' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get Admin Profile
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get All Businesses
router.get('/businesses', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, plan } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Plan filter
    if (plan && plan !== 'all') {
      query['subscription.plan'] = plan;
    }
    
    const skip = (page - 1) * limit;
    const businesses = await Business.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Business.countDocuments(query);
    
    res.json({
      success: true,
      data: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get Single Business
router.get('/businesses/:id', authenticateAdmin, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('owner', 'name email phone role');
    
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }
    
    res.json({ success: true, data: business });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create New Business
router.post('/businesses', authenticateAdmin, async (req, res) => {
  try {
    const {
      businessInfo,
      ownerInfo,
      subscriptionInfo
    } = req.body;

    // Create owner user first
    const hashedPassword = await bcrypt.hash(ownerInfo.password, 10);
    const owner = new User({
      firstName: ownerInfo.firstName,
      lastName: ownerInfo.lastName,
      email: ownerInfo.email,
      mobile: ownerInfo.phone,
      password: hashedPassword,
      role: 'admin',
      hasLoginAccess: true,
      isActive: true
    });
    
    await owner.save();

    // Create business
    const business = new Business({
      name: businessInfo.name,
      businessType: businessInfo.businessType || 'salon',
      address: businessInfo.address,
      contact: businessInfo.contact,
      settings: businessInfo.settings,
      subscription: {
        plan: subscriptionInfo.plan || 'basic',
        status: 'active',
        startDate: new Date(),
        maxUsers: subscriptionInfo.maxUsers || 5,
        maxBranches: subscriptionInfo.maxBranches || 1,
        features: subscriptionInfo.features || []
      },
      owner: owner._id,
      status: 'active'
    });

    await business.save();

    // Update owner with business reference
    owner.branchId = business._id;
    await owner.save();

    res.status(201).json({
      success: true,
      data: {
        business,
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          password: ownerInfo.password // Return plain password for admin
        }
      },
      message: 'Business created successfully'
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update Business
router.put('/businesses/:id', authenticateAdmin, async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { $set: req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    res.json({
      success: true,
      data: business,
      message: 'Business updated successfully'
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Toggle Business Status
router.patch('/businesses/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    res.json({
      success: true,
      data: business,
      message: `Business ${status} successfully`
    });
  } catch (error) {
    console.error('Toggle business status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get Business Users
router.get('/businesses/:id/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({ branchId: req.params.id })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get business users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Dashboard Statistics
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      recentBusinesses
    ] = await Promise.all([
      Business.countDocuments(),
      Business.countDocuments({ status: 'active' }),
      User.countDocuments(),
      Business.find().populate('owner', 'name email').sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      success: true,
      data: {
        totalBusinesses,
        activeBusinesses,
        totalUsers,
        recentBusinesses
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
