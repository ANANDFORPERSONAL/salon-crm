const mongoose = require('mongoose');

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
    module: { type: String, required: true }, // 'businesses', 'users', 'billing', 'settings'
    actions: [{ type: String }] // ['create', 'read', 'update', 'delete']
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Virtual for full name
adminSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are serialized
adminSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Admin', adminSchema);
