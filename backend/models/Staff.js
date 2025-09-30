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
  }
}, {
  timestamps: true
});

// Export both schema and model for flexibility
module.exports = {
  schema: staffSchema,
  model: mongoose.model('Staff', staffSchema)
}; 