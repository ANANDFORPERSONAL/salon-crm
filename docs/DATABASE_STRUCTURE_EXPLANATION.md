# Database Structure Explanation

## 📊 Your MongoDB Database Structure

Based on your database explorer, here's what each database is:

---

## 1. `ease-my-salon` (Parent/Connection Name)

**What it is:** This is likely a **connection name** or **parent grouping** in your MongoDB Compass/explorer, not an actual database.

**In MongoDB Compass:**
- This appears as a parent node that groups related databases
- The indented items below it are the actual databases
- The "+" and trash icons allow you to add/delete connections or databases

**Note:** This might also be a legacy database from early development. Check if it has collections.

---

## 2. `ease_my_salon_main` ✅ (Main Database - Keep)

**Purpose:** The **main multi-tenant database** for your application.

**Contains:**
- **`admins`** - Super admin users (for admin panel login)
- **`users`** - Business owner accounts
- **`businesses`** - All business records with their codes
- **`passwordresettokens`** - Password reset tokens

**Status:** ✅ **Active - Currently in use**

**Used for:**
- Admin authentication
- Business management
- User management
- Multi-tenant coordination

**Size:** ~0.26 MB

---

## 3. `local` (MongoDB System Database)

**Purpose:** MongoDB's **internal system database**.

**Contains:**
- MongoDB replication metadata
- Oplog (operation log) for replication
- Startup logs
- Internal MongoDB configuration

**Status:** 🔧 **System Database - Do NOT delete**

**Note:** This is created automatically by MongoDB and is required for MongoDB to function properly. You should never delete or modify this database.

**Size:** Usually very small or empty

---

## 4. `salon_crm_BIZ0001` (Legacy Business Database)

**Purpose:** A **business-specific database** using the old naming convention.

**Contains:**
- Business-specific data for business code `BIZ0001`
- Clients, appointments, sales, products, services, etc.
- All operational data for that specific business

**Status:** ⚠️ **Legacy naming - Should be migrated**

**Current Name:** `salon_crm_BIZ0001` (old convention)
**Should Be:** `ease_my_salon_BIZ0001` (new convention)

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

**Size:** ~0.22 MB

---

## 🎯 Database Hierarchy

```
ease-my-salon (Connection/Parent)
├── ease_my_salon_main ✅ (Main database - Keep)
├── local 🔧 (MongoDB system - Keep)
└── salon_crm_BIZ0001 ⚠️ (Legacy business DB - Migrate)
```

---

## 📝 Summary Table

| Database | Type | Status | Action |
|----------|------|--------|--------|
| `ease-my-salon` | Connection/Parent | Check if it's a real DB | Investigate |
| `ease_my_salon_main` | Main Database | ✅ Active | **Keep** |
| `local` | System Database | 🔧 Required | **Keep** (Never delete) |
| `salon_crm_BIZ0001` | Business Database | ⚠️ Legacy | **Rename** to `ease_my_salon_BIZ0001` |

---

## 🔧 Recommended Actions

### 1. Keep These:
- ✅ `ease_my_salon_main` - Essential for system operation
- ✅ `local` - Required by MongoDB (system database)

### 2. Migrate This:
- ⚠️ `salon_crm_BIZ0001` → Rename to `ease_my_salon_BIZ0001`

### 3. Check This:
- `ease-my-salon` - Determine if it's a real database or just a connection name

---

## 🚀 Next Steps

1. **Verify `ease-my-salon`**: Check if it has collections or is just a connection name
2. **Rename business database**: `salon_crm_BIZ0001` → `ease_my_salon_BIZ0001`
3. **Update code**: Ensure all references use new naming
4. **Test**: Verify business operations work with renamed database

---

## 💡 Why This Structure?

### Multi-Tenant Architecture:
- **Main Database** (`ease_my_salon_main`): Stores metadata about all businesses
- **Business Databases** (`ease_my_salon_{Code}`): Isolated data per business
- **Benefits**: 
  - Data isolation
  - Easy backup/restore per business
  - Scalability
  - Security (each business's data is separate)

### Naming Convention:
- **Old:** `salon_crm_{ObjectId}` or `salon_crm_{Code}`
- **New:** `ease_my_salon_{BusinessCode}` (e.g., `ease_my_salon_BIZ0001`)
- **Benefit:** Consistent, readable, easy to identify

