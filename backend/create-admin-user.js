const databaseManager = require('./config/database-manager');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    // Connect to main database
    const mainConnection = await databaseManager.getMainConnection();
    const Admin = mainConnection.model('Admin', require('./models/Admin').schema);
    console.log('Connected to main database');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@saloncrm.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      mainConnection.close();
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
    process.exit(0);
  }
};

createDefaultAdmin();
