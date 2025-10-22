const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// You need to replace this with your Railway MongoDB URI
const PRODUCTION_MONGODB_URI = process.env.MONGODB_URI || 'YOUR_RAILWAY_MONGODB_URI_HERE';

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Parse the URI to add database name properly
    let uri = PRODUCTION_MONGODB_URI;
    if (!uri.includes('?')) {
      uri = `${uri}/salon_crm_main`;
    } else {
      uri = uri.replace('?', '/salon_crm_main?');
    }
    
    await mongoose.connect(uri, {
      authSource: 'admin'
    });
    console.log('✅ MongoDB connected to production main database');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
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
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@salon.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email: admin@salon.com');
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const admin = new Admin({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@salon.com',
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
    console.log('📧 Email: admin@salon.com');
    console.log('🔑 Password: admin123');
    console.log('\n🚀 You can now login at: https://salon-crm-production.up.railway.app/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();

