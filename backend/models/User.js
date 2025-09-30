const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true }, // e.g., 'dashboard', 'appointments', 'customers'
  feature: { type: String, required: true }, // e.g., 'view', 'create', 'edit', 'delete'
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
  hourlyRate: { type: Number },
  commissionRate: { type: Number },
  notes: { type: String },
  commissionProfileIds: [{ type: String }], // Array of commission profile IDs
  
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

module.exports = mongoose.model('User', userSchema); 