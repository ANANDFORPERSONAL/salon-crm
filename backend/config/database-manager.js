const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.connections = new Map(); // Store active connections

    const fullUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

    try {
      const [uriWithoutQuery, queryParams] = fullUri.split('?');
      const uriParts = uriWithoutQuery.split('/');

      if (uriParts.length > 3) {
        this.baseUri = uriParts.slice(0, -1).join('/');
      } else {
        this.baseUri = uriWithoutQuery;
      }

      if (queryParams) {
        this.baseUri = `${this.baseUri}?${queryParams}`;
      }
    } catch (error) {
      console.error('⚠️  Error parsing MONGODB_URI, falling back to default:', error.message);
      this.baseUri = fullUri.split('?')[0];
    }

    if (!this.baseUri || this.baseUri === 'mongodb:' || this.baseUri === 'mongodb+srv:') {
      this.baseUri = 'mongodb://localhost:27017';
    }
  }

  /**
   * Get database name for a business
   * @param {string} businessCode - The business code (e.g., "BIZ0001")
   * @returns {string} - Database name
   */
  getDatabaseName(businessCode) {
    return `ease_my_salon_${businessCode}`;
  }

  /**
   * Get database name from business ID (looks up business code)
   * @param {string} businessId - The business ObjectId
   * @param {object} mainConnection - Main database connection to look up business
   * @returns {Promise<string>} - Database name using business code
   */
  async getDatabaseNameFromId(businessId, mainConnection) {
    try {
      const Business = mainConnection.model('Business', require('../models/Business').schema);
      const business = await Business.findById(businessId).select('code');
      
      if (business && business.code) {
        return this.getDatabaseName(business.code);
      }
      
      // Fallback to ObjectId if code not found (backward compatibility)
      console.warn(`⚠️ Business code not found for ID ${businessId}, using ObjectId`);
      return `ease_my_salon_${businessId}`;
    } catch (error) {
      console.error(`❌ Error looking up business code for ${businessId}:`, error.message);
      // Fallback to ObjectId
      return `ease_my_salon_${businessId}`;
    }
  }

  /**
   * Get or create a database connection for a business
   * @param {string} businessIdOrCode - The business ID (ObjectId) or business code (e.g., "BIZ0001")
   * @param {object} mainConnection - Optional main database connection to look up business code
   * @param {boolean} forceNewNaming - If true, only use new naming convention (for new businesses)
   * @returns {Promise<mongoose.Connection>} - Database connection
   * @note For new businesses, always uses new naming. For existing businesses, checks old names for backward compatibility.
   */
  async getConnection(businessIdOrCode, mainConnection = null, forceNewNaming = false) {
    if (!businessIdOrCode) {
      throw new Error('Business ID or code is required');
    }

    // Determine if it's a business code (starts with letters) or ObjectId (24 hex chars)
    const isBusinessCode = /^[A-Z]/.test(businessIdOrCode);
    let businessCode = businessIdOrCode;
    let businessId = businessIdOrCode;

    // If it's an ObjectId and we have mainConnection, try to get the business code
    if (!isBusinessCode && mainConnection) {
      try {
        const Business = mainConnection.model('Business', require('../models/Business').schema);
        const business = await Business.findById(businessId).select('code');
        if (business && business.code) {
          businessCode = business.code;
          console.log(`📋 Found business code: ${businessCode} for ID: ${businessId}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not look up business code for ${businessId}, using ObjectId`);
      }
    }

    const newDbName = this.getDatabaseName(businessCode);
    const oldDbNameByCode = `salon_crm_${businessCode}`;
    const oldDbNameById = `salon_crm_${businessId}`;
    
    // Return existing connection if available (check all possible names)
    if (this.connections.has(newDbName)) {
      return this.connections.get(newDbName);
    }
    if (!forceNewNaming) {
      // Only check old databases if not forcing new naming (for backward compatibility)
      if (this.connections.has(oldDbNameByCode)) {
        return this.connections.get(oldDbNameByCode);
      }
      if (this.connections.has(oldDbNameById)) {
        return this.connections.get(oldDbNameById);
      }
    }

    // For new businesses (forceNewNaming = true), only try new database name
    // For existing businesses, try old databases first for backward compatibility
    let connection;
    let dbName = newDbName;
    
    if (forceNewNaming) {
      // New business - only use new naming convention
      // Ensure we're using business code, not ObjectId
      if (!businessCode || businessCode === businessId) {
        throw new Error(`Cannot create new business database: business code is required but got: ${businessCode || 'undefined'}`);
      }
      const newUri = this.baseUri.includes('?')
        ? this.baseUri.replace('?', `/${newDbName}?`)
        : `${this.baseUri}/${newDbName}`;
      console.log(`🔗 Creating new business database: ${newDbName} (using business code: ${businessCode})`);
      connection = await mongoose.createConnection(newUri, {
        authSource: 'admin'
      });
      dbName = newDbName;
    } else {
      // Existing business - check old databases for backward compatibility
      const dbNamesToTry = [
        { name: oldDbNameByCode, reason: 'legacy by code' },
        { name: oldDbNameById, reason: 'legacy by ID' },
        { name: newDbName, reason: 'new by code' }
      ];
      
      for (const dbOption of dbNamesToTry) {
        try {
          const uri = this.baseUri.includes('?')
            ? this.baseUri.replace('?', `/${dbOption.name}?`)
            : `${this.baseUri}/${dbOption.name}`;
          connection = await mongoose.createConnection(uri, {
            authSource: 'admin'
          });
          // Test if connection is successful
          await new Promise(resolve => setTimeout(resolve, 100));
          if (connection.readyState === 1) {
            try {
              const collections = await connection.db.listCollections().toArray();
              // If database exists and has collections (or connection is ready), use it
              dbName = dbOption.name;
              if (dbOption.reason.includes('legacy')) {
                console.log(`🔗 Connecting to business database: ${dbName} (${dbOption.reason} - backward compatible)`);
              } else {
                console.log(`🔗 Connecting to business database: ${dbName} (${dbOption.reason})`);
              }
              break; // Found working database, exit loop
            } catch (testError) {
              // Connection exists but test failed, still use it (might be empty but valid)
              dbName = dbOption.name;
              if (dbOption.reason.includes('legacy')) {
                console.log(`🔗 Connecting to business database: ${dbName} (${dbOption.reason} - backward compatible)`);
              } else {
                console.log(`🔗 Connecting to business database: ${dbName} (${dbOption.reason})`);
              }
              break;
            }
          } else {
            await connection.close();
            connection = null;
          }
        } catch (error) {
          // This database doesn't exist, try next one
          if (connection && connection.readyState !== 0) {
            try {
              await connection.close();
            } catch (closeError) {
              // Ignore close errors
            }
          }
          connection = null;
          continue; // Try next database name
        }
      }
      
      // If all failed, create new database with business code
      if (!connection) {
        const newUri = this.baseUri.includes('?')
          ? this.baseUri.replace('?', `/${newDbName}?`)
          : `${this.baseUri}/${newDbName}`;
        console.log(`🔗 Creating new business database: ${newDbName}`);
        connection = await mongoose.createConnection(newUri, {
          authSource: 'admin'
        });
        dbName = newDbName;
      }
    }

    // Store connection
    this.connections.set(dbName, connection);
    
    console.log(`✅ Connected to business database: ${dbName}`);
    return connection;
  }

  /**
   * Get the main database connection (for businesses, users, admins)
   * @returns {Promise<mongoose.Connection>} - Main database connection
   * @note Uses new database naming convention only (ease_my_salon_main)
   */
  async getMainConnection() {
    const mainDbName = 'ease_my_salon_main';
    
    // Return existing connection if available
    if (this.connections.has(mainDbName)) {
      return this.connections.get(mainDbName);
    }

    const uri = this.baseUri.includes('?')
      ? this.baseUri.replace('?', `/${mainDbName}?`)
      : `${this.baseUri}/${mainDbName}`;
    console.log(`🔗 Connecting to main database: ${mainDbName}`);
    
    const connection = await mongoose.createConnection(uri, {
      authSource: 'admin'
    });

    this.connections.set(mainDbName, connection);
    console.log(`✅ Connected to main database: ${mainDbName}`);
    return connection;
  }

  /**
   * Close a specific business database connection
   * @param {string} businessCode - The business code (e.g., "BIZ0001")
   */
  async closeConnection(businessCode) {
    const dbName = this.getDatabaseName(businessCode);
    if (this.connections.has(dbName)) {
      await this.connections.get(dbName).close();
      this.connections.delete(dbName);
      console.log(`🔌 Closed connection to: ${dbName}`);
    }
  }

  /**
   * Delete a business database completely
   * @param {string} businessCode - The business code (e.g., "BIZ0001")
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteDatabase(businessCode) {
    try {
      const dbName = this.getDatabaseName(businessCode);
      
      // Close connection if open
      if (this.connections.has(dbName)) {
        await this.closeConnection(businessCode);
      }
      
      // Get main connection to access admin commands
      const mainConnection = await this.getMainConnection();
      
      // Use the database connection to drop it
      const dbToDelete = mainConnection.useDb(dbName);
      await dbToDelete.dropDatabase();
      
      console.log(`🗑️  Deleted business database: ${dbName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting database ${businessCode}:`, error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections() {
    for (const [dbName, connection] of this.connections) {
      await connection.close();
      console.log(`🔌 Closed connection to: ${dbName}`);
    }
    this.connections.clear();
  }

  /**
   * Get all active connections
   * @returns {Array} - List of active database names
   */
  getActiveConnections() {
    return Array.from(this.connections.keys());
  }
}

// Export singleton instance
module.exports = new DatabaseManager();
