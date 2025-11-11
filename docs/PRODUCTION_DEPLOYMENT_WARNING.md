# ⚠️ Production Deployment Warning

## Critical Changes in This Update

### Database Naming Convention
- **Old naming**: `salon_crm_main`, `salon_crm_{businessId}`
- **New naming**: `ease_my_salon_main`, `ease_my_salon_{businessId}`
- **Status**: Backward compatibility has been **REMOVED** in the current code

## ⚠️ Before Pushing to Main/Production

### Option 1: Re-add Backward Compatibility (RECOMMENDED)
If your production environment still uses old database names, you **MUST** re-add backward compatibility before deploying.

**Steps:**
1. The code currently only looks for new database names
2. If production has `salon_crm_*` databases, the app will fail to connect
3. **Solution**: Re-add backward compatibility logic to `backend/config/database-manager.js`

### Option 2: Migrate Production Databases First
If you want to use new naming in production:

1. **Backup all databases** in production
2. **Rename databases** in MongoDB:
   ```bash
   # Connect to production MongoDB
   # Rename main database
   db.copyDatabase('salon_crm_main', 'ease_my_salon_main')
   db.salon_crm_main.drop()
   
   # For each business database
   db.copyDatabase('salon_crm_BUSINESS_ID', 'ease_my_salon_BUSINESS_ID')
   db.salon_crm_BUSINESS_ID.drop()
   ```
3. **Test thoroughly** before deploying
4. **Deploy** the new code

### Option 3: Use Environment Variable Flag
Add a feature flag to control database naming:

```javascript
// In database-manager.js
const USE_NEW_NAMING = process.env.USE_NEW_DB_NAMING === 'true';

if (USE_NEW_NAMING) {
  // Use new naming
} else {
  // Use old naming with backward compatibility
}
```

## Railway-Specific Considerations

### Environment Variables
No new environment variables are required. The existing `MONGODB_URI` will work.

### Database Migration on Railway
If using Railway's MongoDB service:
1. Access MongoDB shell via Railway dashboard
2. Run migration commands (see Option 2 above)
3. Or use Railway's database backup/restore features

## Recommended Approach

**For Production Safety:**
1. **Re-add backward compatibility** to `database-manager.js`
2. Deploy to production
3. Gradually migrate databases when convenient
4. Remove backward compatibility in a future update

**For Fresh Production:**
1. If starting fresh, new naming is fine
2. No migration needed
3. Deploy directly

## Testing Checklist Before Production Deploy

- [ ] Verify database naming in production
- [ ] Test database connection with new code locally
- [ ] Backup all production databases
- [ ] Have rollback plan ready
- [ ] Test on staging environment first (if available)

## Rollback Plan

If deployment fails:
1. Revert to previous commit
2. Railway will auto-deploy previous version
3. Restore from backup if needed

