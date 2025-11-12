const mongoose = require('mongoose');
const databaseManager = require('./config/database-manager');

// Connect to main database
const connectToMainDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = 'ease_my_salon_main';
    
    await mongoose.connect(`${uri}/${dbName}`);
    console.log(`✅ Connected to main database: ${dbName}`);
    console.log('✅ Connected to main database for inactivity checker');
  } catch (error) {
    console.error('❌ Failed to connect to main database:', error);
    process.exit(1);
  }
};

// Check for inactive businesses
const checkInactiveBusinesses = async () => {
  try {
    console.log('🔍 Checking for inactive businesses...');
    
    // Connect to main database
    await connectToMainDatabase();
    
    // Get models
    const Business = mongoose.model('Business', require('./models/Business').schema);
    const User = mongoose.model('User', require('./models/User').schema);
    
    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Find businesses that are currently active
    const activeBusinesses = await Business.find({ 
      status: 'active' 
    }).populate('owner', 'lastLoginAt');
    
    let inactiveCount = 0;
    
    for (const business of activeBusinesses) {
      // Check if business owner hasn't logged in for 7 days
      if (business.owner && business.owner.lastLoginAt) {
        const lastLogin = new Date(business.owner.lastLoginAt);
        
        if (lastLogin < sevenDaysAgo) {
          // Mark business as inactive
          await Business.findByIdAndUpdate(business._id, {
            status: 'inactive',
            updatedAt: new Date()
          });
          
          console.log(`📉 Business "${business.name}" (${business.code}) marked as inactive - last login: ${lastLogin.toISOString()}`);
          inactiveCount++;
        }
      } else if (business.owner && !business.owner.lastLoginAt) {
        // If owner has never logged in and business was created more than 7 days ago
        const businessCreated = new Date(business.createdAt);
        if (businessCreated < sevenDaysAgo) {
          await Business.findByIdAndUpdate(business._id, {
            status: 'inactive',
            updatedAt: new Date()
          });
          
          console.log(`📉 Business "${business.name}" (${business.code}) marked as inactive - owner never logged in`);
          inactiveCount++;
        }
      }
    }
    
    console.log(`✅ Inactivity check completed. ${inactiveCount} businesses marked as inactive.`);
    
    // Note: Inactive businesses are just indicators and don't need reactivation
    // They will automatically become active when the owner logs in (handled by login endpoint)
    
  } catch (error) {
    console.error('❌ Error checking inactive businesses:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the check
if (require.main === module) {
  checkInactiveBusinesses()
    .then(() => {
      console.log('✅ Inactivity checker completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Inactivity checker failed:', error);
      process.exit(1);
    });
}

module.exports = { checkInactiveBusinesses };
