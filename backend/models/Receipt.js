const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  items: [{
    id: String,
    name: String,
    type: {
      type: String,
      enum: ['service', 'product']
    },
    price: Number,
    quantity: Number,
    discount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    staffId: String,
    staffName: String,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tip: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  payments: [{
    type: {
      type: String,
      enum: ['cash', 'card', 'digital'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Receipt', receiptSchema); 