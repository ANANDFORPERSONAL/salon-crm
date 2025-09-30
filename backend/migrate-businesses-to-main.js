const databaseManager = require('./config/database-manager');
const mongoose = require('mongoose');
require('dotenv').config();

const migrateBusinesses = async () => {
  try {
    console.log('🔄 Starting business migration...');
    
    // Connect to main database
    const mainConnection = await databaseManager.getMainConnection();
    const MainBusiness = mainConnection.model('Business', require('./models/Business').schema);
    const MainUser = mainConnection.model('User', require('./models/User').schema);
    
    // Connect to default database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-crm');
    const DefaultBusiness = mongoose.model('Business', require('./models/Business').schema);
    const DefaultUser = mongoose.model('User', require('./models/User').schema);
    
    console.log('✅ Connected to both databases');
    
    // Get all businesses from default database
    const defaultBusinesses = await DefaultBusiness.find({});
    console.log(`📊 Found ${defaultBusinesses.length} businesses in default database`);
    
    for (const business of defaultBusinesses) {
      console.log(`🔄 Migrating business: ${business.name} (${business.code})`);
      
      // Check if business already exists in main database
      const existingBusiness = await MainBusiness.findOne({ code: business.code });
      if (existingBusiness) {
        console.log(`⚠️  Business ${business.name} already exists in main database, skipping...`);
        continue;
      }
      
      // Find the owner in main database
      let ownerId = null;
      if (business.owner) {
        const owner = await MainUser.findOne({ email: business.owner.email });
        if (owner) {
          ownerId = owner._id;
          console.log(`👤 Found owner: ${owner.firstName} ${owner.lastName}`);
        } else {
          console.log(`⚠️  Owner not found in main database for business: ${business.name}, creating placeholder...`);
          // Create a placeholder owner for now
          const placeholderOwner = new MainUser({
            firstName: business.owner.firstName || 'Business',
            lastName: business.owner.lastName || 'Owner',
            email: business.owner.email || `${business.code.toLowerCase()}@placeholder.com`,
            mobile: business.owner.mobile || '0000000000',
            password: '$2a$10$placeholder', // placeholder password
            role: 'admin', // Use 'admin' instead of 'owner'
            branchId: business._id, // temporary, will be updated later
            isActive: true,
            hasLoginAccess: true
          });
          await placeholderOwner.save();
          ownerId = placeholderOwner._id;
          console.log(`✅ Created placeholder owner for: ${business.name}`);
        }
      } else {
        console.log(`⚠️  No owner found for business: ${business.name}, creating placeholder...`);
        // Create a placeholder owner
        const placeholderOwner = new MainUser({
          firstName: 'Business',
          lastName: 'Owner',
          email: `${business.code.toLowerCase()}@placeholder.com`,
          mobile: '0000000000',
          password: '$2a$10$placeholder', // placeholder password
          role: 'admin', // Use 'admin' instead of 'owner'
          branchId: business._id, // temporary, will be updated later
          isActive: true,
          hasLoginAccess: true
        });
        await placeholderOwner.save();
        ownerId = placeholderOwner._id;
        console.log(`✅ Created placeholder owner for: ${business.name}`);
      }
      
      // Create business in main database
      const businessData = {
        name: business.name,
        code: business.code,
        description: business.description,
        contact: business.contact,
        address: business.address,
        settings: business.settings,
        subscription: business.subscription,
        status: business.status,
        owner: ownerId,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt
      };
      
      const newBusiness = new MainBusiness(businessData);
      await newBusiness.save();
      
      console.log(`✅ Successfully migrated business: ${business.name}`);
    }
    
    // Verify migration
    const mainBusinesses = await MainBusiness.find({});
    console.log(`✅ Migration complete! Main database now has ${mainBusinesses.length} businesses`);
    
    mainConnection.close();
    mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
};

migrateBusinesses();
