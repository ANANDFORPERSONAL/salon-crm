const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.connections = new Map(); // Store active connections
    this.baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  }

  /**
   * Get database name for a business
   * @param {string} businessId - The business ID
   * @returns {string} - Database name
   */
  getDatabaseName(businessId) {
    return `ease_my_salon_${businessId}`;
  }

  /**
   * Get or create a database connection for a business
   * @param {string} businessId - The business ID
   * @returns {Promise<mongoose.Connection>} - Database connection
   * @note For production safety, checks old database name first for backward compatibility
   */
  async getConnection(businessId) {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    const newDbName = this.getDatabaseName(businessId);
    const oldDbName = `salon_crm_${businessId}`;
    
    // Return existing connection if available (check both names)
    if (this.connections.has(newDbName)) {
      return this.connections.get(newDbName);
    }
    if (this.connections.has(oldDbName)) {
      return this.connections.get(oldDbName);
    }

    // Try old database first for backward compatibility (production safety)
    let connection;
    let dbName = newDbName;
    
    try {
      const oldUri = `${this.baseUri}/${oldDbName}`;
      connection = await mongoose.createConnection(oldUri, {
        authSource: 'admin'
      });
      // Test if connection is successful and database has collections
      await new Promise(resolve => setTimeout(resolve, 100));
      if (connection.readyState === 1) {
        try {
          const collections = await connection.db.listCollections().toArray();
          // If database exists and has collections (or connection is ready), use old database
          dbName = oldDbName;
          console.log(`🔗 Connecting to business database: ${oldDbName} (legacy - backward compatible)`);
        } catch (testError) {
          // Connection exists but test failed, still use it (might be empty but valid)
          dbName = oldDbName;
          console.log(`🔗 Connecting to business database: ${oldDbName} (legacy - backward compatible)`);
        }
      } else {
        await connection.close();
        throw new Error('Legacy database connection not ready');
      }
    } catch (error) {
      // Old database doesn't exist or failed, use new one
      try {
        if (connection && connection.readyState !== 0) {
          await connection.close();
        }
      } catch (closeError) {
        // Ignore close errors
      }
      
      const newUri = `${this.baseUri}/${newDbName}`;
      console.log(`🔗 Connecting to business database: ${newDbName}`);
      connection = await mongoose.createConnection(newUri, {
        authSource: 'admin'
      });
      dbName = newDbName;
    }

    // Store connection
    this.connections.set(dbName, connection);
    
    console.log(`✅ Connected to business database: ${dbName}`);
    return connection;
  }

  /**
   * Get the main database connection (for businesses, users, admins)
   * @returns {Promise<mongoose.Connection>} - Main database connection
   * @note For production safety, checks old database name first for backward compatibility
   */
  async getMainConnection() {
    const newDbName = 'ease_my_salon_main';
    const oldDbName = 'salon_crm_main';
    
    // Return existing connection if available (check both names)
    if (this.connections.has(newDbName)) {
      return this.connections.get(newDbName);
    }
    if (this.connections.has(oldDbName)) {
      return this.connections.get(oldDbName);
    }
    
    // Try to connect to old database first (for backward compatibility)
    let connection;
    let mainDbName = newDbName;
    
    try {
      // First, try to connect to old database
      const oldUri = `${this.baseUri}/${oldDbName}`;
      connection = await mongoose.createConnection(oldUri, {
        authSource: 'admin'
      });
      
      // Wait a bit for connection to establish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Test if connection is ready and database has collections
      if (connection.readyState === 1) {
        try {
          const collections = await connection.db.listCollections().toArray();
          // If database has collections or connection is ready, use old database
          mainDbName = oldDbName;
          console.log(`🔗 Connecting to main database: ${oldDbName} (legacy - backward compatible)`);
        } catch (testError) {
          // Connection exists but test failed, still use it (might be empty but valid)
          mainDbName = oldDbName;
          console.log(`🔗 Connecting to main database: ${oldDbName} (legacy - backward compatible)`);
        }
      } else {
        await connection.close();
        throw new Error('Legacy database connection not ready');
      }
    } catch (error) {
      // Old database doesn't exist or failed, use new one
      try {
        if (connection && connection.readyState !== 0) {
          await connection.close();
        }
      } catch (closeError) {
        // Ignore close errors
      }
      
      const newUri = `${this.baseUri}/${newDbName}`;
      console.log(`🔗 Connecting to main database: ${newDbName}`);
      connection = await mongoose.createConnection(newUri, {
        authSource: 'admin'
      });
      mainDbName = newDbName;
    }

    this.connections.set(mainDbName, connection);
    console.log(`✅ Connected to main database: ${mainDbName}`);
    return connection;
  }

  /**
   * Close a specific business database connection
   * @param {string} businessId - The business ID
   */
  async closeConnection(businessId) {
    const dbName = this.getDatabaseName(businessId);
    if (this.connections.has(dbName)) {
      await this.connections.get(dbName).close();
      this.connections.delete(dbName);
      console.log(`🔌 Closed connection to: ${dbName}`);
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
