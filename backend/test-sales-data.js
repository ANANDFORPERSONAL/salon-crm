const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import Sale model
const Sale = require('./backend/models/Sale');

// Sample sales data
const sampleSales = [
  {
    billNo: 'BILL001',
    customerName: 'Shivam Kumar',
    date: new Date('2025-08-25'),
    paymentMode: 'Cash',
    payments: [{ mode: 'Cash', amount: 2500 }],
    netTotal: 2500,
    taxAmount: 125,
    grossTotal: 2625,
    status: 'completed',
    staffName: 'Admin User',
    items: [
      {
        name: 'Hair Cut & Style',
        type: 'service',
        quantity: 1,
        price: 1500,
        total: 1500
      },
      {
        name: 'Hair Color',
        type: 'service',
        quantity: 1,
        price: 1000,
        total: 1000
      }
    ]
  },
  {
    billNo: 'BILL002',
    customerName: 'Shivam Kumar',
    date: new Date('2025-08-20'),
    paymentMode: 'Card',
    payments: [{ mode: 'Card', amount: 1800 }],
    netTotal: 1800,
    taxAmount: 90,
    grossTotal: 1890,
    status: 'completed',
    staffName: 'Admin User',
    items: [
      {
        name: 'Facial Treatment',
        type: 'service',
        quantity: 1,
        price: 1800,
        total: 1800
      }
    ]
  },
  {
    billNo: 'BILL003',
    customerName: 'Shivam Kumar',
    date: new Date('2025-08-15'),
    paymentMode: 'Online',
    payments: [{ mode: 'Online', amount: 3200 }],
    netTotal: 3200,
    taxAmount: 160,
    grossTotal: 3360,
    status: 'completed',
    staffName: 'Admin User',
    items: [
      {
        name: 'Hair Treatment',
        type: 'service',
        quantity: 1,
        price: 2000,
        total: 2000
      },
      {
        name: 'Hair Oil',
        type: 'product',
        quantity: 2,
        price: 600,
        total: 1200
      }
    ]
  },
  {
    billNo: 'BILL004',
    customerName: 'surya raj',
    date: new Date('2025-08-22'),
    paymentMode: 'Cash',
    payments: [{ mode: 'Cash', amount: 1200 }],
    netTotal: 1200,
    taxAmount: 60,
    grossTotal: 1260,
    status: 'completed',
    staffName: 'Admin User',
    items: [
      {
        name: 'Hair Cut',
        type: 'service',
        quantity: 1,
        price: 1200,
        total: 1200
      }
    ]
  },
  {
    billNo: 'BILL005',
    customerName: 'Test Client',
    date: new Date('2025-08-18'),
    paymentMode: 'Card',
    payments: [{ mode: 'Card', amount: 800 }],
    netTotal: 800,
    taxAmount: 40,
    grossTotal: 840,
    status: 'completed',
    staffName: 'Admin User',
    items: [
      {
        name: 'Beard Trim',
        type: 'service',
        quantity: 1,
        price: 800,
        total: 800
      }
    ]
  }
];

async function createSampleSales() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connection.asPromise();
    console.log('Connected to MongoDB');

    // Clear existing sales
    await Sale.deleteMany({});
    console.log('Cleared existing sales');

    // Insert sample sales
    const createdSales = await Sale.insertMany(sampleSales);
    console.log(`Created ${createdSales.length} sample sales`);

    // Display created sales
    console.log('\nCreated Sales:');
    createdSales.forEach(sale => {
      console.log(`- ${sale.billNo}: ${sale.customerName} - ₹${sale.grossTotal} (${sale.date.toDateString()})`);
    });

    console.log('\n✅ Sample sales data created successfully!');
    console.log('Now you can test the Bill Activity functionality in the Clients table.');

  } catch (error) {
    console.error('Error creating sample sales:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

createSampleSales();
