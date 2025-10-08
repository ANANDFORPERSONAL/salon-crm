console.log('🚀 Starting Salon CRM Backend Server...');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Import database manager and middleware
const databaseManager = require('./config/database-manager');
const modelFactory = require('./models/model-factory');
const { setupBusinessDatabase, setupMainDatabase } = require('./middleware/business-db');

// Import main database models (for admin operations)
const User = require('./models/User').model;
const Admin = require('./models/Admin').model;
const Business = require('./models/Business').model;
const PasswordResetToken = require('./models/PasswordResetToken').model;

// Import business-specific models (for backward compatibility)
const BusinessSettings = require('./models/BusinessSettings').model;
const Service = require('./models/Service').model;
const Product = require('./models/Product').model;
const Staff = require('./models/Staff').model;
const Client = require('./models/Client').model;
const Appointment = require('./models/Appointment').model;
const Receipt = require('./models/Receipt').model;
const Sale = require('./models/Sale').model;
const Expense = require('./models/Expense').model;
const CashRegistry = require('./models/CashRegistry').model;
const InventoryTransaction = require('./models/InventoryTransaction').model;

// Import Routes
const cashRegistryRoutes = require('./routes/cashRegistry');
const adminRoutes = require('./routes/admin');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());

// Enhanced CORS configuration for Railway deployment
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 CORS Origins:', allowedOrigins);
console.log('🗄️ MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use((req, res, next) => {
  console.log(`📥 Incoming ${req.method} ${req.path}`);
  next();
});

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Handle CORS preflight for all routes
app.options('*', cors());

// Register Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', require('./routes/admin-settings'));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Initialize default users if they don't exist
const initializeDefaultUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultUsers = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'admin@salon.com',
          password: '$2a$10$20S481avXVWGJ3bN.6NJD.t6j/f771tQZkiz6CUQbUo460YXb15Fa',
          role: 'admin',
          hasLoginAccess: true,
          allowAppointmentScheduling: true,
          isActive: true,
          permissions: [
            // Admin gets all permissions
            { module: 'dashboard', feature: 'view', enabled: true },
            { module: 'dashboard', feature: 'edit', enabled: true },
            { module: 'appointments', feature: 'view', enabled: true },
            { module: 'appointments', feature: 'create', enabled: true },
            { module: 'appointments', feature: 'edit', enabled: true },
            { module: 'appointments', feature: 'delete', enabled: true },
            { module: 'customers', feature: 'view', enabled: true },
            { module: 'customers', feature: 'create', enabled: true },
            { module: 'customers', feature: 'edit', enabled: true },
            { module: 'customers', feature: 'delete', enabled: true },
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
        }
      ];

      await User.insertMany(defaultUsers);
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

// Initialize default business settings
const initializeBusinessSettings = async () => {
  try {
    const settingsCount = await BusinessSettings.countDocuments();
    if (settingsCount === 0) {
      const defaultSettings = new BusinessSettings({
        name: "Glamour Salon & Spa",
        email: "info@glamoursalon.com",
        phone: "(555) 123-4567",
        website: "www.glamoursalon.com",
        description: "Premium salon and spa services in the heart of the city",
        address: "123 Beauty Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        receiptPrefix: "INV",
        invoicePrefix: "INV",
        receiptNumber: 1,
        autoIncrementReceipt: true,
        socialMedia: "@glamoursalon"
      });
      await defaultSettings.save();
      console.log("Default business settings created");
    }
  } catch (error) {
    console.error("Error initializing business settings:", error);
  }
};
// Import authentication middleware
const { authenticateToken, requireAdmin, requireManager, requireStaff } = require('./middleware/auth');

