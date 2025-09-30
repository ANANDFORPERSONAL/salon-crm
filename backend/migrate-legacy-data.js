const mongoose = require('mongoose');
const Client = require('./models/Client');
const Appointment = require('./models/Appointment');
const Sale = require('./models/Sale');
const Receipt = require('./models/Receipt');
const Product = require('./models/Product');
const Service = require('./models/Service');
const Staff = require('./models/Staff');
const Expense = require('./models/Expense');
const CashRegistry = require('./models/CashRegistry');
const Business = require('./models/Business');
require('dotenv').config();

const migrateLegacyData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-crm');
    console.log('Connected to MongoDB');

    // Get the first business (or create a default one)
    let defaultBusiness = await Business.findOne();
    if (!defaultBusiness) {
      console.log('No business found. Creating a default business for legacy data...');
      defaultBusiness = new Business({
        name: 'Legacy Data Business',
        code: 'LEGACY',
        businessType: 'salon',
        address: {
          street: 'Legacy Street',
          city: 'Legacy City',
          state: 'Legacy State',
          zipCode: '00000',
          country: 'India'
        },
        contact: {
          phone: '0000000000',
          email: 'legacy@example.com'
        },
        settings: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          taxRate: 18
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          startDate: new Date(),
          maxUsers: 5,
          maxBranches: 1
        },
        owner: null, // Will be set later
        status: 'active'
      });
      await defaultBusiness.save();
      console.log('Created default business for legacy data');
    }

    const businessId = defaultBusiness._id;
    console.log(`Migrating legacy data to business: ${defaultBusiness.name} (${businessId})`);

    // Migrate Clients
    const clientsWithoutBranch = await Client.find({ 
      $or: [
        { branchId: { $exists: false } },
        { branchId: null }
      ]
    });
    if (clientsWithoutBranch.length > 0) {
      await Client.updateMany(
        { 
          $or: [
            { branchId: { $exists: false } },
            { branchId: null }
          ]
        },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${clientsWithoutBranch.length} clients to business ${businessId}`);
    }

    // Migrate Appointments
    const appointmentsWithoutBranch = await Appointment.find({ 
      $or: [
        { branchId: { $exists: false } },
        { branchId: null }
      ]
    });
    if (appointmentsWithoutBranch.length > 0) {
      await Appointment.updateMany(
        { 
          $or: [
            { branchId: { $exists: false } },
            { branchId: null }
          ]
        },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${appointmentsWithoutBranch.length} appointments to business ${businessId}`);
    }

    // Migrate Sales
    const salesWithoutBranch = await Sale.find({ 
      $or: [
        { branchId: { $exists: false } },
        { branchId: null }
      ]
    });
    if (salesWithoutBranch.length > 0) {
      await Sale.updateMany(
        { 
          $or: [
            { branchId: { $exists: false } },
            { branchId: null }
          ]
        },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${salesWithoutBranch.length} sales to business ${businessId}`);
    }

    // Migrate Receipts
    const receiptsWithoutBranch = await Receipt.find({ branchId: { $exists: false } });
    if (receiptsWithoutBranch.length > 0) {
      await Receipt.updateMany(
        { branchId: { $exists: false } },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${receiptsWithoutBranch.length} receipts to business ${businessId}`);
    }

    // Migrate Products
    const productsWithoutBranch = await Product.find({ branchId: { $exists: false } });
    if (productsWithoutBranch.length > 0) {
      await Product.updateMany(
        { branchId: { $exists: false } },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${productsWithoutBranch.length} products to business ${businessId}`);
    }

    // Migrate Services
    const servicesWithoutBranch = await Service.find({ branchId: { $exists: false } });
    if (servicesWithoutBranch.length > 0) {
      await Service.updateMany(
        { branchId: { $exists: false } },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${servicesWithoutBranch.length} services to business ${businessId}`);
    }

    // Migrate Staff
    const staffWithoutBranch = await Staff.find({ branchId: { $exists: false } });
    if (staffWithoutBranch.length > 0) {
      await Staff.updateMany(
        { branchId: { $exists: false } },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${staffWithoutBranch.length} staff to business ${businessId}`);
    }

    // Migrate Expenses
    const expensesWithoutBranch = await Expense.find({ branchId: { $exists: false } });
    if (expensesWithoutBranch.length > 0) {
      await Expense.updateMany(
        { branchId: { $exists: false } },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${expensesWithoutBranch.length} expenses to business ${businessId}`);
    }

    // Migrate Cash Registry
    const cashRegistryWithoutBranch = await CashRegistry.find({ branchId: { $exists: false } });
    if (cashRegistryWithoutBranch.length > 0) {
      await CashRegistry.updateMany(
        { branchId: { $exists: false } },
        { $set: { branchId: businessId } }
      );
      console.log(`✅ Migrated ${cashRegistryWithoutBranch.length} cash registry entries to business ${businessId}`);
    }

    console.log('🎉 Legacy data migration completed successfully!');
    console.log(`All legacy data has been assigned to business: ${defaultBusiness.name} (${businessId})`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migrateLegacyData();
