const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ease_my_salon_main', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Business Settings schema
const businessSettingsSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  website: String,
  description: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  receiptPrefix: String,
  invoicePrefix: String,
  receiptNumber: Number,
  autoIncrementReceipt: Boolean,
  currency: String,
  taxRate: Number,
  processingFee: Number,
  enableCurrency: Boolean,
  enableTax: Boolean,
  enableProcessingFees: Boolean,
  socialMedia: String,
  logo: String,
  gstNumber: String,
  autoResetReceipt: Boolean,
  resetFrequency: String,
  branchId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const BusinessSettings = mongoose.model('BusinessSettings', businessSettingsSchema);

// Sale schema
const saleSchema = new mongoose.Schema({
  billNo: { type: String, unique: true },
  clientId: mongoose.Schema.Types.ObjectId,
  clientName: String,
  items: [{
    name: String,
    type: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  subtotal: Number,
  tax: Number,
  total: Number,
  payments: [{
    type: String,
    amount: Number
  }],
  staffId: mongoose.Schema.Types.ObjectId,
  staffName: String,
  notes: String,
  branchId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const Sale = mongoose.model('Sale', saleSchema);

async function fixReceiptNumber() {
  try {
    console.log('🔍 Checking business settings...');
    
    // Get business settings
    const settings = await BusinessSettings.findOne();
    if (!settings) {
      console.log('❌ No business settings found');
      return;
    }
    
    console.log('📊 Current receipt number:', settings.receiptNumber);
    console.log('📊 Invoice prefix:', settings.invoicePrefix);
    console.log('📊 Receipt prefix:', settings.receiptPrefix);
    
    // Check existing sales
    const existingSales = await Sale.find({}, 'billNo').sort({ billNo: 1 });
    console.log('📋 Existing sales:', existingSales.map(s => s.billNo));
    
    // Find the highest receipt number
    let highestNumber = 0;
    const prefix = settings.invoicePrefix || settings.receiptPrefix || 'INV';
    
    for (const sale of existingSales) {
      if (sale.billNo && sale.billNo.startsWith(prefix + '-')) {
        const numberPart = sale.billNo.replace(prefix + '-', '');
        const number = parseInt(numberPart);
        if (!isNaN(number) && number > highestNumber) {
          highestNumber = number;
        }
      }
    }
    
    console.log('🔢 Highest existing receipt number:', highestNumber);
    
    // Update business settings to use the next number
    const nextNumber = highestNumber + 1;
    settings.receiptNumber = nextNumber;
    await settings.save();
    
    console.log('✅ Updated receipt number to:', nextNumber);
    console.log('✅ Next receipt will be:', `${prefix}-${nextNumber.toString().padStart(6, '0')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixReceiptNumber();
