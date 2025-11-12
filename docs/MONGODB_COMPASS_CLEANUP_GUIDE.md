# Manual Database Cleanup via MongoDB Compass

## 🗑️ Step-by-Step Guide to Delete Databases (Keep Only `ease_my_salon_main`)

### Prerequisites
- MongoDB Compass installed on your computer
- Railway MongoDB connection string

---

## Step 1: Get Railway MongoDB Connection String

1. Go to [Railway Dashboard](https://railway.app)
2. Navigate to your **MongoDB service**
3. Click on the service to open details
4. Go to **Variables** tab
5. Find `MONGODB_URI` or `DATABASE_URL`
6. **Copy the connection string**

   Example format:
   ```
   mongodb://mongo:password@containers-us-west-xxx.railway.app:xxxxx
   ```

---

## Step 2: Connect to Railway MongoDB in Compass

1. **Open MongoDB Compass**
2. Click **"New Connection"** or paste connection string in the connection field
3. Paste your Railway MongoDB connection string
4. Click **"Connect"**
5. Wait for connection to establish

---

## Step 3: View All Databases

1. In the left sidebar, you'll see a list of all databases
2. You should see:
   - `ease_my_salon_main` ✅ (KEEP THIS)
   - `salon_crm_main` ❌ (DELETE)
   - `salon_crm_68f8d180f4907d3445f7a7ec` ❌ (DELETE)
   - `salon_crm_68f9cca1f4907d3445f7aa3b` ❌ (DELETE)
   - `salon_crm_68f9ce3143ae7264e6ac3c84` ❌ (DELETE)
   - `test` ❌ (DELETE)
   - `admin` ✅ (System database - DO NOT DELETE)
   - `local` ✅ (System database - DO NOT DELETE)
   - `config` ✅ (System database - DO NOT DELETE)

---

## Step 4: Delete Each Database (One by One)

### ⚠️ IMPORTANT: Only delete these databases:
- `salon_crm_main`
- `salon_crm_68f8d180f4907d3445f7a7ec`
- `salon_crm_68f9cca1f4907d3445f7aa3b`
- `salon_crm_68f9ce3143ae7264e6ac3c84`
- `test`

### ✅ DO NOT DELETE:
- `ease_my_salon_main` (your main database)
- `admin` (MongoDB system database)
- `local` (MongoDB system database)
- `config` (MongoDB system database)

### For Each Database to Delete:

1. **Right-click** on the database name in the left sidebar
2. Select **"Drop Database"** from the context menu
3. A confirmation dialog will appear showing:
   - Database name
   - Number of collections
   - Warning message
4. **Type the database name** in the confirmation field
   - Example: Type `salon_crm_main` to confirm
5. Click **"Drop"** or **"Delete"** button
6. Wait for confirmation that database is deleted

### Repeat for Each Database:

**Delete in this order (recommended):**

1. `test` (smallest, safest to start with)
2. `salon_crm_68f8d180f4907d3445f7a7ec`
3. `salon_crm_68f9cca1f4907d3445f7aa3b`
4. `salon_crm_68f9ce3143ae7264e6ac3c84`
5. `salon_crm_main` (last, as it's the main old database)

---

## Step 5: Verify Deletion

1. **Refresh the database list** in Compass (click refresh icon or press F5)
2. Verify that only these databases remain:
   - ✅ `ease_my_salon_main`
   - ✅ `admin` (system)
   - ✅ `local` (system)
   - ✅ `config` (system)
3. All `salon_crm_*` databases should be gone
4. `test` database should be gone

---

## Step 6: Test Your Application

After cleanup, verify your application still works:

1. **Check Railway logs** for any connection errors
2. **Test API endpoints**:
   - Health check: `https://your-backend.railway.app/api/health`
   - Login endpoint
3. **Verify database connections** are working
4. **Test critical features**:
   - User login
   - Business operations
   - Data retrieval

---

## Troubleshooting

### Database Won't Delete
- **Error**: "Database not found"
  - Database may already be deleted
  - Refresh the list and check again

- **Error**: "Permission denied"
  - Check Railway MongoDB user permissions
  - Ensure you have `dropDatabase` permission

- **Error**: "Connection lost"
  - Reconnect to Railway MongoDB
  - Check Railway service status

### Accidentally Deleted Wrong Database
- **If you deleted `ease_my_salon_main`**:
  - Check Railway backups (if enabled)
  - Restore from your own backups
  - Contact Railway support if needed

### Application Errors After Cleanup
- **404 errors**: Normal if old databases had data
- **Connection errors**: Check Railway MongoDB service status
- **Missing data**: Expected if data was only in old databases

---

## Visual Guide

### Before Cleanup:
```
📁 Databases
  ├── ✅ ease_my_salon_main
  ├── ❌ salon_crm_main
  ├── ❌ salon_crm_68f8d180f4907d3445f7a7ec
  ├── ❌ salon_crm_68f9cca1f4907d3445f7aa3b
  ├── ❌ salon_crm_68f9ce3143ae7264e6ac3c84
  ├── ❌ test
  ├── ✅ admin (system)
  ├── ✅ local (system)
  └── ✅ config (system)
```

### After Cleanup:
```
📁 Databases
  ├── ✅ ease_my_salon_main
  ├── ✅ admin (system)
  ├── ✅ local (system)
  └── ✅ config (system)
```

---

## Safety Checklist

Before deleting, verify:
- [ ] You have backups (if needed)
- [ ] You've identified all databases to delete
- [ ] You're NOT deleting `ease_my_salon_main`
- [ ] You're NOT deleting system databases (`admin`, `local`, `config`)
- [ ] You understand this is permanent
- [ ] You've tested your application can connect to `ease_my_salon_main`

---

## Next Steps

After successful cleanup:
1. ✅ Your application will use only `ease_my_salon_main`
2. ✅ New businesses will create `ease_my_salon_{businessId}` databases
3. ✅ System is clean and ready for production
4. ✅ No more old `salon_crm_*` databases cluttering your MongoDB instance

---

## Need Help?

If you encounter issues:
1. Check Railway MongoDB service logs
2. Verify connection string is correct
3. Ensure MongoDB Compass is up to date
4. Try reconnecting to Railway MongoDB

