const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['service', 'product'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const paymentHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['Cash', 'Card', 'Online', 'UPI', 'Bank Transfer'], required: true },
  notes: { type: String, default: '' },
  collectedBy: { type: String, default: '' }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  billNo: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  date: { type: Date, required: true },
  
  // Enhanced payment status system
  status: { 
    type: String, 
    enum: ['completed', 'pending', 'partial', 'unpaid', 'overdue', 'cancelled'], 
    default: 'unpaid' 
  },
  
  // Payment tracking
  paymentStatus: {
    totalAmount: { type: Number, required: true },      // Total bill amount
    paidAmount: { type: Number, default: 0 },          // Amount collected so far
    remainingAmount: { type: Number, default: 0 },     // Still owed
    dueDate: { type: Date, default: Date.now },        // When payment is due
    lastPaymentDate: { type: Date },                   // When last payment was made
    isOverdue: { type: Boolean, default: false }       // Payment overdue flag
  },
  
  // Support for split payments (legacy and enhanced)
  paymentMode: { type: String, required: true }, // Can be "Cash", "Card", "Online", or "Cash, Card", etc.
  payments: [{
    mode: { type: String, enum: ['Cash', 'Card', 'Online', 'UPI', 'Bank Transfer'], required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  
  // Payment history for tracking all payments made
  paymentHistory: [paymentHistorySchema],
  
  // Bill details
  netTotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  grossTotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  
  staffName: { type: String, required: true },
  items: [itemSchema],
  
  // Additional fields
  notes: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  customerEmail: { type: String, default: '' }
}, {
  timestamps: true
});

// Pre-save middleware to handle payment status calculations
saleSchema.pre('save', function(next) {
  // Calculate remaining amount
  this.paymentStatus.remainingAmount = this.paymentStatus.totalAmount - this.paymentStatus.paidAmount;
  
  // Update status based on payment amount
  if (this.paymentStatus.paidAmount >= this.paymentStatus.totalAmount) {
    this.status = 'completed';
  } else if (this.paymentStatus.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }
  
  // Check if overdue
  if (this.paymentStatus.dueDate && new Date() > this.paymentStatus.dueDate && this.status !== 'completed') {
    this.status = 'overdue';
    this.paymentStatus.isOverdue = true;
  }
  
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
});

// Method to add a payment
saleSchema.methods.addPayment = function(paymentData) {
  this.paymentHistory.push(paymentData);
  this.paymentStatus.paidAmount += paymentData.amount;
  this.paymentStatus.lastPaymentDate = new Date();
  
  // Update status
  if (this.paymentStatus.paidAmount >= this.paymentStatus.totalAmount) {
    this.status = 'completed';
  } else if (this.paymentStatus.paidAmount > 0) {
    this.status = 'partial';
  }
  
  return this.save();
};

// Method to calculate payment summary
saleSchema.methods.getPaymentSummary = function() {
  return {
    totalAmount: this.paymentStatus.totalAmount,
    paidAmount: this.paymentStatus.paidAmount,
    remainingAmount: this.paymentStatus.remainingAmount,
    status: this.status,
    isOverdue: this.paymentStatus.isOverdue,
    dueDate: this.paymentStatus.dueDate
  };
};

module.exports = mongoose.model('Sale', saleSchema);