// Granular permission middleware
const checkPermission = (module, feature) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has login access
    if (!req.user.hasLoginAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'Login access not granted' 
      });
    }

    // Check specific permission
    const hasPermission = req.user.permissions?.some(p => 
      p.module === module && p.feature === feature && p.enabled
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied. Required permission: ${module}.${feature}` 
      });
    }

    next();
  };
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Helper function to hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Helper function to compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Routes

// Authentication routes
app.post('/api/auth/login', setupMainDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Use main database User model
    const { User } = req.mainModels;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login timestamp
    await User.findByIdAndUpdate(user._id, { 
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    // If user is a business owner, reactivate any inactive businesses they own
    if (user.branchId) {
      // Use the main database connection for Business model
      const mainConnection = mongoose.connection.useDb('salon_crm_main');
      const Business = mainConnection.model('Business', require('./models/Business').schema);
      await Business.updateMany(
        { owner: user._id, status: 'inactive' },
        { status: 'active', updatedAt: new Date() }
      );
    }

    // Generate token
    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Staff login endpoint
app.post('/api/auth/staff-login', async (req, res) => {
  try {
    const { email, password, businessCode } = req.body;

    if (!email || !password || !businessCode) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and business code are required'
      });
    }

    // Get business ID from business code
    const mainConnection = mongoose.connection.useDb('salon_crm_main');
    const Business = mainConnection.model('Business', require('./models/Business').schema);
    const business = await Business.findOne({ code: businessCode });
    
    if (!business) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business code'
      });
    }
    
    // Connect to business-specific database using business ID
    const businessDb = mongoose.connection.useDb(`salon_crm_${business._id}`);
    const Staff = businessDb.model('Staff', require('./models/Staff').schema);
    
    // Find staff member
    const staff = await Staff.findOne({ 
      email: email.toLowerCase(),
      hasLoginAccess: true,
      isActive: true
    });
    
    if (!staff) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or no login access'
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, staff.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login timestamp
    await Staff.findByIdAndUpdate(staff._id, { 
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    // Generate token with staff info
    const token = generateToken({
      _id: staff._id,
      email: staff.email,
      role: staff.role,
      branchId: staff.branchId,
      firstName: staff.name.split(' ')[0],
      lastName: staff.name.split(' ').slice(1).join(' ') || '',
      mobile: staff.phone,
      hasLoginAccess: staff.hasLoginAccess,
      allowAppointmentScheduling: staff.allowAppointmentScheduling,
      isActive: staff.isActive
    });

    const { password: _, ...staffWithoutPassword } = staff.toObject();

    res.json({
      success: true,
      data: {
        user: {
          _id: staff._id,
          firstName: staff.name.split(' ')[0],
          lastName: staff.name.split(' ').slice(1).join(' ') || '',
          email: staff.email,
          mobile: staff.phone,
          role: staff.role,
          branchId: staff.branchId,
          hasLoginAccess: staff.hasLoginAccess,
          allowAppointmentScheduling: staff.allowAppointmentScheduling,
          isActive: staff.isActive,
          specialties: staff.specialties,
          commissionProfileIds: staff.commissionProfileIds,
          notes: staff.notes,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/auth/profile', authenticateToken, setupMainDatabase, async (req, res) => {
  try {
    // Regular user lookup from main database
    const { User } = req.mainModels;
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Password Reset Routes
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Check if user has login access
    if (!user.hasLoginAccess) {
      return res.status(400).json({
        success: false,
        error: 'This account does not have login access. Please contact your administrator.'
      });
    }

    // Generate reset token
    const token = PasswordResetToken.generateToken();
    
    // Create reset token record
    const resetToken = new PasswordResetToken({
      userId: user._id,
      token: token,
      email: user.email,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    await resetToken.save();

    // In a real application, you would send an email here
    // For now, we'll return the token in development
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      // Always include resetUrl in development mode
      resetUrl: resetUrl
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    // Find the reset token
    const resetToken = await PasswordResetToken.findOne({ token });
    if (!resetToken || !resetToken.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Find the user
    const user = await User.findById(resetToken.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true, runValidators: true }
    );

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resetToken = await PasswordResetToken.findOne({ token });
    if (!resetToken || !resetToken.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Get user info (without password)
    const user = await User.findById(resetToken.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// User Management routes (Admin only)
app.get('/api/users', authenticateToken, setupMainDatabase, requireAdmin, async (req, res) => {
  try {
    const { User } = req.mainModels;
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/users', authenticateToken, setupMainDatabase, requireAdmin, async (req, res) => {
  try {
    const { User } = req.mainModels;
    const {
      firstName,
      lastName,
      email,
      password,
      mobile,
      hasLoginAccess = false,
      allowAppointmentScheduling = false,
      commissionProfileIds = [],
    } = req.body;

    // Validate required fields
    if (!firstName || firstName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'First name is required'
      });
    }

    if (!mobile || mobile.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mobile number is required'
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Check if trying to create admin user
    const isAdmin = email && email.toLowerCase() === 'admin@salon.com';
    if (isAdmin) {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Admin user already exists. Only one admin user is allowed in the system.'
        });
      }
    }

    // Validate password requirement (admin users always have login access)
    if (hasLoginAccess && !password && !isAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Password is required when login access is enabled'
      });
    }

    const userData = {
      firstName: firstName.trim(),
      lastName: lastName || '',
      email: email.toLowerCase(),
      mobile: mobile.trim(),
      role: email && email.toLowerCase() === 'admin@salon.com' ? 'admin' : 'staff', // Admin role for admin@salon.com
      hasLoginAccess: email && email.toLowerCase() === 'admin@salon.com' ? true : hasLoginAccess, // Admin always has login access
      allowAppointmentScheduling: email && email.toLowerCase() === 'admin@salon.com' ? true : allowAppointmentScheduling, // Admin always has appointment access
      isActive: true, // Default to active
      permissions: email && email.toLowerCase() === 'admin@salon.com' ? [
        // Admin gets all permissions
        { module: 'dashboard', feature: 'view', enabled: true },
        { module: 'dashboard', feature: 'edit', enabled: true },
        { module: 'appointments', feature: 'view', enabled: true },
        { module: 'appointments', feature: 'create', enabled: true },
        { module: 'appointments', feature: 'edit', enabled: true },
        { module: 'appointments', feature: 'delete', enabled: true },
        { module: 'customers', feature: 'view', enabled: true },
        { module: 'customers', feature: 'create', enabled: true },
        { module: 'customers', feature: 'edit', enabled: true },
        { module: 'customers', feature: 'delete', enabled: true },
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
      ] : [], // Empty permissions for staff
      specialties: [], // Empty specialties
      hourlyRate: 0, // Default hourly rate
      commissionRate: 0, // Default commission rate
      notes: '', // Empty notes
      commissionProfileIds: commissionProfileIds, // Commission profile IDs
    };

    // Only add password if provided
    if (password) {
      const hashedPassword = await hashPassword(password);
      userData.password = hashedPassword;
    }

    const user = new User(userData);
    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/users/:id', authenticateToken, setupMainDatabase, async (req, res) => {
  try {
    const { User } = req.mainModels;
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/users/:id', authenticateToken, setupMainDatabase, async (req, res) => {
  try {
    const { User } = req.mainModels;
    const {
      firstName,
      lastName,
      email,
      password,
      mobile,
      hasLoginAccess,
      allowAppointmentScheduling,
      commissionProfileIds,
      avatar,
    } = req.body;

    // Check if user is updating their own profile or is admin
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === req.params.id || req.user._id === req.params.id;
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own profile'
      });
    }

    // Validate required fields
    if (!firstName || firstName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'First name is required'
      });
    }

    if (!mobile || mobile.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Mobile number is required'
      });
    }

    // Get the existing user to check current state
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email already exists (only if email is provided and different from current)
    if (email && email.trim() !== '' && email.toLowerCase() !== existingUser.email) {
      const existingUserWithEmail = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingUserWithEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }

    // Validate password requirement only if enabling login access for the first time (except for admin users)
    if (hasLoginAccess && !existingUser.hasLoginAccess && !password && existingUser.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Password is required when enabling login access for the first time'
      });
    }

    // For admin users, always ensure login access is enabled
    if (existingUser.role === 'admin') {
      req.body.hasLoginAccess = true;
    }

    // Check if trying to change role to admin
    if (req.body.role === 'admin' && existingUser.role !== 'admin') {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Admin user already exists. Only one admin user is allowed in the system.'
        });
      }
    }

    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName || '',
      email: email ? email.toLowerCase() : '',
      mobile: mobile.trim(),
    };

    // Only allow admins to update these fields
    if (isAdmin) {
      updateData.hasLoginAccess = hasLoginAccess;
      updateData.allowAppointmentScheduling = allowAppointmentScheduling;
      updateData.role = req.body.role;
      updateData.commissionProfileIds = commissionProfileIds || [];
    }

    // Add avatar if provided
    if (avatar) {
      updateData.avatar = avatar;
    }

    // Hash password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/users/:id', authenticateToken, setupMainDatabase, requireAdmin, async (req, res) => {
  try {
    const { User } = req.mainModels;
    // First check if the user exists and is admin
    const userToDelete = await User.findById(req.params.id);
    
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent deletion of admin users
    if (userToDelete.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin user. Admin account is protected.'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user permissions
app.get('/api/users/:id/permissions', authenticateToken, setupMainDatabase, requireAdmin, async (req, res) => {
  try {
    const { User } = req.mainModels;
    const user = await User.findById(req.params.id).select('permissions');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.permissions
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user permissions
app.put('/api/users/:id/permissions', authenticateToken, setupMainDatabase, requireAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    const { User } = req.mainModels;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Change user password with old password verification
app.post('/api/users/:id/change-password', authenticateToken, setupMainDatabase, requireAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { User } = req.mainModels;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required'
      });
    }

    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedNewPassword },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify admin password for editing admin details
app.post('/api/users/:id/verify-admin-password', authenticateToken, setupMainDatabase, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const { User } = req.mainModels;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Only allow verification for admin users
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'This endpoint is only for admin users'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect password'
      });
    }

    res.json({
      success: true,
      message: 'Password verified successfully'
    });
  } catch (error) {
    console.error('Admin password verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Clients routes
app.get('/api/clients', authenticateToken, requireStaff, setupBusinessDatabase, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Use business-specific Client model
    const { Client } = req.businessModels;

    // Build query for business-specific database
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    console.log('🔍 Clients API Debug:', {
      businessId: req.user.branchId,
      userEmail: req.user.email,
      query: query,
      database: req.businessConnection.name
    });

    const totalClients = await Client.countDocuments(query);
    console.log('📊 Total clients found:', totalClients);
    const clients = await Client.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    console.log('📋 Clients returned:', clients.length);

    res.json({
      success: true,
      data: clients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalClients,
        totalPages: Math.ceil(totalClients / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/clients/search', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Client } = req.businessModels;
    const { q } = req.query;
    
    if (!q) {
      const clients = await Client.find({}).sort({ createdAt: -1 });
      return res.json({
        success: true,
        data: clients
      });
    }

    const searchResults = await Client.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/clients/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Client } = req.businessModels;
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/clients', authenticateToken, requireManager, setupBusinessDatabase, async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone are required'
      });
    }

    // Use business-specific Client model
    const { Client } = req.businessModels;

    // Check for duplicate phone number within the business database
    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already exists. Please use a different number.'
      });
    }

    const newClient = new Client({
      name,
      email,
      phone,
      address,
      notes,
      status: 'active',
      totalVisits: 0,
      totalSpent: 0,
      branchId: req.user.branchId
    });

    const savedClient = await newClient.save();

    res.status(201).json({
      success: true,
      data: savedClient
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/clients/:id', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Client } = req.businessModels;
    const { phone } = req.body;
    
    // If phone number is being updated, check for duplicates
    if (phone) {
      const existingClient = await Client.findOne({ 
        phone, 
        _id: { $ne: req.params.id } // Exclude current client
      });
      if (existingClient) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already exists. Please use a different number.'
        });
      }
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: updatedClient
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.delete('/api/clients/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Client } = req.businessModels;
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    
    if (!deletedClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Services routes
app.get('/api/services', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    console.log('🔍 Services request for user:', req.user?.email, 'branchId:', req.user?.branchId);
    
    const { Service } = req.businessModels;
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    console.log('✅ Services found:', services.length);
    res.json({
      success: true,
      data: services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/services', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Service } = req.businessModels;
    const { name, category, duration, price, description } = req.body;

    if (!name || !category || !duration || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name, category, duration, and price are required'
      });
    }

    const newService = new Service({
      name,
      category,
      duration: parseInt(duration),
      price: parseFloat(price),
      description: description || '',
      isActive: true,
      branchId: req.user.branchId
    });

    const savedService = await newService.save();

    res.status(201).json({
      success: true,
      data: savedService
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/services/:id', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Service } = req.businessModels;
    const { name, category, duration, price, description, isActive } = req.body;

    if (!name || !category || !duration || !price) {
      return res.status(400).json({
        success: false,
        error: 'Name, category, duration, and price are required'
      });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        duration: parseInt(duration),
        price: parseFloat(price),
        description: description || '',
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/services/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Service } = req.businessModels;
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    
    if (!deletedService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Products routes
app.get('/api/products', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    console.log('🔍 Products request for user:', req.user?.email, 'branchId:', req.user?.branchId);
    
    const { Product } = req.businessModels;
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    console.log('✅ Products found:', products.length);
    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/products', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Product, InventoryTransaction } = req.businessModels;
    const { name, category, price, stock, sku, supplier, description, taxCategory, productType, transactionType } = req.body;

    console.log('🔍 Product creation request body:', req.body);
    console.log('🔍 Extracted fields:', { name, category, price, stock, sku, supplier, description, taxCategory, productType });

    // For service products, price is not required
    const isServiceProduct = productType === 'service';
    const priceRequired = !isServiceProduct;
    
    if (!name || !category || !stock || (priceRequired && (price === undefined || price === null || price === ''))) {
      console.log('❌ Validation failed - missing required fields:', { 
        name: !!name, 
        category: !!category, 
        price: price, 
        stock: !!stock,
        productType: productType,
        isServiceProduct: isServiceProduct,
        priceRequired: priceRequired
      });
      return res.status(400).json({
        success: false,
        error: isServiceProduct 
          ? 'Name, category, and stock are required for service products' 
          : 'Name, category, price, and stock are required'
      });
    }

    const newProduct = new Product({
      name,
      category,
      price: isServiceProduct ? 0 : parseFloat(price), // Service products have price 0
      stock: parseInt(stock),
      sku: sku || `SKU-${Date.now()}`,
      supplier,
      description,
      taxCategory: taxCategory || 'standard',
      productType: productType || 'retail',
      isActive: true,
      branchId: req.user.branchId
    });

    const savedProduct = await newProduct.save();

    // Create inventory transaction for stock addition
    const inventoryTransaction = new InventoryTransaction({
      productId: savedProduct._id,
      productName: savedProduct.name,
      transactionType: transactionType || 'purchase',
      quantity: parseInt(stock),
      previousStock: 0,
      newStock: parseInt(stock),
      unitCost: parseFloat(price) || 0,
      totalValue: (parseFloat(price) || 0) * parseInt(stock),
      referenceType: 'purchase',
      referenceId: savedProduct._id.toString(),
      referenceNumber: `PROD-${savedProduct._id.toString().slice(-6)}`,
      processedBy: req.user.email,
      location: 'main',
      reason: `Product added to inventory`,
      notes: `Initial stock addition via ${transactionType || 'purchase'}`,
      transactionDate: new Date()
    });

    await inventoryTransaction.save();

    res.status(201).json({
      success: true,
      data: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/products/:id', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Product } = req.businessModels;
    const { name, category, price, stock, sku, supplier, description, isActive, taxCategory, productType } = req.body;

    // For service products, price is not required
    const isServiceProduct = productType === 'service';
    const priceRequired = !isServiceProduct;
    
    if (!name || !category || !stock || (priceRequired && (price === undefined || price === null || price === ''))) {
      return res.status(400).json({
        success: false,
        error: isServiceProduct 
          ? 'Name, category, and stock are required for service products' 
          : 'Name, category, price, and stock are required'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price: isServiceProduct ? 0 : parseFloat(price), // Service products have price 0
        stock: parseInt(stock),
        sku: sku || `SKU-${Date.now()}`,
        supplier,
        description,
        taxCategory: taxCategory || 'standard',
        productType: productType || 'retail',
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/products/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Product } = req.businessModels;
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== SUPPLIER ROUTES ====================

// Get all suppliers
app.get('/api/suppliers', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Supplier } = req.businessModels;
    const { search, activeOnly } = req.query;

    let query = { branchId: req.user.branchId };

    // Filter by active status if requested
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get a single supplier by ID
app.get('/api/suppliers/:id', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Supplier } = req.businessModels;
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create a new supplier
app.post('/api/suppliers', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Supplier } = req.businessModels;
    const { name, contactPerson, phone, email, address, notes } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Supplier name is required'
      });
    }

    // Check if supplier with same name already exists for this branch
    const existingSupplier = await Supplier.findOne({
      branchId: req.user.branchId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: 'A supplier with this name already exists'
      });
    }

    // Create new supplier
    const supplier = new Supplier({
      name: name.trim(),
      contactPerson: contactPerson || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      notes: notes || '',
      branchId: req.user.branchId,
      isActive: true
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update a supplier
app.put('/api/suppliers/:id', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Supplier } = req.businessModels;
    const { name, contactPerson, phone, email, address, notes, isActive } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Supplier name is required'
      });
    }

    // Check if another supplier with same name exists
    const existingSupplier = await Supplier.findOne({
      _id: { $ne: req.params.id },
      branchId: req.user.branchId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: 'A supplier with this name already exists'
      });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        contactPerson: contactPerson || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        notes: notes || '',
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete a supplier
app.delete('/api/suppliers/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Supplier } = req.businessModels;
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!deletedSupplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== INVENTORY MANAGEMENT ROUTES ====================
// Product Out - Deduct products from inventory
app.post('/api/inventory/out', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Product, InventoryTransaction } = req.businessModels;
    const { productId, quantity, transactionType, reason, notes } = req.body;

    if (!productId || !quantity || !transactionType) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, quantity, and transaction type are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const deductionQuantity = Math.abs(parseInt(quantity));
    if (product.stock < deductionQuantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${product.stock}, Requested: ${deductionQuantity}`
      });
    }

    // Update product stock
    const previousStock = product.stock;
    const newStock = previousStock - deductionQuantity;
    
    await Product.findByIdAndUpdate(productId, { stock: newStock });

    // Create inventory transaction
    const inventoryTransaction = new InventoryTransaction({
      productId: product._id,
      productName: product.name,
      transactionType: transactionType,
      quantity: -deductionQuantity, // Negative for deduction
      previousStock: previousStock,
      newStock: newStock,
      unitCost: product.price || 0,
      totalValue: (product.price || 0) * deductionQuantity,
      referenceType: 'adjustment',
      referenceId: product._id.toString(),
      referenceNumber: `OUT-${Date.now()}`,
      processedBy: req.user.email,
      location: 'main',
      reason: reason || `Stock deduction - ${transactionType}`,
      notes: notes || '',
      transactionDate: new Date()
    });

    await inventoryTransaction.save();

    res.json({
      success: true,
      data: {
        product: await Product.findById(productId),
        transaction: inventoryTransaction
      },
      message: `Successfully deducted ${deductionQuantity} units of ${product.name}`
    });
  } catch (error) {
    console.error('Error deducting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get inventory transactions
app.get('/api/inventory/transactions', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { InventoryTransaction } = req.businessModels;
    const { page = 1, limit = 50, productId, transactionType, dateFrom, dateTo } = req.query;

    let query = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    if (transactionType) {
      query.transactionType = transactionType;
    }
    
    if (dateFrom || dateTo) {
      query.transactionDate = {};
      if (dateFrom) {
        query.transactionDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.transactionDate.$lte = new Date(dateTo);
      }
    }

    const transactions = await InventoryTransaction.find(query)
      .sort({ transactionDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await InventoryTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==================== CATEGORY ROUTES ====================

// Get all categories
app.get('/api/categories', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Category } = req.businessModels;
    const { search, type, activeOnly } = req.query;

    let query = { branchId: req.user.branchId };

    // Filter by type if provided (product, service, both)
    if (type && ['product', 'service', 'both'].includes(type)) {
      query.$or = [
        { type: type },
        { type: 'both' }
      ];
    }

    // Filter by active status if requested
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get a single category by ID
app.get('/api/categories/:id', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Category } = req.businessModels;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create a new category
app.post('/api/categories', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Category } = req.businessModels;
    const { name, type, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Validate type if provided
    if (type && !['product', 'service', 'both'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category type. Must be: product, service, or both'
      });
    }

    // Check if category with same name already exists for this branch
    const existingCategory = await Category.findOne({
      branchId: req.user.branchId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'A category with this name already exists'
      });
    }

    // Create new category
    const category = new Category({
      name: name.trim(),
      type: type || 'both',
      description: description || '',
      branchId: req.user.branchId,
      isActive: true
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update a category
app.put('/api/categories/:id', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Category } = req.businessModels;
    const { name, type, description, isActive } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Validate type if provided
    if (type && !['product', 'service', 'both'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category type. Must be: product, service, or both'
      });
    }

    // Check if another category with same name exists
    const existingCategory = await Category.findOne({
      _id: { $ne: req.params.id },
      branchId: req.user.branchId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'A category with this name already exists'
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        type: type || 'both',
        description: description || '',
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete a category
app.delete('/api/categories/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Category } = req.businessModels;
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update product stock
app.patch('/api/products/:id/stock', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Product } = req.businessModels;
    const { id } = req.params;
    const { quantity, operation = 'decrease' } = req.body; // operation can be 'decrease' or 'increase'
    
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    let newStock;
    if (operation === 'decrease') {
      // Check if we have enough stock
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
        });
      }
      newStock = product.stock - quantity;
    } else if (operation === 'increase') {
      newStock = product.stock + quantity;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation. Use "decrease" or "increase"'
      });
    }

    // Update the product stock
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { stock: newStock },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedProduct,
      message: `Stock ${operation}d successfully. New stock: ${newStock}`
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Staff routes
app.get('/api/staff', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Staff } = req.businessModels;
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: staff,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Staff Directory (includes business owner + staff members)
app.get('/api/staff-directory', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Staff } = req.businessModels;
    const { search = '' } = req.query;

    // Get business owner from main database
    const mainConnection = await databaseManager.getMainConnection();
    const User = mainConnection.model('User', require('./models/User').schema);
    const businessOwner = await User.findOne({ 
      branchId: req.user.branchId,
      role: 'admin'
    });

    // Get staff members from business database
    let staffQuery = {};
    if (search) {
      staffQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const staffMembers = await Staff.find(staffQuery).sort({ createdAt: -1 });

    // Combine business owner and staff members
    const allStaff = [];

    // Add business owner first (if exists and matches search)
    if (businessOwner) {
      const ownerMatchesSearch = !search || 
        businessOwner.name.toLowerCase().includes(search.toLowerCase()) ||
        businessOwner.email.toLowerCase().includes(search.toLowerCase()) ||
        businessOwner.role.toLowerCase().includes(search.toLowerCase());

      if (ownerMatchesSearch) {
        allStaff.push({
          _id: businessOwner._id,
          name: businessOwner.name,
          email: businessOwner.email,
          phone: businessOwner.mobile,
          role: 'admin',
          specialties: businessOwner.specialties || [],
          salary: businessOwner.salary || 0,
          commissionProfileIds: businessOwner.commissionProfileIds || [],
          notes: businessOwner.notes || 'Business Owner',
          isActive: businessOwner.isActive,
          hasLoginAccess: businessOwner.hasLoginAccess || true, // Business owner always has login access
          allowAppointmentScheduling: businessOwner.allowAppointmentScheduling || true, // Business owner always has appointment access
          permissions: businessOwner.permissions || [],
          createdAt: businessOwner.createdAt,
          updatedAt: businessOwner.updatedAt,
          isOwner: true // Flag to identify business owner
        });
      }
    }

    // Add staff members
    allStaff.push(...staffMembers.map(staff => ({
      ...staff.toObject(),
      salary: staff.salary || 0,
      commissionProfileIds: staff.commissionProfileIds || [],
      hasLoginAccess: staff.hasLoginAccess || false,
      allowAppointmentScheduling: staff.allowAppointmentScheduling || false,
      permissions: staff.permissions || [],
      isOwner: false
    })));

    res.json({
      success: true,
      data: allStaff,
      pagination: {
        page: 1,
        limit: allStaff.length,
        total: allStaff.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching staff directory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/staff', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Staff } = req.businessModels;
    const { name, email, phone, role, specialties, salary, commissionProfileIds, notes, hasLoginAccess, allowAppointmentScheduling, password, isActive } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, phone, and role are required'
      });
    }

    // Validate password requirement when login access is enabled
    if (hasLoginAccess && (!password || password.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Password is required when login access is enabled'
      });
    }

    // Validate specialties requirement when appointment scheduling is enabled
    if (allowAppointmentScheduling && (!specialties || specialties.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'At least one specialty is required when appointment scheduling is enabled'
      });
    }

    const staffData = {
      name,
      email,
      phone,
      role,
      specialties: specialties || [],
      salary: parseFloat(salary) || 0,
      commissionProfileIds: commissionProfileIds || [],
      notes: notes || '',
      hasLoginAccess: hasLoginAccess || false,
      allowAppointmentScheduling: allowAppointmentScheduling || false,
      isActive: isActive !== undefined ? isActive : true,
      branchId: req.user.branchId
    };

    // Add password if provided
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      staffData.password = await bcrypt.hash(password, 10);
    }

    const newStaff = new Staff(staffData);
    const savedStaff = await newStaff.save();

    res.status(201).json({
      success: true,
      data: savedStaff
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/staff/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Staff } = req.businessModels;
    const { name, email, phone, role, specialties, salary, commissionProfileIds, notes, hasLoginAccess, allowAppointmentScheduling, password, isActive } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, phone, and role are required'
      });
    }

    // Get existing staff to check current state
    const existingStaff = await Staff.findById(req.params.id);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Validate password requirement when enabling login access for the first time
    if (hasLoginAccess && !existingStaff.hasLoginAccess && (!password || password.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Password is required when enabling login access for the first time'
      });
    }

    // Validate specialties requirement when appointment scheduling is enabled
    if (allowAppointmentScheduling && (!specialties || specialties.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'At least one specialty is required when appointment scheduling is enabled'
      });
    }

    const updateData = {
      name,
      email,
      phone,
      role,
      specialties: specialties || [],
      salary: parseFloat(salary) || 0,
      commissionProfileIds: commissionProfileIds || [],
      notes: notes || '',
      hasLoginAccess: hasLoginAccess !== undefined ? hasLoginAccess : false,
      allowAppointmentScheduling: allowAppointmentScheduling !== undefined ? allowAppointmentScheduling : false,
      isActive: isActive !== undefined ? isActive : true,
    };

    // Add password if provided
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: updatedStaff
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/staff/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Staff } = req.businessModels;
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    
    if (!deletedStaff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Appointments routes
app.get('/api/appointments', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Appointment } = req.businessModels;
    const { page = 1, limit = 10, date, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};

    if (date) {
      query.date = date;
    }

    if (status) {
      query.status = status;
    }

    const totalAppointments = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('clientId', 'name phone email')
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name role')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalAppointments,
        totalPages: Math.ceil(totalAppointments / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments'
    });
  }
});

