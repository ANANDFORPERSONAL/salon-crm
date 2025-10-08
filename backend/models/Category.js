const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['product', 'service', 'both'],
    default: 'both'
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
categorySchema.index({ branchId: 1, name: 1 });
categorySchema.index({ branchId: 1, type: 1, isActive: 1 });

// Export both schema and model for flexibility
module.exports = {
  schema: categorySchema,
  model: mongoose.model('Category', categorySchema)
};

