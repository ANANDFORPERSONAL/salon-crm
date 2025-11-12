const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Script to delete all databases except ease_my_salon_main in Railway/production
 * 
 * WARNING: This will permanently delete databases!
 * Make sure you have backups before running this script.
 * 
 * Usage:
 *   node cleanup-railway-databases.js --confirm
 */

async function cleanupDatabases() {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!uri) {
      console.error('❌ MONGODB_URI or DATABASE_URL environment variable not set');
      console.error('   Please set it in Railway environment variables or .env file');
      process.exit(1);
    }
    
    // Connect to MongoDB (without specifying a database)
    // Extract base URI (remove database name if present)
    const baseUri = uri.split('/').slice(0, -1).join('/') || uri;
    
    await mongoose.connect(baseUri, {
      authSource: 'admin'
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get admin interface to list databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    // Find all databases except ease_my_salon_main
    const databasesToDelete = databases.filter(db => 
      db.name !== 'ease_my_salon_main' && 
      db.name !== 'admin' && 
      db.name !== 'local' &&
      db.name !== 'config'
    );
    
    if (databasesToDelete.length === 0) {
      console.log('✅ No databases to delete. Only ease_my_salon_main exists.');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`\n📋 Found ${databasesToDelete.length} database(s) to delete:`);
    databasesToDelete.forEach(db => {
      const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
      console.log(`   - ${db.name} (${sizeMB} MB)`);
    });
    
    console.log(`\n✅ Database to keep: ease_my_salon_main`);
    
    console.log('\n⚠️  WARNING: This will permanently delete the above databases!');
    console.log('   Make sure you have backups if you need to preserve any data.');
    console.log('\n   To proceed, run this script with --confirm flag:');
    console.log('   node cleanup-railway-databases.js --confirm\n');
    
    // Check for confirmation flag
    if (process.argv.includes('--confirm')) {
      console.log('🗑️  Deleting databases...\n');
      
      let deletedCount = 0;
      let errorCount = 0;
      
      for (const db of databasesToDelete) {
        try {
          // Use the admin command to drop the database
          const dbToDelete = mongoose.connection.useDb(db.name);
          await dbToDelete.dropDatabase();
          console.log(`✅ Deleted: ${db.name}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Error deleting ${db.name}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`\n✅ Cleanup completed!`);
      console.log(`   Deleted: ${deletedCount} database(s)`);
      if (errorCount > 0) {
        console.log(`   Errors: ${errorCount} database(s)`);
      }
      console.log(`   Kept: ease_my_salon_main`);
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

cleanupDatabases();

