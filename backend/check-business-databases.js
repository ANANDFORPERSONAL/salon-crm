const mongoose = require('mongoose');
const databaseManager = require('./config/database-manager');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get all businesses from main database
const getBusinesses = async () => {
  try {
    const mainConnection = await databaseManager.getMainConnection();
    const Business = mainConnection.model('Business', require('./models/Business').schema);
    
    const businesses = await Business.find({}, '_id name code status createdAt').sort({ createdAt: -1 });
    return businesses;
  } catch (error) {
    console.error('❌ Error fetching businesses:', error);
    return [];
  }
};

// Check business-specific database
const checkBusinessDatabase = async (businessId, businessName, businessCode) => {
  try {
    const businessConnection = await databaseManager.getConnection(businessId);
    
    console.log(`\n📊 Database: salon_crm_${businessId}`);
    console.log(`   Business: ${businessName} (${businessCode})`);
    
    // Check if database exists and has collections
    try {
      const collections = await businessConnection.db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      console.log(`   Collections: ${collectionNames.length}`);
      
      if (collectionNames.length === 0) {
        console.log('   ⚠️  No collections found (empty database)');
        return;
      }
      
      // Check each collection for document count
      for (const collectionName of collectionNames) {
        try {
          const count = await businessConnection.db.collection(collectionName).countDocuments();
          console.log(`   📄 ${collectionName}: ${count} documents`);
          
          // Show sample documents for key collections
          if (['clients', 'appointments', 'sales', 'products', 'services'].includes(collectionName) && count > 0) {
            const sample = await businessConnection.db.collection(collectionName).findOne();
            if (sample) {
              const sampleKeys = Object.keys(sample).slice(0, 5); // First 5 keys
              console.log(`      Sample fields: ${sampleKeys.join(', ')}`);
            }
          }
        } catch (err) {
          console.log(`   ❌ Error checking ${collectionName}: ${err.message}`);
        }
      }
    } catch (dbError) {
      console.log(`   ⚠️  Database may not exist or is empty: ${dbError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Error checking database for ${businessName}:`, error.message);
  }
};

// Main function
const checkAllBusinessDatabases = async () => {
  console.log('🔍 Checking all business databases...\n');
  
  await connectDB();
  
  const businesses = await getBusinesses();
  
  if (businesses.length === 0) {
    console.log('❌ No businesses found');
    return;
  }
  
  console.log(`📋 Found ${businesses.length} businesses:`);
  businesses.forEach((business, index) => {
    console.log(`   ${index + 1}. ${business.name} (${business.code}) - ${business.status}`);
  });
  
  // Check each business database
  for (const business of businesses) {
    await checkBusinessDatabase(business._id, business.name, business.code);
  }
  
  console.log('\n✅ Database check completed');
  
  // Close connections
  await databaseManager.closeAllConnections();
  await mongoose.disconnect();
};

// Run the check
checkAllBusinessDatabases().catch(console.error);
