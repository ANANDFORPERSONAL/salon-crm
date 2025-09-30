const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    lowercase: true
  },
  totalVisits: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  }
}, {
  timestamps: true
});

// Add unique index for phone number
clientSchema.index({ phone: 1 }, { unique: true });

// Export both schema and model for flexibility
module.exports = {
  schema: clientSchema,
  model: mongoose.model('Client', clientSchema)
}; 