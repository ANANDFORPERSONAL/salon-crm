const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('./config/database');

// Import Models
const User = require('./models/User');
const Service = require('./models/Service');
const Product = require('./models/Product');
const Staff = require('./models/Staff');
const Client = require('./models/Client');
const Appointment = require('./models/Appointment');
const Receipt = require('./models/Receipt');
const Sale = require('./models/Sale');
const Expense = require('./models/Expense');
const CashRegistry = require('./models/CashRegistry');
const BusinessSettings = require("./models/BusinessSettings");

// Import Routes
const cashRegistryRoutes = require('./routes/cashRegistry');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(morgan('combined'));
app.use(express.json());

// Handle CORS preflight for all routes
app.options('*', cors());

// Register Routes
app.use('/api/cash-registry', cashRegistryRoutes);

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
// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  // Check if this is a mock token (for development)
  if (token.startsWith('mock-token-')) {
    console.log('🔑 Mock token detected in server.js, bypassing JWT verification for development');
    
    // Extract user info from mock token
    const mockUserParts = token.split('-');
    if (mockUserParts.length >= 3) {
      const mockUserId = mockUserParts[2];
      
      // Create a mock user object for development with valid ObjectId
      const mockObjectId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      req.user = {
        _id: mockObjectId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        id: mockObjectId
      };
      
      console.log('👤 Mock user created in server.js:', req.user);
      return next();
    }
  }

  // Regular JWT verification for production tokens
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Specific role middleware
const requireAdmin = authorizeRoles('admin');
const requireManager = authorizeRoles('admin', 'manager');
const requireStaff = authorizeRoles('admin', 'manager', 'staff');

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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

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

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    // Check if this is a mock user (for development)
    if (req.user._id && req.user.name === 'Admin User') {
      // Return mock user data directly
      res.json({
        success: true,
        data: {
          _id: req.user._id,
          firstName: 'Admin',
          lastName: 'User',
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          avatar: '/placeholder.svg?height=32&width=32'
        }
      });
      return;
    }

    // Regular user lookup from database
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