app.post('/api/appointments', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Appointment } = req.businessModels;
    const { clientId, clientName, date, time, services, totalDuration, totalAmount, notes, status = 'scheduled' } = req.body;

    if (!clientId || !date || !time || !services || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Client, date, time, and at least one service are required'
      });
    }

    // Create appointments for each service
    const createdAppointments = [];
    
    for (const service of services) {
      const appointmentData = {
        clientId,
        serviceId: service.serviceId,
        date,
        time,
        duration: service.duration,
        status,
        notes,
        price: service.price,
        branchId: req.user.branchId
      };

      // Handle multiple staff assignments
      if (service.staffAssignments && Array.isArray(service.staffAssignments)) {
        appointmentData.staffAssignments = service.staffAssignments;
        // Validate that percentages add up to 100%
        const totalPercentage = service.staffAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return res.status(400).json({
            success: false,
            error: 'Staff assignment percentages must add up to 100%'
          });
        }
      } else if (service.staffId) {
        // Legacy support - single staff member
        appointmentData.staffId = service.staffId;
        appointmentData.staffAssignments = [{
          staffId: service.staffId,
          percentage: 100,
          role: 'primary'
        }];
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either staffId or staffAssignments is required'
        });
      }

      const newAppointment = new Appointment(appointmentData);
      const savedAppointment = await newAppointment.save();
      
      // Populate the saved appointment with related data
      const populatedAppointment = await Appointment.findById(savedAppointment._id)
        .populate('clientId', 'name phone email')
        .populate('serviceId', 'name price duration')
        .populate('staffId', 'name role')
        .populate('staffAssignments.staffId', 'name role');

      createdAppointments.push(populatedAppointment);
    }

    res.status(201).json({
      success: true,
      data: createdAppointments,
      message: 'Appointments created successfully'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create appointment'
    });
  }
});

