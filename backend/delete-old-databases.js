const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Script to delete old database naming convention (salon_crm_*)
 * and migrate to new naming (ease_my_salon_*)
 * 
 * WARNING: This will delete all old databases!
 * Make sure you have backups before running this script.
 */

async function deleteOldDatabases() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    
    // Connect to MongoDB (without specifying a database)
    await mongoose.connect(uri, {
      authSource: 'admin'
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get admin interface to list databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    // Find all old databases
    const oldDatabases = databases.filter(db => 
      db.name.startsWith('salon_crm_')
    );
    
    if (oldDatabases.length === 0) {
      console.log('✅ No old databases found. All databases are using the new naming convention.');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`\n📋 Found ${oldDatabases.length} old database(s) to delete:`);
    oldDatabases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    console.log('\n⚠️  WARNING: This will permanently delete the above databases!');
    console.log('   Make sure you have backups if you need to preserve any data.');
    console.log('\n   To proceed, run this script with --confirm flag:');
    console.log('   node delete-old-databases.js --confirm\n');
    
    // Check for confirmation flag
    if (process.argv.includes('--confirm')) {
      console.log('🗑️  Deleting old databases...\n');
      
      for (const db of oldDatabases) {
        try {
          // Use the admin command to drop the database
          await mongoose.connection.useDb(db.name).dropDatabase();
          console.log(`✅ Deleted: ${db.name}`);
        } catch (error) {
          console.error(`❌ Error deleting ${db.name}:`, error.message);
        }
      }
      
      console.log('\n✅ Old databases deletion completed!');
      console.log('✅ Your application will now use the new database naming convention (ease_my_salon_*)');
    } else {
      console.log('❌ Deletion cancelled. Use --confirm flag to proceed.');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteOldDatabases();

