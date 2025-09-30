const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-crm');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@saloncrm.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new Admin({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@saloncrm.com',
      password: hashedPassword,
      role: 'super_admin',
      permissions: [
        { module: 'businesses', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'billing', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'settings', actions: ['create', 'read', 'update', 'delete'] }
      ],
      isActive: true
    });

    await admin.save();
    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email: admin@saloncrm.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 Admin Dashboard: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createDefaultAdmin();