// Receipts routes
app.get('/api/receipts', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Receipt } = req.businessModels;
    const { page = 1, limit = 10, clientId, date } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (date) {
      query.date = date;
    }

    const totalReceipts = await Receipt.countDocuments(query);
    const receipts = await Receipt.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: receipts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalReceipts,
        totalPages: Math.ceil(totalReceipts / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts'
    });
  }
});

app.post('/api/receipts', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Receipt } = req.businessModels;
    const { clientId, staffId, items, subtotal, tip, discount, tax, total, payments, notes } = req.body;

    if (!clientId || !staffId || !items || !total) {
      return res.status(400).json({
        success: false,
        error: 'Client, staff, items, and total are required'
      });
    }

    // Process items to handle staff contributions
    const processedItems = items.map(item => {
      // If staffContributions is provided, calculate amounts
      if (item.staffContributions && Array.isArray(item.staffContributions)) {
        item.staffContributions = item.staffContributions.map(contribution => ({
          ...contribution,
          amount: (item.total * contribution.percentage) / 100
        }));
      }
      
      // Maintain backward compatibility - if no staffContributions but has staffId/staffName
      if (!item.staffContributions && item.staffId && item.staffName) {
        item.staffContributions = [{
          staffId: item.staffId,
          staffName: item.staffName,
          percentage: 100,
          amount: item.total
        }];
      }
      
      return item;
    });

    const newReceipt = new Receipt({
      receiptNumber: `RCP-${Date.now()}`,
      clientId,
      staffId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      items: processedItems,
      subtotal: parseFloat(subtotal) || 0,
      tip: parseFloat(tip) || 0,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      total: parseFloat(total),
      payments: payments || [],
      notes,
      branchId: req.user.branchId
    });

    const savedReceipt = await newReceipt.save();

    res.status(201).json({
      success: true,
      data: savedReceipt
    });
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create receipt'
    });
  }
});

