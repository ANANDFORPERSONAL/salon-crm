const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['service', 'product'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  billNo: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  date: { type: Date, required: true },
  // Support for split payments
  paymentMode: { type: String, required: true }, // Can be "Cash", "Card", "Online", or "Cash, Card", etc.
  payments: [{
    mode: { type: String, enum: ['Cash', 'Card', 'Online'], required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  netTotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  grossTotal: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'completed' },
  staffName: { type: String, required: true },
  items: [itemSchema],
}, {
  timestamps: true
});

// Pre-save middleware to handle split payments
saleSchema.pre('save', function(next) {
  // If payments array is provided and has multiple payment types, update paymentMode
  if (this.payments && this.payments.length > 0) {
    const uniqueModes = [...new Set(this.payments.map(p => p.mode))]
    if (uniqueModes.length > 1) {
      this.paymentMode = uniqueModes.join(', ')
    } else if (uniqueModes.length === 1) {
      this.paymentMode = uniqueModes[0]
    }
  }
  next()
})

module.exports = mongoose.model('Sale', saleSchema);