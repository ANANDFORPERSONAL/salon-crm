const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: function() {
      return this.productType !== 'service';
    },
    min: 0,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  supplier: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  taxCategory: {
    type: String,
    enum: ['essential', 'intermediate', 'standard', 'luxury', 'exempt'],
    default: 'standard'
  },
  productType: {
    type: String,
    enum: ['retail', 'service', 'both'],
    default: 'retail'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  }
}, {
  timestamps: true
});

// Export both schema and model for flexibility
module.exports = {
  schema: productSchema,
  model: mongoose.model('Product', productSchema)
}; 