// Update appointment
app.put('/api/appointments/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { Appointment } = req.businessModels;

    // Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('clientId', 'name phone email')
    .populate('serviceId', 'name price duration')
    .populate('staffId', 'name role');

    res.json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment'
    });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { id } = req.params;
    const { Appointment } = req.businessModels;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    await Appointment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete appointment'
    });
  }
});

// Get receipts by client ID
app.get('/api/receipts/client/:clientId', authenticateToken, setupBusinessDatabase, async (req, res) => {
  const { clientId } = req.params;
  const { Receipt } = req.businessModels;
  
  try {
    const clientReceipts = await Receipt.find({ clientId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: clientReceipts
    });
  } catch (error) {
    console.error('Error fetching receipts by client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client receipts'
    });
  }
});

// Reports routes
app.get('/api/reports/dashboard', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    console.log('🔍 Dashboard stats request for user:', req.user?.email, 'branchId:', req.user?.branchId);
    
    const { Service, Product, Staff, Client, Appointment, Receipt, Sale } = req.businessModels;
    
    // Get counts from business-specific database
    const totalServices = await Service.countDocuments();
    console.log('Total services:', totalServices);
    
    const totalProducts = await Product.countDocuments();
    console.log('Total products:', totalProducts);
    
    const totalStaff = await Staff.countDocuments();
    console.log('Total staff:', totalStaff);
    
    const totalClients = await Client.countDocuments();
    console.log('Total clients:', totalClients);
    
    const totalAppointments = await Appointment.countDocuments();
    console.log('Total appointments:', totalAppointments);
    
    const totalReceipts = await Receipt.countDocuments();
    console.log('Total receipts:', totalReceipts);

    // Calculate total revenue from receipts
    const receipts = await Receipt.find();
    const totalRevenue = receipts.reduce((sum, receipt) => sum + receipt.total, 0);
    console.log('Total revenue:', totalRevenue);

    console.log('✅ Dashboard stats calculated for business:', req.user?.branchId);
    res.json({
      success: true,
      data: {
        totalServices,
        totalProducts,
        totalStaff,
        totalClients,
        totalAppointments,
        totalReceipts,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// --- SALES API ---
app.get('/api/sales', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    console.log('🔍 Sales request for user:', req.user?.email, 'branchId:', req.user?.branchId);
    
    const { Sale } = req.businessModels;
    const sales = await Sale.find().sort({ date: -1 });
    
    console.log('✅ Sales found:', sales.length);
    res.json({ success: true, data: sales });
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sales', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    console.log('🔍 Sales POST request received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User:', req.user);
    console.log('🌐 Request headers:', req.headers);
    console.log('🌐 Request method:', req.method);
    console.log('🌐 Request url:', req.url);
    
    const { Sale, Product, InventoryTransaction } = req.businessModels;
    const saleData = req.body;
    
    // Process items to handle staff contributions
    if (saleData.items && Array.isArray(saleData.items)) {
      saleData.items = saleData.items.map(item => {
        // If staffContributions is provided, calculate amounts
        if (item.staffContributions && Array.isArray(item.staffContributions)) {
          item.staffContributions = item.staffContributions.map(contribution => ({
            ...contribution,
            amount: (item.total * contribution.percentage) / 100
          }));
        }
        
        // Maintain backward compatibility - if no staffContributions but has staffId/staffName
        if (!item.staffContributions && item.staffId && item.staffName) {
          item.staffContributions = [{
            staffId: item.staffId,
            staffName: item.staffName,
            percentage: 100,
            amount: item.total
          }];
        }
        
        return item;
      });
    }
    
    // Add branchId to sale data
    saleData.branchId = req.user.branchId;
    
    const sale = new Sale(saleData);
    await sale.save();

    // Create inventory transactions for product items
    if (saleData.items && Array.isArray(saleData.items)) {
      for (const item of saleData.items) {
        if (item.type === 'product' && item.productId) {
          try {
            const product = await Product.findById(item.productId);
            if (product) {
              // Update product stock
              const previousStock = product.stock;
              const newStock = previousStock - item.quantity;
              
              await Product.findByIdAndUpdate(item.productId, { stock: newStock });
              
              // Create inventory transaction
              const inventoryTransaction = new InventoryTransaction({
                productId: item.productId,
                productName: item.name,
                transactionType: 'sale',
                quantity: -item.quantity, // Negative for deduction
                previousStock: previousStock,
                newStock: newStock,
                unitCost: item.price,
                totalValue: item.total,
                referenceType: 'sale',
                referenceId: sale._id.toString(),
                referenceNumber: sale.billNo,
                processedBy: saleData.staffName || 'System',
                reason: 'Product sold',
                notes: `Sold to ${saleData.customerName}`,
                transactionDate: new Date()
              });
              
              await inventoryTransaction.save();
              
              console.log(`✅ Inventory transaction created for product ${item.name}: ${item.quantity} units sold`);
            }
          } catch (inventoryError) {
            console.error('Error creating inventory transaction:', inventoryError);
            // Don't fail the sale if inventory tracking fails
          }
        }
      }
    }

    console.log('✅ Sale created successfully:', sale._id);
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    console.error('❌ Sales creation error:', err);
    console.error('❌ Error details:', {
      message: err.message,
      name: err.name,
      stack: err.stack,
      validationErrors: err.errors
    });
    res.status(400).json({ 
      success: false, 
      error: err.message,
      details: err.errors || err.message
    });
  }
});

app.get('/api/sales/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Sale } = req.businessModels;
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/sales/:id', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Sale } = req.businessModels;
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get sales by client name
app.get('/api/sales/client/:clientName', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { clientName } = req.params;
    
    const { Sale } = req.businessModels;
    
    // Search for sales by customer name (case-insensitive)
    const sales = await Sale.find({
      customerName: { $regex: clientName, $options: 'i' }
    }).sort({ date: -1 });
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching sales by client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client sales'
    });
  }
});

