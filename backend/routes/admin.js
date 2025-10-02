const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { setupMainDatabase } = require('../middleware/business-db');
const { authenticateToken } = require('../middleware/auth');
const Business = require('../models/Business').model;
const User = require('../models/User').model;
const databaseManager = require('../config/database-manager');
const { modelFactory } = require('../models/model-factory');

const router = express.Router();

// Admin Authentication Middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    
    // Get main database connection
    const databaseManager = require('../config/database-manager');
    const mainConnection = await databaseManager.getMainConnection();
    const Admin = mainConnection.model('Admin', require('../models/Admin').schema);
    
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid admin token' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Admin Login
router.post('/login', setupMainDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;
    const { Admin } = req.mainModels;

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
router.get('/profile', setupMainDatabase, authenticateAdmin, async (req, res) => {
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
router.get('/businesses', setupMainDatabase, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, plan } = req.query;
    const { Business } = req.mainModels;
    
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
      .populate('owner', 'firstName lastName email mobile lastLoginAt')
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
    // Setup main database connection
    await new Promise((resolve, reject) => {
      setupMainDatabase(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const { Business } = req.mainModels;
    const business = await Business.findById(req.params.id)
      .populate('owner', 'firstName lastName email mobile role');
    
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }
    
    // Transform the business data to match frontend expectations
    const businessData = {
      _id: business._id,
      name: business.name,
      code: business.code,
      businessType: business.businessType,
      status: business.status,
      address: business.address,
      contact: business.contact,
      subscription: business.subscription,
      owner: business.owner ? {
        _id: business.owner._id,
        name: `${business.owner.firstName || ''} ${business.owner.lastName || ''}`.trim() || 'Business Owner',
        email: business.owner.email,
        phone: business.owner.mobile
      } : null,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      isOnboarded: business.isOnboarded,
      onboardingStep: business.onboardingStep
    };
    
    res.json({ success: true, data: businessData });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create New Business
router.post('/businesses', setupMainDatabase, authenticateAdmin, async (req, res) => {
  try {
    
    const {
      businessInfo,
      ownerInfo
    } = req.body;

    // Handle both data structures - ownerInfo as separate field or nested under businessInfo.owner
    const ownerData = ownerInfo || businessInfo?.owner;
    
    if (!ownerData) {
      return res.status(400).json({ success: false, error: 'Owner information is required' });
    }
    
    if (!ownerData.password) {
      return res.status(400).json({ success: false, error: 'Owner password is required' });
    }

    // Create owner user first (using main database models)
    const hashedPassword = await bcrypt.hash(ownerData.password, 10);
    const owner = new req.mainModels.User({
      firstName: ownerData.firstName,
      lastName: ownerData.lastName,
      email: ownerData.email,
      mobile: ownerData.phone,
      password: hashedPassword,
      role: 'admin',
      hasLoginAccess: true,
      allowAppointmentScheduling: true,
      isActive: true,
      permissions: [
        // Business admin gets all permissions for their business
        { module: 'dashboard', feature: 'view', enabled: true },
        { module: 'dashboard', feature: 'edit', enabled: true },
        { module: 'appointments', feature: 'view', enabled: true },
        { module: 'appointments', feature: 'create', enabled: true },
        { module: 'appointments', feature: 'edit', enabled: true },
        { module: 'appointments', feature: 'delete', enabled: true },
        { module: 'clients', feature: 'view', enabled: true },
        { module: 'clients', feature: 'create', enabled: true },
        { module: 'clients', feature: 'edit', enabled: true },
        { module: 'clients', feature: 'delete', enabled: true },
        { module: 'services', feature: 'view', enabled: true },
        { module: 'services', feature: 'create', enabled: true },
        { module: 'services', feature: 'edit', enabled: true },
        { module: 'services', feature: 'delete', enabled: true },
        { module: 'products', feature: 'view', enabled: true },
        { module: 'products', feature: 'create', enabled: true },
        { module: 'products', feature: 'edit', enabled: true },
        { module: 'products', feature: 'delete', enabled: true },
        { module: 'staff', feature: 'view', enabled: true },
        { module: 'staff', feature: 'create', enabled: true },
        { module: 'staff', feature: 'edit', enabled: true },
        { module: 'staff', feature: 'delete', enabled: true },
        { module: 'sales', feature: 'view', enabled: true },
        { module: 'sales', feature: 'create', enabled: true },
        { module: 'sales', feature: 'edit', enabled: true },
        { module: 'sales', feature: 'delete', enabled: true },
        { module: 'reports', feature: 'view', enabled: true },
        { module: 'settings', feature: 'view', enabled: true },
        { module: 'settings', feature: 'edit', enabled: true },
      ]
    });
    
    await owner.save();

    // Generate unique business code
    let businessCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const count = await req.mainModels.Business.countDocuments();
      businessCode = `BIZ${String(count + 1).padStart(4, '0')}`;
      
      // Check if this code already exists
      const existing = await req.mainModels.Business.findOne({ code: businessCode });
      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }
    
    // Fallback to timestamp-based code if count-based fails
    if (!isUnique) {
      businessCode = `BIZ${Date.now().toString().slice(-4)}`;
    }

    // Create business (using main database models)
    const business = new req.mainModels.Business({
      code: businessCode,
      name: businessInfo.name || businessInfo.businessName,
      businessType: (businessInfo.businessType || 'salon').toLowerCase(),
      address: {
        street: (businessInfo.address?.street || businessInfo.location?.street) || 'Not provided',
        city: businessInfo.address?.city || businessInfo.location?.city,
        state: businessInfo.address?.state || businessInfo.location?.state,
        zipCode: businessInfo.address?.zipCode || businessInfo.location?.zipCode,
        country: businessInfo.address?.country || businessInfo.location?.country || 'India'
      },
      contact: {
        phone: businessInfo.contact?.phone || businessInfo.phone,
        email: businessInfo.contact?.email || businessInfo.email,
        website: businessInfo.contact?.website || businessInfo.website || ''
      },
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        currencySymbol: '₹',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12',
        taxRate: 18,
        gstNumber: '',
        businessLicense: '',
        operatingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '18:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: false }
        },
        appointmentSettings: {
          slotDuration: 30,
          advanceBookingDays: 30,
          bufferTime: 15,
          allowOnlineBooking: false
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          appointmentReminders: true,
          paymentConfirmations: true
        },
        branding: {
          logo: '',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          fontFamily: 'Inter'
        },
        ...businessInfo.settings // Allow frontend to override defaults if needed
      },
      owner: owner._id,
      status: 'active'
    });

    await business.save();

    // Update owner with business reference
    owner.branchId = business._id;
    await owner.save();

    // Create default business settings in the business-specific database (optional)
    try {
      // Get business-specific database connection
      const businessConnection = await databaseManager.getConnection(business._id);
      const businessModels = modelFactory.createBusinessModels(businessConnection);
      
      // Create default business settings
      const defaultSettings = new businessModels.BusinessSettings({
        name: business.name,
        email: business.contact.email,
        phone: business.contact.phone,
        website: business.contact.website || '',
        description: `${business.name} - Professional salon and spa services`,
        address: business.address.street,
        city: business.address.city,
        state: business.address.state,
        zipCode: business.address.zipCode,
        receiptPrefix: "INV",
        invoicePrefix: "INV",
        receiptNumber: 1,
        autoIncrementReceipt: true,
        currency: "INR",
        taxRate: 8.25,
        processingFee: 2.9,
        enableCurrency: true,
        enableTax: true,
        enableProcessingFees: true,
        socialMedia: `@${business.name.toLowerCase().replace(/\s+/g, '')}`
      });
      
      await defaultSettings.save();
      console.log(`✅ Default business settings created for ${business.name}`);
    } catch (settingsError) {
      console.error('Error creating default business settings:', settingsError);
      // Don't fail the business creation if settings creation fails
    }

    res.status(201).json({
      success: true,
      data: {
        business,
        owner: {
          id: owner._id,
          name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Business Owner',
          email: owner.email,
          password: ownerData.password // Return plain password for admin
        }
      },
      message: 'Business created successfully'
    });
  } catch (error) {
    console.error('Create business error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
});

// Update Business
router.put('/businesses/:id', setupMainDatabase, authenticateAdmin, async (req, res) => {
  try {
    console.log('Update business request:', req.params.id, req.body);
    const { Business } = req.mainModels;
    const { businessInfo, ownerInfo, subscriptionInfo } = req.body;
    
    // Build update object from nested structure
    const updateData = {
      updatedAt: new Date()
    };

    // Handle business info
    if (businessInfo) {
      if (businessInfo.name) updateData.name = businessInfo.name;
      if (businessInfo.businessType) updateData.businessType = businessInfo.businessType;
      if (businessInfo.address) updateData.address = businessInfo.address;
      if (businessInfo.contact) updateData.contact = businessInfo.contact;
      if (businessInfo.settings) updateData.settings = businessInfo.settings;
    }

    // Handle owner info
    if (ownerInfo) {
      const ownerUpdate = {};
      if (ownerInfo.firstName) ownerUpdate.firstName = ownerInfo.firstName;
      if (ownerInfo.lastName) ownerUpdate.lastName = ownerInfo.lastName;
      if (ownerInfo.email) ownerUpdate.email = ownerInfo.email;
      if (ownerInfo.phone) ownerUpdate.mobile = ownerInfo.phone;
      
      if (Object.keys(ownerUpdate).length > 0) {
        // Update owner document in the main database (where owners are stored)
        const business = await Business.findById(req.params.id);
        
        if (business && business.owner) {
          // Update owner in the main database
          const { User } = req.mainModels;
          await User.findByIdAndUpdate(business.owner, ownerUpdate, { new: true });
        }
      }
    }

    // Handle subscription info
    if (subscriptionInfo) {
      if (subscriptionInfo.plan) updateData['subscription.plan'] = subscriptionInfo.plan;
      if (subscriptionInfo.maxUsers !== undefined) updateData['subscription.maxUsers'] = subscriptionInfo.maxUsers;
      if (subscriptionInfo.maxBranches !== undefined) updateData['subscription.maxBranches'] = subscriptionInfo.maxBranches;
      if (subscriptionInfo.features) updateData['subscription.features'] = subscriptionInfo.features;
    }

    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email mobile');

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
router.patch('/businesses/:id/status', setupMainDatabase, authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const business = await req.mainModels.Business.findByIdAndUpdate(
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


// Get Business Statistics
router.get('/businesses/:id/stats', authenticateAdmin, async (req, res) => {
  try {
    const businessId = req.params.id;
    
    // Connect to business-specific database
    const businessDb = mongoose.connection.useDb(`salon_crm_${businessId}`);
    
    // Get models for business database
    const Client = businessDb.model('Client', require('../models/Client').schema);
    const Appointment = businessDb.model('Appointment', require('../models/Appointment').schema);
    const Sale = businessDb.model('Sale', require('../models/Sale').schema);
    
    // Get user count from main database
    const totalUsers = await User.countDocuments({ branchId: businessId });
    const activeUsers = await User.countDocuments({ branchId: businessId, status: 'active' });
    
    // Get business-specific stats
    const [totalClients, totalAppointments, totalSales] = await Promise.all([
      Client.countDocuments(),
      Appointment.countDocuments(),
      Sale.countDocuments()
    ]);
    
    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlySales = await Sale.find({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const monthlyRevenue = monthlySales.reduce((total, sale) => {
      return total + (sale.grossTotal || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalClients,
        totalAppointments,
        totalSales,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get business stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});



// Dashboard Statistics
router.get('/dashboard/stats', setupMainDatabase, authenticateAdmin, async (req, res) => {
  try {
    const { Business, User } = req.mainModels;
    
    const [
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      recentBusinesses
    ] = await Promise.all([
      Business.countDocuments(),
      Business.countDocuments({ status: 'active' }),
      User.countDocuments(),
      Business.find().populate('owner', 'firstName lastName email').sort({ createdAt: -1 }).limit(5)
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
