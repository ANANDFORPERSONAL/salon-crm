require('dotenv').config();
const mongoose = require('mongoose');
const databaseManager = require('./config/database-manager');

const migrateUsersToMain = async () => {
  try {
    // Connect to the old database
    const oldConnection = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-crm');
    const OldUser = oldConnection.model('User', require('./models/User').schema);
    
    // Get main database connection
    const mainConnection = await databaseManager.getMainConnection();
    const MainUser = mainConnection.model('User', require('./models/User').schema);
    
    console.log('🔄 Migrating users to main database...');
    
    // Get all users from old database
    const users = await OldUser.find({});
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      // Check if user already exists in main database
      const existingUser = await MainUser.findOne({ email: user.email });
      if (!existingUser) {
        // Create new user in main database
        const newUser = new MainUser({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password,
          mobile: user.mobile,
          role: user.role,
          avatar: user.avatar,
          hasLoginAccess: user.hasLoginAccess,
          allowAppointmentScheduling: user.allowAppointmentScheduling,
          isActive: user.isActive,
          permissions: user.permissions,
          specialties: user.specialties,
          hourlyRate: user.hourlyRate,
          commissionRate: user.commissionRate,
          notes: user.notes,
          commissionProfileIds: user.commissionProfileIds,
          branchId: user.branchId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
        
        await newUser.save();
        console.log(`✅ Migrated user: ${user.email}`);
      } else {
        console.log(`⏭️ User already exists: ${user.email}`);
      }
    }
    
    console.log('🎉 User migration completed!');
    
    // Close connections
    await oldConnection.close();
    await mainConnection.close();
    
  } catch (error) {
    console.error('Error migrating users:', error);
  }
};

migrateUsersToMain();
