const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  code: { type: String, unique: true }, // Generated unique code
  businessType: { 
    type: String, 
    enum: ['salon', 'spa', 'barbershop', 'beauty_clinic'], 
    default: 'salon' 
  },
  
  // Contact Information
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String }
  },
  
  // Business Settings (from existing settings)
  settings: {
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeFormat: { type: String, default: '12' }, // 12 or 24 hour
    taxRate: { type: Number, default: 18 },
    gstNumber: { type: String },
    businessLicense: { type: String },
    
    // Operating Hours
    operatingHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean }
    },
    
    // Appointment Settings
    appointmentSettings: {
      slotDuration: { type: Number, default: 30 }, // minutes
      advanceBookingDays: { type: Number, default: 30 },
      bufferTime: { type: Number, default: 15 }, // minutes
      allowOnlineBooking: { type: Boolean, default: false }
    },
    
    // Notification Settings
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      appointmentReminders: { type: Boolean, default: true },
      paymentConfirmations: { type: Boolean, default: true }
    },
    
    // Branding
    branding: {
      logo: { type: String },
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#1E40AF' },
      fontFamily: { type: String, default: 'Inter' }
    }
  },
  
  // Subscription Information
  subscription: {
    plan: { 
      type: String, 
      enum: ['basic', 'premium', 'enterprise'], 
      default: 'basic' 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'suspended', 'cancelled'], 
      default: 'active' 
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    maxUsers: { type: Number, default: 5 },
    maxBranches: { type: Number, default: 1 },
    features: [{ type: String }] // Available features for this plan
  },
  
  // Owner Information
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Status and Metadata
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  isOnboarded: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate unique business code
businessSchema.pre('save', async function(next) {
  if (!this.code) {
    const count = await mongoose.model('Business').countDocuments();
    this.code = `BIZ${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Business', businessSchema);
