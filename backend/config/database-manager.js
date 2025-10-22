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
    return `salon_crm_${businessId}`;
  }

  /**
   * Get or create a database connection for a business
   * @param {string} businessId - The business ID
   * @returns {Promise<mongoose.Connection>} - Database connection
   */
  async getConnection(businessId) {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    const dbName = this.getDatabaseName(businessId);
    
    // Return existing connection if available
    if (this.connections.has(dbName)) {
      return this.connections.get(dbName);
    }

    // Create new connection
    const uri = `${this.baseUri}/${dbName}`;
    console.log(`🔗 Connecting to database: ${dbName}`);
    
    const connection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'admin'
    });

    // Store connection
    this.connections.set(dbName, connection);
    
    console.log(`✅ Connected to business database: ${dbName}`);
    return connection;
  }

  /**
   * Get the main database connection (for businesses, users, admins)
   * @returns {Promise<mongoose.Connection>} - Main database connection
   */
  async getMainConnection() {
    const mainDbName = 'salon_crm_main';
    
    if (this.connections.has(mainDbName)) {
      return this.connections.get(mainDbName);
    }

    const uri = `${this.baseUri}/${mainDbName}`;
    console.log(`🔗 Connecting to main database: ${mainDbName}`);
    
    const connection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'admin'
    });

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
