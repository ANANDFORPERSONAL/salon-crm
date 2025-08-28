const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@salon.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@salon.com',
      password: hashedPassword,
      mobile: '+1234567890',
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
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@salon.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();

