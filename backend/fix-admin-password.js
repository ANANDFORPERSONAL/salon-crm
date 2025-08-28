const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const fixAdminPassword = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@salon.com' });
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    console.log('Current admin user:', {
      email: adminUser.email,
      role: adminUser.role,
      hasLoginAccess: adminUser.hasLoginAccess,
      password: adminUser.password ? 'Set' : 'Not set'
    });

    // Generate new password hash
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    adminUser.password = hashedPassword;
    adminUser.hasLoginAccess = true;
    await adminUser.save();

    console.log('Admin password updated successfully');
    console.log('New password:', newPassword);
    
    // Test the password
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password validation test:', isValid ? 'PASSED' : 'FAILED');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin password:', error);
    process.exit(1);
  }
};

fixAdminPassword();