// Get sales by bill number
app.get('/api/sales/bill/:billNo', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Sale } = req.businessModels;
    const sale = await Sale.findOne({ billNo: req.params.billNo });
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add payment to a sale
app.post('/api/sales/:id/payment', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, notes, collectedBy } = req.body;
    const { Sale } = req.businessModels;
    
    if (!amount || !method) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount and payment method are required' 
      });
    }
    
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ 
        success: false, 
        error: 'Sale not found' 
      });
    }
    
    // Validate payment amount
    if (amount > sale.paymentStatus.remainingAmount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment amount cannot exceed remaining balance' 
      });
    }
    
    // Add payment using the model method
    const paymentData = {
      date: new Date(),
      amount: parseFloat(amount),
      method,
      notes: notes || '',
      collectedBy: collectedBy || req.user.name || 'Staff'
    };
    
    await sale.addPayment(paymentData);
    
    res.json({ 
      success: true, 
      data: sale,
      message: `Payment of ₹${amount} collected successfully`,
      paymentSummary: sale.getPaymentSummary()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get payment summary for a sale
app.get('/api/sales/:id/payment-summary', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { id } = req.params;
    const { Sale } = req.businessModels;
    const sale = await Sale.findById(id);
    
    if (!sale) {
      return res.status(404).json({ 
        success: false, 
        error: 'Sale not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: sale.getPaymentSummary(),
      paymentHistory: sale.paymentHistory
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get unpaid/overdue bills
app.get('/api/sales/unpaid/overdue', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const { Sale } = req.businessModels;
    
    const unpaidBills = await Sale.find({
      status: { $in: ['unpaid', 'partial', 'overdue', 'Unpaid', 'Partial', 'Overdue'] }
    })
    .sort({ 'paymentStatus.dueDate': 1, date: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await Sale.countDocuments({
      status: { $in: ['unpaid', 'partial', 'overdue', 'Unpaid', 'Partial', 'Overdue'] }
    });
    
    res.json({
      success: true,
      data: unpaidBills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- EXPENSES API ---
app.get('/api/expenses', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Expense } = req.businessModels;
    const { page = 1, limit = 100, search, dateFrom, dateTo, category, paymentMethod } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMode = paymentMethod;
    }
    
    const skip = (page - 1) * limit;
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Expense.countDocuments(query);
    
    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/expenses', authenticateToken, setupBusinessDatabase, requireStaff, async (req, res) => {
  try {
    const { Expense } = req.businessModels;
    const expenseData = {
      ...req.body,
      createdBy: req.user.id,
      branchId: req.user.branchId
    };
    
    const expense = new Expense(expenseData);
    await expense.save();
    
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/expenses/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { Expense } = req.businessModels;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/expenses/:id', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Expense } = req.businessModels;
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/expenses/:id', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    const { Expense } = req.businessModels;
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- BUSINESS SETTINGS API ---
app.get("/api/settings/business", authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    console.log('🔍 Business settings request for user:', req.user?.email, 'branchId:', req.user?.branchId);
    
    const { BusinessSettings } = req.businessModels;
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new BusinessSettings({
        name: "Glamour Salon & Spa",
        email: "info@glamoursalon.com",
        phone: "(555) 123-4567",
        website: "www.glamoursalon.com",
        description: "Premium salon and spa services in the heart of the city",
        address: "123 Beauty Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
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
        socialMedia: "@glamoursalon",
        branchId: req.user.branchId
      });
      await settings.save();
    }

    console.log('✅ Business settings found:', settings.name);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Get business settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.put("/api/settings/business", authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    console.log('📝 Business settings update request received for user:', req.user?.email, 'branchId:', req.user?.branchId);
    console.log('📊 Request body size:', JSON.stringify(req.body).length, 'characters');
    
    const { BusinessSettings } = req.businessModels;
    const {
      name,
      email,
      phone,
      website,
      description,
      address,
      city,
      state,
      zipCode,
      socialMedia,
      logo,
      gstNumber
    } = req.body;
    
    console.log('🖼️ Logo data length:', logo ? logo.length : 0, 'characters');
    console.log('🧾 GST Number:', gstNumber);

    // Validate required fields
    if (!name || !email || !phone || !address || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing"
      });
    }

    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      settings = new BusinessSettings();
    }

    // Update settings
    settings.name = name;
    settings.email = email;
    settings.phone = phone;
    settings.website = website || "";
    settings.description = description || "";
    settings.address = address;
    settings.city = city;
    settings.state = state;
    settings.zipCode = zipCode;
    settings.socialMedia = socialMedia || "@glamoursalon";
    settings.logo = logo || "";
    settings.gstNumber = gstNumber || "";

    await settings.save();

    console.log('✅ Business settings updated for:', settings.name);
    res.json({
      success: true,
      data: settings,
      message: "Business settings updated successfully"
    });
  } catch (error) {
    console.error("❌ Update business settings error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

// Test endpoint to check authentication
app.get("/api/test-auth", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Authentication working",
    user: {
      id: req.user._id,
      email: req.user.email,
      branchId: req.user.branchId,
      role: req.user.role
    }
  });
});

// Test endpoint to check business database setup
app.get("/api/test-business-db", authenticateToken, setupBusinessDatabase, (req, res) => {
  res.json({
    success: true,
    message: "Business database setup working",
    user: {
      id: req.user._id,
      email: req.user.email,
      branchId: req.user.branchId,
      role: req.user.role
    },
    businessModels: Object.keys(req.businessModels || {})
  });
});

// Test endpoint to verify logging is working
app.post("/api/test-increment", authenticateToken, async (req, res) => {
  console.log('🧪 ===== TEST INCREMENT ENDPOINT CALLED =====');
  console.log('🧪 User:', req.user);
  res.json({ success: true, message: "Test endpoint working", user: req.user });
});

// API to increment receipt number atomically
app.post("/api/settings/business/increment-receipt", authenticateToken, async (req, res) => {
  try {
    console.log('🔢 ===== INCREMENT RECEIPT ENDPOINT CALLED =====');
    console.log('🔢 Increment receipt number request received');
    console.log('👤 User:', req.user?.email, 'Branch:', req.user?.branchId);

    // Set up business database manually to avoid middleware issues
    const businessId = req.user?.branchId;
    if (!businessId) {
      console.error('❌ Business ID not found in user data');
      return res.status(400).json({
        success: false,
        error: 'Business ID not found in user data'
      });
    }

    console.log('🔍 Getting business connection for ID:', businessId);
    let businessConnection;
    try {
      businessConnection = await databaseManager.getConnection(businessId);
    } catch (connectionError) {
      console.error('❌ Error getting business connection:', connectionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to connect to business database',
        details: connectionError.message
      });
    }
    console.log('🔍 Business connection obtained:', !!businessConnection);

    let businessModels;
    try {
      businessModels = modelFactory.createBusinessModels(businessConnection);
    } catch (modelsError) {
      console.error('❌ Error creating business models:', modelsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create business models',
        details: modelsError.message
      });
    }
    console.log('🔍 Business models created:', Object.keys(businessModels));

    const { BusinessSettings, Sale } = businessModels;
    
    if (!BusinessSettings) {
      console.error('❌ BusinessSettings model not found in businessModels');
      return res.status(500).json({
        success: false,
        error: 'BusinessSettings model not available'
      });
    }
    
    // Atomically increment receipt number to prevent race conditions
    console.log('🔍 Atomically incrementing receipt number...');
    
    // First, ensure settings exist
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      console.log('❌ Business settings not found, creating new one');
      console.log('📝 Creating with branchId:', businessId);
      settings = new BusinessSettings({
        branchId: businessId,
        receiptNumber: 0
      });
      try {
        await settings.save();
      } catch (createError) {
        console.error('❌ Error creating settings:', createError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create business settings',
          details: createError.message
        });
      }
    } else if (!settings.branchId) {
      // Ensure existing settings have branchId (for backward compatibility)
      console.log('⚠️ Existing settings missing branchId, adding it now');
      settings.branchId = businessId;
      await settings.save();
    }

    // Use findOneAndUpdate with $inc for atomic increment
    const updatedSettings = await BusinessSettings.findOneAndUpdate(
      { _id: settings._id },
      { $inc: { receiptNumber: 1 } },
      { new: true } // Return the updated document
    );

    if (!updatedSettings) {
      console.error('❌ Failed to atomically increment receipt number');
      return res.status(500).json({
        success: false,
        error: 'Failed to increment receipt number'
      });
    }

    const newReceiptNumber = updatedSettings.receiptNumber;
    console.log('📊 Atomically incremented to:', newReceiptNumber);

    // Check if receipt number already exists (duplicate prevention)
    const prefix = updatedSettings.invoicePrefix || updatedSettings.receiptPrefix || "INV";
    let formattedReceiptNumber = `${prefix}-${newReceiptNumber.toString().padStart(6, '0')}`;

    console.log('🔍 Checking for duplicate receipt number:', formattedReceiptNumber);

    let existingSale = await Sale.findOne({ billNo: formattedReceiptNumber });

    if (existingSale) {
      console.log('⚠️ Duplicate receipt number found, finding next available');
      // If duplicate exists, find the next available number
      let nextNumber = newReceiptNumber + 1;
      let nextFormattedNumber = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;

      // Set a reasonable limit to prevent infinite loops
      let attempts = 0;
      const maxAttempts = 1000;

      while (attempts < maxAttempts && await Sale.findOne({ billNo: nextFormattedNumber })) {
        nextNumber++;
        nextFormattedNumber = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error('❌ Could not find available receipt number after', maxAttempts, 'attempts');
        return res.status(500).json({
          success: false,
          error: 'Could not find available receipt number. Please contact support.'
        });
      }

      // Update to the next available number
      await BusinessSettings.findOneAndUpdate(
        { _id: settings._id },
        { receiptNumber: nextNumber }
      );

      formattedReceiptNumber = nextFormattedNumber;
      console.log('✅ Using next available receipt number:', nextNumber);
    } else {
      console.log('✅ Using incremented receipt number:', newReceiptNumber);
    }

    // Extract the final number from the formatted receipt number
    const finalReceiptNumber = parseInt(formattedReceiptNumber.split('-').pop() || '0');

    res.json({
      success: true,
      data: { 
        receiptNumber: finalReceiptNumber,
        formattedReceiptNumber: formattedReceiptNumber
      },
      message: "Receipt number incremented successfully"
    });
  } catch (error) {
    console.error("❌ Increment receipt number error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
});

// POS Settings API
app.get("/api/settings/pos", authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { BusinessSettings } = req.businessModels;
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: "Business settings not found"
      });
    }

    console.log('=== POS SETTINGS DEBUG ===')
    console.log('Full settings object:', settings)
    console.log('settings.invoicePrefix:', settings.invoicePrefix)
    console.log('settings.receiptPrefix:', settings.receiptPrefix)
    console.log('settings.receiptNumber:', settings.receiptNumber)

    // Return the NEXT receipt number (current + 1) for display
    const nextReceiptNumber = (settings.receiptNumber || 0) + 1;

    res.json({
      success: true,
      data: {
        invoicePrefix: settings.invoicePrefix || "INV",
        receiptNumber: nextReceiptNumber,
        autoResetReceipt: settings.autoResetReceipt || false
      }
    });
  } catch (error) {
    console.error("Get POS settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.put("/api/settings/pos", authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { invoicePrefix, autoResetReceipt } = req.body;

    console.log('=== UPDATE POS SETTINGS DEBUG ===')
    console.log('Request body:', req.body)
    console.log('invoicePrefix from request:', invoicePrefix)
    console.log('autoResetReceipt from request:', autoResetReceipt)

    const { BusinessSettings } = req.businessModels;
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: "Business settings not found"
      });
    }

    console.log('Settings before update:', {
      invoicePrefix: settings.invoicePrefix,
      receiptPrefix: settings.receiptPrefix,
      receiptNumber: settings.receiptNumber
    })

    // Update POS settings
    settings.invoicePrefix = invoicePrefix || "INV";
    settings.autoResetReceipt = autoResetReceipt || false;

    await settings.save();

    console.log('Settings after update:', {
      invoicePrefix: settings.invoicePrefix,
      receiptPrefix: settings.receiptPrefix,
      receiptNumber: settings.receiptNumber
    })

    res.json({
      success: true,
      data: settings,
      message: "POS settings updated successfully"
    });
  } catch (error) {
    console.error("Update POS settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.post("/api/settings/pos/reset-sequence", authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { BusinessSettings } = req.businessModels;
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: "Business settings not found"
      });
    }

    // Reset receipt number to 0 (so next bill will be 1)
    settings.receiptNumber = 0;
    await settings.save();

    res.json({
      success: true,
      data: { receiptNumber: settings.receiptNumber },
      message: "Receipt sequence reset successfully. Next receipt will be 1."
    });
  } catch (error) {
    console.error("Reset receipt sequence error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// --- PAYMENT SETTINGS API ---
app.get("/api/settings/payment", authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { BusinessSettings } = req.businessModels;
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: "Business settings not found"
      });
    }

    res.json({
      success: true,
      data: {
        currency: settings.currency || "INR",
        taxRate: settings.taxRate || 8.25,
        processingFee: settings.processingFee || 2.9,
        enableCurrency: settings.enableCurrency !== false,
        enableTax: settings.enableTax !== false,
        enableProcessingFees: settings.enableProcessingFees !== false
      }
    });
  } catch (error) {
    console.error("Get payment settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.put("/api/settings/payment", authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { currency, taxRate, processingFee, enableCurrency, enableTax, enableProcessingFees } = req.body;
    const { BusinessSettings } = req.businessModels;

    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: "Business settings not found"
      });
    }

    // Update payment settings
    if (currency !== undefined) settings.currency = currency;
    if (taxRate !== undefined) settings.taxRate = taxRate;
    if (processingFee !== undefined) settings.processingFee = processingFee;
    if (enableCurrency !== undefined) settings.enableCurrency = enableCurrency;
    if (enableTax !== undefined) settings.enableTax = enableTax;
    if (enableProcessingFees !== undefined) settings.enableProcessingFees = enableProcessingFees;

    await settings.save();

    res.json({
      success: true,
      data: settings,
      message: "Payment settings updated successfully"
    });
  } catch (error) {
    console.error("Update payment settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.delete('/api/sales/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { Sale } = req.businessModels;
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cash Registry Routes
// Note: Specific routes must come before parameterized routes
app.get('/api/cash-registry/summary/dashboard', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    console.log('🔍 Cash Registry Summary request for user:', req.user?.email, 'branchId:', req.user?.branchId);
    
    const { CashRegistry, Sale, Expense } = req.businessModels;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's cash registry summary
    const todaySummary = await CashRegistry.findOne({
      date: { $gte: today, $lt: tomorrow },
      shiftType: 'closing'
    });

    // Get total sales for today
    const todaySales = await Sale.find({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const totalSales = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

    // Get total expenses for today
    const todayExpenses = await Expense.find({
      date: { $gte: today, $lt: tomorrow }
    });

    const totalExpenses = todayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    res.json({
      success: true,
      data: {
        todaySummary: todaySummary || null,
        totalSales,
        totalExpenses,
        netCash: totalSales - totalExpenses
      }
    });
  } catch (error) {
    console.error('Error fetching cash registry summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/cash-registry', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { CashRegistry } = req.businessModels;
    const { page = 1, limit = 50, dateFrom, dateTo, shiftType, search } = req.query;
    
    const query = {};
    
    // Date range filtering
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    
    // Shift type filtering
    if (shiftType) {
      query.shiftType = shiftType;
    }
    
    // Search filtering
    if (search) {
      query.$or = [
        { createdBy: { $regex: search, $options: 'i' } },
        { balanceDifferenceReason: { $regex: search, $options: 'i' } },
        { onlineCashDifferenceReason: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1, createdAt: -1 }
    };
    
    const cashRegistries = await CashRegistry.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);
    
    const total = await CashRegistry.countDocuments(query);
    
    res.json({
      success: true,
      data: cashRegistries,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cash registries:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/cash-registry/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { CashRegistry } = req.businessModels;
    const cashRegistry = await CashRegistry.findById(req.params.id);
    if (!cashRegistry) {
      return res.status(404).json({ message: 'Cash registry entry not found' });
    }
    res.json(cashRegistry);
  } catch (error) {
    console.error('Error fetching cash registry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/cash-registry', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { CashRegistry, Sale, Expense } = req.businessModels;
    const {
      date,
      shiftType,
      denominations,
      notes,
      openingBalance,
      closingBalance,
      onlineCash,
      posCash,
      createdBy
    } = req.body;
    
    // Calculate totals from denominations
    const totalBalance = denominations.reduce((sum, denom) => sum + denom.total, 0);
    
    // For opening shift, set opening balance
    // For closing shift, calculate cash flow from other sources
    let cashCollected = 0;
    let expenseValue = 0;
    let cashBalance = 0;
    let balanceDifference = 0;
    let onlinePosDifference = 0;
    
    if (shiftType === 'closing') {
      // Convert date string to Date object and set time ranges
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get cash collected from sales for the date
      const sales = await Sale.find({
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        paymentMode: 'Cash'
      });
      
      cashCollected = sales.reduce((sum, sale) => sum + sale.netTotal, 0);
      
      // Get expenses for the date
      const expenses = await Expense.find({
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        paymentMethod: 'Cash'
      });
      
      expenseValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate cash balance and differences
      cashBalance = openingBalance + cashCollected - expenseValue;
      balanceDifference = closingBalance - cashBalance;
      onlinePosDifference = onlineCash - posCash;
    }
    
    const cashRegistry = new CashRegistry({
      date: new Date(date),
      shiftType,
      createdBy: createdBy || `${req.user.firstName} ${req.user.lastName}`.trim() || req.user.email,
      userId: req.user.id,
      branchId: req.user.branchId,
      denominations,
      openingBalance: shiftType === 'opening' ? totalBalance : openingBalance,
      closingBalance: shiftType === 'closing' ? totalBalance : 0,
      cashCollected,
      expenseValue,
      cashBalance,
      balanceDifference,
      balanceDifferenceReason: balanceDifference !== 0 ? 'Manual adjustment required' : 'Balanced',
      onlineCash: shiftType === 'closing' ? onlineCash : 0,
      posCash: shiftType === 'closing' ? posCash : 0,
      onlinePosDifference,
      onlineCashDifferenceReason: onlinePosDifference !== 0 ? 'Difference detected' : 'Balanced',
      notes,
      branchId: req.user.branchId
    });
    
    await cashRegistry.save();
    res.status(201).json({
      success: true,
      data: cashRegistry,
      message: 'Cash registry entry created successfully'
    });
  } catch (error) {
    console.error('Error creating cash registry:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error
    });
  }
});

app.put('/api/cash-registry/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const {
      denominations,
      notes,
      closingBalance,
      onlineCash,
      posCash,
      balanceDifferenceReason,
      onlineCashDifferenceReason
    } = req.body;
    const { CashRegistry } = req.businessModels;
    
    const cashRegistry = await CashRegistry.findById(req.params.id);
    if (!cashRegistry) {
      return res.status(404).json({ message: 'Cash registry entry not found' });
    }
    
    // Only allow updates to certain fields
    const updates = {
      denominations,
      notes,
      balanceDifferenceReason,
      onlineCashDifferenceReason
    };
    
    if (cashRegistry.shiftType === 'closing') {
      updates.closingBalance = closingBalance;
      updates.onlineCash = onlineCash;
      updates.posCash = posCash;
      
      // Recalculate differences
      const cashBalance = cashRegistry.openingBalance + cashRegistry.cashCollected - cashRegistry.expenseValue;
      updates.cashBalance = cashBalance;
      updates.balanceDifference = closingBalance - cashBalance;
      updates.onlinePosDifference = onlineCash - posCash;
    }
    
    const updatedCashRegistry = await CashRegistry.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json(updatedCashRegistry);
  } catch (error) {
    console.error('Error updating cash registry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/cash-registry/:id/verify', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { CashRegistry } = req.businessModels;
    const { verificationNotes, balanceDifferenceReason, onlineCashDifferenceReason } = req.body;
    
    const cashRegistry = await CashRegistry.findById(req.params.id);
    if (!cashRegistry) {
      return res.status(404).json({ message: 'Cash registry entry not found' });
    }
    
    // Check if verification is required
    const hasBalanceDifference = cashRegistry.balanceDifference !== 0;
    const hasOnlinePosDifference = cashRegistry.onlinePosDifference !== 0;
    
    if ((hasBalanceDifference || hasOnlinePosDifference) && !verificationNotes) {
      return res.status(400).json({ 
        message: 'Verification notes are required when there are balance differences' 
      });
    }
    
    // Update verification fields
    const updates = {
      isVerified: true,
      verifiedBy: req.user.firstName && req.user.lastName ? 
        `${req.user.firstName} ${req.user.lastName}`.trim() : 
        req.user.email || 'Unknown User',
      verifiedAt: new Date(),
      verificationNotes,
      status: 'verified'
    };
    
    // Update difference reasons if provided
    if (balanceDifferenceReason) {
      updates.balanceDifferenceReason = balanceDifferenceReason;
    }
    if (onlineCashDifferenceReason) {
      updates.onlineCashDifferenceReason = onlineCashDifferenceReason;
    }
    
    const verifiedCashRegistry = await CashRegistry.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json(verifiedCashRegistry);
  } catch (error) {
    console.error('Error verifying cash registry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/cash-registry/:id', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { CashRegistry } = req.businessModels;
    const cashRegistry = await CashRegistry.findById(req.params.id);
    if (!cashRegistry) {
      return res.status(404).json({ message: 'Cash registry entry not found' });
    }
    
    // Only allow deletion of unverified entries, unless user is admin
    if (cashRegistry.isVerified && req.user.role !== 'admin') {
      return res.status(400).json({ 
        message: 'Cannot delete verified cash registry entries. Only administrators can delete verified entries.' 
      });
    }
    
    await CashRegistry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cash registry entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting cash registry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Commission Profiles API
// Get all commission profiles
app.get('/api/commission-profiles', authenticateToken, setupBusinessDatabase, requireManager, async (req, res) => {
  try {
    // For now, return mock data. In production, this would come from a database
    const commissionProfiles = [
      {
        id: "cp1",
        name: "Product Incentive",
        type: "target_based",
        description: "Commission based on product sales targets",
        calculationInterval: "monthly",
        qualifyingItems: ["Product"],
        includeTax: false,
        cascadingCommission: true,
        targetTiers: [
          { from: 0, to: 5000, calculateBy: "percent", value: 5 },
          { from: 5000, to: 10000, calculateBy: "percent", value: 8 }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system"
      },
      {
        id: "cp2",
        name: "Service Incentive",
        type: "target_based",
        description: "Commission based on service sales targets",
        calculationInterval: "monthly",
        qualifyingItems: ["Service"],
        includeTax: true,
        cascadingCommission: false,
        targetTiers: [
          { from: 0, to: 8000, calculateBy: "percent", value: 7 }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system"
      }
    ];

    res.json({
      success: true,
      data: commissionProfiles
    });
  } catch (error) {
    console.error('Error fetching commission profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission profiles'
    });
  }
});

// Create commission profile
app.post('/api/commission-profiles', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const profileData = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.id
    };

    // In production, save to database
    res.status(201).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error creating commission profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create commission profile'
    });
  }
});

// Update commission profile
app.put('/api/commission-profiles/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // In production, update in database
    res.json({
      success: true,
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error('Error updating commission profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update commission profile'
    });
  }
});

// Delete commission profile
app.delete('/api/commission-profiles/:id', authenticateToken, setupBusinessDatabase, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // In production, delete from database
    res.json({
      success: true,
      message: 'Commission profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting commission profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete commission profile'
    });
  }
});

// Get inventory transactions
app.get('/api/inventory-transactions', authenticateToken, setupBusinessDatabase, async (req, res) => {
  try {
    const { productId, transactionType, startDate, endDate, page = 1, limit = 50 } = req.query;
    const { InventoryTransaction } = req.businessModels;
    
    const filter = {};
    if (productId) filter.productId = productId;
    if (transactionType) filter.transactionType = transactionType;
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    const transactions = await InventoryTransaction.find(filter)
      .populate('productId', 'name sku category')
      .sort({ transactionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await InventoryTransaction.countDocuments(filter);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory transactions'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Salon CRM API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server

app.listen(PORT, async () => {
  console.log(`🚀 Salon CRM Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 API Base: http://localhost:${PORT}/api`);
  await initializeDefaultUsers();
  await initializeBusinessSettings();
  
  // Setup cron job for inactivity checking
  setupInactivityChecker();
});

// Setup inactivity checker cron job
const setupInactivityChecker = () => {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🕐 Running daily inactivity check...');
    const { checkInactiveBusinesses } = require('./inactivity-checker');
    await checkInactiveBusinesses();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  
  console.log('⏰ Inactivity checker scheduled to run daily at 2 AM IST');
}; 