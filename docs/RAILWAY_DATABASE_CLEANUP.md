# Railway Database Cleanup Guide

## 🗑️ Delete All Databases Except `ease_my_salon_main`

This guide helps you clean up old databases in your Railway MongoDB instance.

## ⚠️ WARNING

**This will permanently delete databases!** Make sure you:
- Have backups if you need to preserve data
- Understand which databases will be deleted
- Are ready to proceed

## Method 1: Using the Cleanup Script (Recommended)

### Step 1: Access Railway MongoDB

1. Go to your Railway dashboard
2. Find your MongoDB service
3. Click on it to view details
4. Note the connection string (MONGODB_URI)

### Step 2: Run the Cleanup Script

**Option A: Run locally with Railway connection string**

1. Set the MongoDB URI:
   ```bash
   export MONGODB_URI="your-railway-mongodb-connection-string"
   ```

2. Run the script:
   ```bash
   cd backend
   node cleanup-railway-databases.js --confirm
   ```

**Option B: Run in Railway Shell**

1. Open Railway dashboard
2. Go to your backend service
3. Click on "Shell" or "Console"
4. Run:
   ```bash
   cd backend
   node cleanup-railway-databases.js --confirm
   ```

### Step 3: Verify

The script will:
- List all databases to be deleted
- Show the size of each database
- Delete all except `ease_my_salon_main`
- Report success/errors

## Method 2: Manual Deletion via MongoDB Shell

### Step 1: Connect to Railway MongoDB

1. Get MongoDB connection string from Railway
2. Connect using MongoDB Compass or `mongosh`

### Step 2: List Databases

```javascript
show dbs
```

### Step 3: Delete Databases

```javascript
// Delete each database one by one
use salon_crm_main
db.dropDatabase()

use salon_crm_68f8d180f4907d3445f7a7ec
db.dropDatabase()

use salon_crm_68f9cca1f4907d3445f7aa3b
db.dropDatabase()

use salon_crm_68f9ce3143ae7264e6ac3c84
db.dropDatabase()

use test
db.dropDatabase()
```

### Step 4: Verify

```javascript
show dbs
// Should only show: ease_my_salon_main, admin, local, config
```

## Method 3: Using Railway MongoDB Service UI

1. Go to Railway dashboard
2. Open your MongoDB service
3. Click on "Data" or "Databases" tab
4. Select databases to delete
5. Click "Delete" (if available)

**Note:** Railway's UI may not support database deletion directly. Use Method 1 or 2 instead.

## What Gets Deleted

The script will delete:
- ✅ `salon_crm_main` (old main database)
- ✅ `salon_crm_*` (all old business databases)
- ✅ `test` (test database)
- ✅ Any other databases except `ease_my_salon_main`

## What Gets Kept

- ✅ `ease_my_salon_main` (your main database)
- ✅ `admin` (MongoDB system database)
- ✅ `local` (MongoDB system database)
- ✅ `config` (MongoDB system database)

## After Cleanup

1. **Verify the application works:**
   - Check Railway logs
   - Test API endpoints
   - Verify login works

2. **Monitor for issues:**
   - Check error logs
   - Verify database connections
   - Test critical features

3. **Update documentation:**
   - Note that old databases are removed
   - Update any migration guides

## Troubleshooting

### "MONGODB_URI not set"
- Set it in Railway environment variables
- Or export it before running the script

### "Permission denied"
- Ensure MongoDB user has `dropDatabase` permission
- Check Railway MongoDB service permissions

### "Database not found"
- Database may already be deleted
- Check with `show dbs` command

### "Connection failed"
- Verify MongoDB connection string
- Check Railway service status
- Ensure network access is allowed

## Rollback

If you need to restore deleted databases:
1. Use Railway's backup feature (if enabled)
2. Restore from your own backups
3. Re-create databases manually if needed

## Next Steps

After cleanup:
1. Your application will use only `ease_my_salon_main`
2. New businesses will create `ease_my_salon_{businessId}` databases
3. All old `salon_crm_*` databases are removed
4. System is clean and ready for production

