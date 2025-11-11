# Database Migration Guide: Salon CRM → Ease My Salon

## Overview

This guide helps you migrate your existing databases from the old naming convention (`ease_my_salon_*`) to the new naming convention (`ease_my_salon_*`) after rebranding from "Salon CRM" to "Ease My Salon".

## ⚠️ Important Notes

- **Backup First**: Always backup your databases before migration
- **Downtime**: Plan for brief downtime during migration
- **Test Environment**: Test the migration in a development environment first
- **Rollback Plan**: Keep backups to rollback if needed

## Migration Steps

### Step 1: Backup Your Databases

```bash
# Backup main database
mongodump --db ease_my_salon_main --out ./backup/ease_my_salon_main_$(date +%Y%m%d)

# Backup all business databases
# List all databases first
mongosh --eval "db.adminCommand('listDatabases').databases.forEach(d => { if (d.name.startsWith('ease_my_salon_')) print(d.name) })"

# Backup each business database
for db in $(mongosh --quiet --eval "db.adminCommand('listDatabases').databases.forEach(d => { if (d.name.startsWith('ease_my_salon_') && d.name !== 'ease_my_salon_main') print(d.name) })"); do
  mongodump --db "$db" --out "./backup/${db}_$(date +%Y%m%d)"
done
```

### Step 2: Update Application Code

The application code has been updated to use the new naming convention:
- Main database: `ease_my_salon_main`
- Business databases: `ease_my_salon_{businessId}`

### Step 3: Migrate Main Database

```bash
# Connect to MongoDB
mongosh

# Copy main database
db.copyDatabase('ease_my_salon_main', 'ease_my_salon_main')

# Verify data
use ease_my_salon_main
db.getCollectionNames()

# If verification successful, drop old database (CAREFUL!)
# use ease_my_salon_main
# db.dropDatabase()
```

### Step 4: Migrate Business Databases

For each business database:

```bash
# Get business ID from main database
mongosh --eval "use ease_my_salon_main; db.businesses.find({}, {_id: 1, name: 1, code: 1}).forEach(b => print(b._id + ' - ' + b.name))"

# For each business, copy database
# Replace {businessId} with actual business ID
db.copyDatabase('ease_my_salon_{businessId}', 'ease_my_salon_{businessId}')

# Verify data
use ease_my_salon_{businessId}
db.getCollectionNames()

# If verification successful, drop old database (CAREFUL!)
# use ease_my_salon_{businessId}
# db.dropDatabase()
```

### Step 5: Automated Migration Script

Create a migration script `backend/migrate-database-names.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

async function migrateDatabases() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();

    // Find all old databases
    const oldDatabases = databases.filter(db => 
      db.name.startsWith('ease_my_salon_')
    );

    console.log(`\n📋 Found ${oldDatabases.length} databases to migrate:`);
    oldDatabases.forEach(db => console.log(`  - ${db.name}`));

    // Migrate main database
    if (oldDatabases.find(db => db.name === 'ease_my_salon_main')) {
      console.log('\n🔄 Migrating main database...');
      await mongoose.connection.db.admin().command({
        copydb: 1,
        fromhost: 'localhost',
        fromdb: 'ease_my_salon_main',
        todb: 'ease_my_salon_main'
      });
      console.log('✅ Main database migrated');
    }

    // Migrate business databases
    const businessDbs = oldDatabases.filter(db => 
      db.name.startsWith('ease_my_salon_') && db.name !== 'ease_my_salon_main'
    );

    for (const oldDb of businessDbs) {
      const businessId = oldDb.name.replace('ease_my_salon_', '');
      const newDbName = `ease_my_salon_${businessId}`;
      
      console.log(`\n🔄 Migrating ${oldDb.name} → ${newDbName}...`);
      
      try {
        await mongoose.connection.db.admin().command({
          copydb: 1,
          fromhost: 'localhost',
          fromdb: oldDb.name,
          todb: newDbName
        });
        console.log(`✅ ${newDbName} migrated successfully`);
      } catch (error) {
        console.error(`❌ Error migrating ${oldDb.name}:`, error.message);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n⚠️  IMPORTANT: Verify all data before dropping old databases!');
    console.log('   Old databases are still present. Drop them only after verification.');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

migrateDatabases();
```

### Step 6: Verify Migration

1. **Start the application** with new code
2. **Test all functionality**:
   - Login (admin, business owner, staff)
   - View clients, appointments, sales
   - Create new records
   - Generate reports
3. **Compare data counts** between old and new databases
4. **Check for any errors** in application logs

### Step 7: Clean Up (After Verification)

Only after thorough verification:

```bash
mongosh

# Drop old main database
use ease_my_salon_main
db.dropDatabase()

# Drop old business databases (one by one)
use ease_my_salon_{businessId}
db.dropDatabase()
```

## Backward Compatibility

The current implementation uses the new naming convention (`ease_my_salon_*`) for **new installations**. 

For **existing installations**, you have two options:

### Option 1: Migrate Databases (Recommended)
Follow the migration steps above to rename your databases.

### Option 2: Temporary Backward Compatibility
If you need to keep old database names temporarily, you can modify `backend/config/database-manager.js`:

```javascript
getDatabaseName(businessId) {
  // Check if old database exists first
  // This requires checking MongoDB, so for simplicity, use old naming
  return `ease_my_salon_${businessId}`;
}

async getMainConnection() {
  const mainDbName = 'ease_my_salon_main'; // Keep old name
  // ... rest of the code
}
```

**Note**: Option 2 is only a temporary solution. We recommend migrating to the new naming convention.

## Troubleshooting

### Issue: Database not found after migration

**Solution**: Verify database names match exactly. Check business IDs in the main database.

### Issue: Connection errors

**Solution**: 
1. Check MongoDB connection string
2. Verify database permissions
3. Check if databases exist: `mongosh --eval "db.adminCommand('listDatabases')"`

### Issue: Data missing after migration

**Solution**: 
1. Restore from backup
2. Re-run migration
3. Verify source database has data before migration

## Support

If you encounter issues during migration:
1. Check application logs
2. Verify MongoDB connection
3. Review backup files
4. Contact support with error details

## Summary

- ✅ Backup all databases first
- ✅ Migrate main database: `ease_my_salon_main` → `ease_my_salon_main`
- ✅ Migrate each business database: `ease_my_salon_{id}` → `ease_my_salon_{id}`
- ✅ Verify all data after migration
- ✅ Test application thoroughly
- ✅ Drop old databases only after verification

---

**Last Updated**: After rebranding to Ease My Salon
**Version**: 1.0.0

