const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    required: true
  },
  specialties: [{
    type: String
  }],
  salary: {
    type: Number,
    default: 0,
    min: 0
  },
  commissionProfileIds: [{
    type: String
  }],
  password: {
    type: String
  },
  notes: {
    type: String,
    default: ''
  },
  hasLoginAccess: {
    type: Boolean,
    default: false
  },
  allowAppointmentScheduling: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  consentPreferences: {
    type: {
      necessary: { type: Boolean, default: true },
      analytics: { type: Boolean, default: false },
      functional: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
      dataProcessing: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false }
    },
    default: null
  },
  consentUpdatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Export both schema and model for flexibility
module.exports = {
  schema: staffSchema,
  model: mongoose.model('Staff', staffSchema)
}; 