const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ease_my_salon_main');
    console.log('MongoDB connected to main database');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Admin Schema
const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'support'], 
    default: 'admin' 
  },
  permissions: [{
    module: { type: String, required: true },
    actions: [{ type: String }]
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);

const createAdmin = async () => {
  try {
    await connectDB();
    
    // Get email and password from command line arguments or use defaults
    const email = process.argv[2] || 'admin@easemysalon.in';
    const password = process.argv[3] || 'Hydrogen@1998';
    const firstName = process.argv[4] || 'Admin';
    const lastName = process.argv[5] || 'User';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log(`⚠️  Admin user with email ${email} already exists`);
      console.log('   If you want to update the password, please use a different script.');
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const admin = new Admin({
      firstName: firstName,
      lastName: lastName,
      email: email.toLowerCase(),
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
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👑 Role: super_admin`);
    console.log('\n🚀 You can now login at: http://localhost:3000/admin/login');
    
  } catch (error) {
    if (error.code === 11000) {
      console.error('❌ Error: Email already exists in the database');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
