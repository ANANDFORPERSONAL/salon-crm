const mongoose = require("mongoose");

const businessSettingsSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, default: "Glamour Salon & Spa" },
  email: { type: String, required: true, default: "info@glamoursalon.com" },
  phone: { type: String, required: true, default: "(555) 123-4567" },
  website: { type: String, default: "www.glamoursalon.com" },
  description: { type: String, default: "Premium salon and spa services in the heart of the city" },
  
  // Address Information
  address: { type: String, required: true, default: "123 Beauty Street" },
  city: { type: String, required: true, default: "New York" },
  state: { type: String, required: true, default: "NY" },
  zipCode: { type: String, required: true, default: "10001" },
  
  // Receipt/Invoice Settings
  receiptPrefix: { type: String, default: "INV" },
  invoicePrefix: { type: String, default: "INV" },
  receiptNumber: { type: Number, default: 1 },
  autoIncrementReceipt: { type: Boolean, default: true },
  
  // Payment Settings
  currency: { type: String, default: "INR" },
  taxRate: { type: Number, default: 8.25 },
  processingFee: { type: Number, default: 2.9 },
  enableCurrency: { type: Boolean, default: true },
  enableTax: { type: Boolean, default: true },
  enableProcessingFees: { type: Boolean, default: true },
  
  // Auto Reset Settings
  autoResetReceipt: { type: Boolean, default: false },
  resetFrequency: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  
  // Social Media
  socialMedia: { type: String, default: "@glamoursalon" },
  
  // Branding
  logo: { type: String, default: "" },
  
  // Tax Information
  gstNumber: { type: String, default: "" },
  
  // Multi-tenant support
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Export both schema and model for flexibility
module.exports = {
  schema: businessSettingsSchema,
  model: mongoose.model("BusinessSettings", businessSettingsSchema)
};
