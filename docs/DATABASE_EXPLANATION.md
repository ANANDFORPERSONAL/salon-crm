# Database Explanation Guide

## 📊 Understanding Your Three Databases

### 1. `ease-my-salon` (Legacy Database - Can be deleted)

**Purpose:** This is an **old legacy database** from before the multi-tenant architecture was implemented.

**Contains:**
- Mixed data (admins, businesses, users, clients, products, services, etc. all in one place)
- Old single-tenant structure
- Created by the initial `database.js` connection

**Collections:**
- admins
- clients
- suppliers
- passwordresettokens
- categories
- products
- expenses
- sales
- cashregistries
- receipts
- staffs
- appointments
- inventorytransactions
- users
- businesses
- businesssettings
- services

**Status:** ⚠️ **Legacy - Not used by current system**

**Recommendation:** Can be deleted if you've migrated all important data.

---

### 2. `ease_my_salon_6913aabeadc31441c53cb86f` (Old Business Database - Can be migrated)

**Purpose:** This is a **business-specific database** created with an ObjectId (before we switched to business code naming).

**Contains:**
- Business-specific data for one business
- Created before the business code naming convention

**Collections:**
- cashregistries
- services
- staffs
- inventorytransactions
- clients
- receipts
- sales
- businesssettings
- products
- expenses
- categories
- appointments
- suppliers

**Status:** ⚠️ **Old naming convention - Uses ObjectId instead of business code**

**Recommendation:** 
- If this business is still active, you should:
  1. Find the business in `ease_my_salon_main` to get its business code
  2. Rename this database to `ease_my_salon_{BusinessCode}` (e.g., `ease_my_salon_BIZ0001`)
- If the business is no longer needed, you can delete it

---

### 3. `ease_my_salon_main` (Main Database - ✅ Keep This)

**Purpose:** This is the **main multi-tenant database** that stores:
- Admin users (super admin accounts)
- Business records (all businesses in the system)
- User accounts (business owners)
- Password reset tokens

**Contains:**
- Core system data
- Multi-tenant architecture foundation
- Business metadata

**Collections:**
- admins (super admin users)
- users (business owners)
- passwordresettokens
- businesses (all business records)

**Status:** ✅ **Active - Currently in use**

**Recommendation:** **Keep this database** - it's essential for the system.

---

## 🎯 Current System Architecture

### Main Database (`ease_my_salon_main`)
- Stores: Admins, Businesses, Users
- Purpose: Multi-tenant management

### Business Databases (`ease_my_salon_{BusinessCode}`)
- Format: `ease_my_salon_BIZ0001`, `ease_my_salon_BIZ0002`, etc.
- Stores: Business-specific data (clients, appointments, sales, products, etc.)
- Purpose: Isolated data per business

---

## 🔧 What You Should Do

### Option 1: Clean Up (Recommended)

1. **Keep:**
   - ✅ `ease_my_salon_main` (essential)

2. **Migrate or Delete:**
   - `ease_my_salon_6913aabeadc31441c53cb86f` - Find the business code and rename it
   - `ease-my-salon` - Delete if no longer needed

### Option 2: Find Business Code for Old Database

To find which business the ObjectId database belongs to:

```javascript
// Connect to ease_my_salon_main
// Find business with _id: 6913aabeadc31441c53cb86f
// Get its business code (e.g., BIZ0001)
// Rename database to: ease_my_salon_BIZ0001
```

---

## 📝 Summary

| Database | Status | Action |
|----------|--------|--------|
| `ease-my-salon` | Legacy | Delete (if data migrated) |
| `ease_my_salon_6913aabeadc31441c53cb86f` | Old naming | Migrate to business code naming |
| `ease_my_salon_main` | Active | ✅ Keep |

---

## 🚀 Next Steps

1. **Identify the business** for `ease_my_salon_6913aabeadc31441c53cb86f`
2. **Rename it** to use business code (e.g., `ease_my_salon_BIZ0001`)
3. **Delete** `ease-my-salon` if no longer needed
4. **Verify** all new businesses use the new naming convention

