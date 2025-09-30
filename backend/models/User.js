const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: { 
    type: String, 
    required: true,
    enum: [
      'dashboard',
      'appointments',
      'clients',
      'services',
      'products',
      'staff',
      'sales',
      'reports',
      'settings',
      'payment_settings',
      'pos_settings',
      'general_settings'
    ]
  },
  feature: { 
    type: String, 
    required: true,
    enum: ['view', 'create', 'edit', 'delete', 'manage']
  },
  enabled: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: false },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false }, // Made optional
  mobile: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'staff'], 
    default: 'staff' 
  },
  avatar: { type: String, default: '/placeholder.svg?height=32&width=32' },
  
  // Staff-specific fields
  hasLoginAccess: { type: Boolean, default: false },
  allowAppointmentScheduling: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  // Granular permissions
  permissions: [permissionSchema],
  
  // Additional staff info
  specialties: [String],
  salary: { type: Number, default: 0 },
  commissionProfileIds: [{ type: String }], // Array of commission profile IDs
  notes: { type: String },
  
  // Multi-tenant support
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Export both schema and model for flexibility
module.exports = {
  schema: userSchema,
  model: mongoose.model('User', userSchema)
}; 