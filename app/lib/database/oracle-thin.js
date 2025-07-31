// lib/database/oracle-thin.js
import oracledb from 'oracledb';

// Configure Oracle client for Thin mode (no Instant Client required)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

// Force Thin mode (available in node-oracledb 6.0+)
try {
  if (oracledb.thin !== undefined) {
    oracledb.thin = true;  // Use Thin mode
    console.log('Using Oracle Thin mode (no Instant Client required)');
  }
} catch (error) {
  console.log('Thin mode not available, will attempt regular connection');
}

class ThinOracleConnection {
  constructor() {
    this.pool = null;
    this.isConfigValid = false;
    this.configError = null;
    this.envVars = this.getEnvironmentVariables();
    this.initializeConfig();
  }

  getEnvironmentVariables() {
    const user = process.env.ORACLE_USER || 
                 process.env.ORACLE_DB_USER || 
                 process.env.DB_USER ||
                 process.env.ORACLE_USERNAME;

    const password = process.env.ORACLE_PASSWORD || 
                     process.env.ORACLE_DB_PASSWORD || 
                     process.env.DB_PASSWORD ||
                     process.env.ORACLE_PASS;

    const connectionString = process.env.ORACLE_CONNECTION_STRING || 
                            process.env.ORACLE_DB_CONNECT_STRING || 
                            process.env.ORACLE_CONNECT_STRING ||
                            process.env.DB_CONNECTION_STRING ||
                            process.env.DATABASE_URL;

    return { user, password, connectionString };
  }

  initializeConfig() {
    try {
      this.validateEnvironment();
      
      // For Thin mode, we can use either format
      this.config = {
        user: this.envVars.user,
        password: this.envVars.password,
        connectString: this.envVars.connectionString,
        // Thin mode specific options
        poolMin: 1,
        poolMax: 5,  // Smaller pool for Thin mode
        poolIncrement: 1,
        poolTimeout: 60
      };
      
      this.isConfigValid = true;
      console.log('Oracle Thin mode configuration initialized successfully');
    } catch (error) {
      this.configError = error.message;
      this.isConfigValid = false;
      console.error('Oracle configuration failed:', error.message);
    }
  }

  validateEnvironment() {
    console.log('Environment variables check for Thin mode:');
    console.log('User:', this.envVars.user ? 'SET' : 'NOT SET');
    console.log('Password:', this.envVars.password ? 'SET' : 'NOT SET');
    console.log('Connection String:', this.envVars.connectionString ? 'SET' : 'NOT SET');
    console.log('Oracle client mode:', oracledb.thin ? 'THIN' : 'THICK');
    
    const missing = [];
    if (!this.envVars.user) missing.push('user');
    if (!this.envVars.password) missing.push('password');
    if (!this.envVars.connectionString) missing.push('connection string');
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log('Environment validation passed for Thin mode');
  }

  // Simple direct connection test (no pool)
  async testDirectConnection() {
    if (!this.isConfigValid) {
      return {
        success: false,
        error: `Configuration invalid: ${this.configError}`
      };
    }

    let connection;
    try {
      console.log('Testing direct connection in Thin mode...');
      console.log('Connection string:', this.envVars.connectionString);
      
      connection = await oracledb.getConnection({
        user: this.envVars.user,
        password: this.envVars.password,
        connectString: this.envVars.connectionString
      });
      
      console.log('Direct connection successful, testing query...');
      const result = await connection.execute('SELECT SYSDATE FROM DUAL');
      
      return {
        success: true,
        timestamp: result.rows[0],
        mode: oracledb.thin ? 'thin' : 'thick'
      };
    } catch (error) {
      console.error('Direct connection test failed:', error);
      return {
        success: false,
        error: error.message,
        mode: oracledb.thin ? 'thin' : 'thick'
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError);
        }
      }
    }
  }

  async executeQuery(sql, binds = []) {
    if (!this.isConfigValid) {
      return {
        success: false,
        error: `Configuration invalid: ${this.configError}`,
        data: null
      };
    }

    let connection;
    try {
      connection = await oracledb.getConnection({
        user: this.envVars.user,
        password: this.envVars.password,
        connectString: this.envVars.connectionString
      });
      
      console.log('Executing query in Thin mode:', sql.substring(0, 100) + '...');
      const result = await connection.execute(sql, binds);
      
      return {
        success: true,
        data: result.rows,
        metadata: result.metaData,
        rowsAffected: result.rowsAffected,
        mode: oracledb.thin ? 'thin' : 'thick'
      };
    } catch (error) {
      console.error('Error executing query:', error);
      return {
        success: false,
        error: error.message,
        data: null,
        mode: oracledb.thin ? 'thin' : 'thick'
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (error) {
          console.error('Error closing connection:', error);
        }
      }
    }
  }

  async testConnection() {
    return await this.testDirectConnection();
  }

  getStatus() {
    return {
      configValid: this.isConfigValid,
      configError: this.configError,
      mode: oracledb.thin ? 'thin' : 'thick',
      oracledbVersion: oracledb.versionString || 'unknown',
      resolvedEnvironment: {
        user: this.envVars.user ? 'SET' : 'NOT SET',
        password: this.envVars.password ? 'SET' : 'NOT SET',
        connectionString: this.envVars.connectionString ? 'SET' : 'NOT SET'
      }
    };
  }
}

export default new ThinOracleConnection();