// User Management routes (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      mobile,
      hasLoginAccess = false,
      allowAppointmentScheduling = false,
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

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      mobile,
      hasLoginAccess,
      allowAppointmentScheduling,
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
      hasLoginAccess,
      allowAppointmentScheduling,
      role: req.body.role, // Include role in update
    };

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

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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
app.get('/api/users/:id/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
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
app.put('/api/users/:id/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;

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
app.post('/api/users/:id/change-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

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
app.post('/api/users/:id/verify-admin-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;

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
app.get('/api/clients', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

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

    const totalClients = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

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

app.get('/api/clients/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      const clients = await Client.find().sort({ createdAt: -1 });
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

app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
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

app.post('/api/clients', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone are required'
      });
    }

    // Check for duplicate phone number
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
      totalSpent: 0
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

app.put('/api/clients/:id', authenticateToken, requireManager, async (req, res) => {
  try {
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

app.delete('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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
app.get('/api/services', authenticateToken, requireStaff, async (req, res) => {
  try {
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

app.post('/api/services', authenticateToken, requireManager, async (req, res) => {
  try {
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

app.put('/api/services/:id', authenticateToken, requireManager, async (req, res) => {
  try {
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

app.delete('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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
app.get('/api/products', authenticateToken, requireStaff, async (req, res) => {
  try {
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

app.post('/api/products', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, category, price, stock, sku, supplier, description } = req.body;

    if (!name || !category || !price || !stock) {
      return res.status(400).json({
        success: false,
        error: 'Name, category, price, and stock are required'
      });
    }

    const newProduct = new Product({
      name,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      sku: sku || `SKU-${Date.now()}`,
      supplier,
      description,
      isActive: true,
    });

    const savedProduct = await newProduct.save();

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

app.put('/api/products/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, category, price, stock, sku, supplier, description, isActive } = req.body;

    if (!name || !category || !price || !stock) {
      return res.status(400).json({
        success: false,
        error: 'Name, category, price, and stock are required'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        sku: sku || `SKU-${Date.now()}`,
        supplier,
        description,
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

app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

// Update product stock
app.patch('/api/products/:id/stock', authenticateToken, requireStaff, async (req, res) => {
  try {
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
app.get('/api/staff', authenticateToken, requireManager, async (req, res) => {
  try {
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

app.post('/api/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role, specialties, hourlyRate, commissionRate, notes, isActive } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, phone, and role are required'
      });
    }

    const newStaff = new Staff({
      name,
      email,
      phone,
      role,
      specialties: specialties || [],
      hourlyRate: parseFloat(hourlyRate) || 0,
      commissionRate: parseFloat(commissionRate) || 0,
      notes: notes || '',
      isActive: isActive !== undefined ? isActive : true,
    });

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

app.put('/api/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role, specialties, hourlyRate, commissionRate, notes, isActive } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, phone, and role are required'
      });
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        role,
        specialties: specialties || [],
        hourlyRate: parseFloat(hourlyRate) || 0,
        commissionRate: parseFloat(commissionRate) || 0,
        notes: notes || '',
        isActive: isActive !== undefined ? isActive : true,
      },
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

app.delete('/api/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
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

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
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
        staffId: service.staffId,
        date,
        time,
        duration: service.duration,
        status,
        notes,
        price: service.price
      };

      const newAppointment = new Appointment(appointmentData);
      const savedAppointment = await newAppointment.save();
      
      // Populate the saved appointment with related data
      const populatedAppointment = await Appointment.findById(savedAppointment._id)
        .populate('clientId', 'name phone email')
        .populate('serviceId', 'name price duration')
        .populate('staffId', 'name role');

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
app.get('/api/receipts', authenticateToken, async (req, res) => {
  try {
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

app.post('/api/receipts', authenticateToken, async (req, res) => {
  try {
    const { clientId, staffId, items, subtotal, tip, discount, tax, total, payments, notes } = req.body;

    if (!clientId || !staffId || !items || !total) {
      return res.status(400).json({
        success: false,
        error: 'Client, staff, items, and total are required'
      });
    }

    const newReceipt = new Receipt({
      receiptNumber: `RCP-${Date.now()}`,
      clientId,
      staffId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      items,
      subtotal: parseFloat(subtotal) || 0,
      tip: parseFloat(tip) || 0,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      total: parseFloat(total),
      payments: payments || [],
      notes,
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

// Get receipts by client ID
app.get('/api/receipts/client/:clientId', authenticateToken, async (req, res) => {
  const { clientId } = req.params;
  
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
app.get('/api/reports/dashboard', authenticateToken, requireManager, async (req, res) => {
  try {
    console.log('Dashboard stats requested');
    
    // Get counts from database
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
app.get('/api/sales', authenticateToken, requireManager, async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sales', authenticateToken, requireStaff, async (req, res) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/sales/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/sales/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get sales by client name
app.get('/api/sales/client/:clientName', authenticateToken, async (req, res) => {
  try {
    const { clientName } = req.params;
    
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
app.get('/api/sales/bill/:billNo', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findOne({ billNo: req.params.billNo });
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add payment to a sale
app.post('/api/sales/:id/payment', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, notes, collectedBy } = req.body;
    
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
app.get('/api/sales/:id/payment-summary', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
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
app.get('/api/sales/unpaid/overdue', authenticateToken, requireManager, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
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
app.get('/api/expenses', authenticateToken, requireManager, async (req, res) => {
  try {
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

app.post('/api/expenses', authenticateToken, requireStaff, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const expense = new Expense(expenseData);
    await expense.save();
    
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/expenses/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/expenses/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- BUSINESS SETTINGS API ---
app.get("/api/settings/business", authenticateToken, async (req, res) => {
  try {
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
        currency: "USD",
        taxRate: 8.25,
        processingFee: 2.9,
        enableCurrency: true,
        enableTax: true,
        enableProcessingFees: true,
        socialMedia: "@glamoursalon"
      });
      await settings.save();
    }

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

app.put("/api/settings/business", authenticateToken, async (req, res) => {
  try {
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
      socialMedia
    } = req.body;

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

    await settings.save();

    res.json({
      success: true,
      data: settings,
      message: "Business settings updated successfully"
    });
  } catch (error) {
    console.error("Update business settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// API to increment receipt number
app.post("/api/settings/business/increment-receipt", authenticateToken, async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: "Business settings not found"
      });
    }

    // Increment receipt number
    settings.receiptNumber = (settings.receiptNumber || 0) + 1;
    await settings.save();

    res.json({
      success: true,
      data: { receiptNumber: settings.receiptNumber },
      message: "Receipt number incremented successfully"
    });
  } catch (error) {
    console.error("Increment receipt number error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// POS Settings API
app.get("/api/settings/pos", authenticateToken, async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: {
        invoicePrefix: settings.invoicePrefix || "INV",
        receiptNumber: settings.receiptNumber || 1,
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

app.put("/api/settings/pos", authenticateToken, async (req, res) => {
  try {
    const { invoicePrefix, autoResetReceipt } = req.body;

    console.log('=== UPDATE POS SETTINGS DEBUG ===')
    console.log('Request body:', req.body)
    console.log('invoicePrefix from request:', invoicePrefix)
    console.log('autoResetReceipt from request:', autoResetReceipt)

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

app.post("/api/settings/pos/reset-sequence", authenticateToken, async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: "Business settings not found"
      });
    }

    // Reset receipt number to 1
    settings.receiptNumber = 1;
    await settings.save();

    res.json({
      success: true,
      data: { receiptNumber: settings.receiptNumber },
      message: "Receipt sequence reset to 1 successfully"
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
app.get("/api/settings/payment", authenticateToken, async (req, res) => {
  try {
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

app.put("/api/settings/payment", authenticateToken, async (req, res) => {
  try {
    const { currency, taxRate, processingFee, enableCurrency, enableTax, enableProcessingFees } = req.body;

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

app.delete('/api/sales/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cash Registry Routes
app.get('/api/cash-registry', authenticateToken, async (req, res) => {
  try {
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
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/cash-registry/:id', authenticateToken, async (req, res) => {
  try {
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

app.post('/api/cash-registry', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      shiftType,
      denominations,
      notes,
      openingBalance,
      closingBalance,
      onlineCash,
      posCash
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
      createdBy: req.user.name,
      userId: req.user.id,
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
      notes
    });
    
    await cashRegistry.save();
    res.status(201).json(cashRegistry);
  } catch (error) {
    console.error('Error creating cash registry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/cash-registry/:id', authenticateToken, async (req, res) => {
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

app.post('/api/cash-registry/:id/verify', authenticateToken, async (req, res) => {
  try {
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
      verifiedBy: req.user.name,
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

app.delete('/api/cash-registry/:id', authenticateToken, async (req, res) => {
  try {
    const cashRegistry = await CashRegistry.findById(req.params.id);
    if (!cashRegistry) {
      return res.status(404).json({ message: 'Cash registry entry not found' });
    }
    
    // Only allow deletion of unverified entries
    if (cashRegistry.isVerified) {
      return res.status(400).json({ 
        message: 'Cannot delete verified cash registry entries' 
      });
    }
    
    await CashRegistry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cash registry entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting cash registry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/cash-registry/summary/dashboard', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's opening and closing entries
    const todayEntries = await CashRegistry.find({
      date: { $gte: today, $lt: tomorrow }
    }).sort({ shiftType: 1 });
    
    // Get cash flow data for today
    const todaySales = await Sale.find({
      date: { $gte: today, $lt: tomorrow },
      paymentMode: 'Cash'
    });
    
    const todayExpenses = await Expense.find({
      date: { $gte: today, $lt: tomorrow },
      paymentMethod: 'Cash'
    });
    
    const totalCashCollected = todaySales.reduce((sum, sale) => sum + sale.netTotal, 0);
    const totalExpenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate expected cash balance
    const openingEntry = todayEntries.find(entry => entry.shiftType === 'opening');
    const closingEntry = todayEntries.find(entry => entry.shiftType === 'closing');
    
    const openingBalance = openingEntry ? openingEntry.openingBalance : 0;
    const expectedCashBalance = openingBalance + totalCashCollected - totalExpenses;
    const actualClosingBalance = closingEntry ? closingEntry.closingBalance : 0;
    
    res.json({
      todayEntries: todayEntries.length,
      openingBalance,
      cashCollected: totalCashCollected,
      expenses: totalExpenses,
      expectedCashBalance,
      actualClosingBalance,
      balanceDifference: actualClosingBalance - expectedCashBalance,
      hasOpeningShift: !!openingEntry,
      hasClosingShift: !!closingEntry
    });
  } catch (error) {
    console.error('Error fetching cash registry summary:', error);
    res.status(500).json({ message: 'Internal server error' });
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
}); 