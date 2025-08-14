// lib/database/oracle-thin.js
import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';

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
    this.tempDataDir = path.join(process.cwd(), 'temp_logs');
  }

  // Build dynamic connection string based on environment
  buildConnectionString(environment = null, isProd = false) {
    if (!environment) {
      return process.env.ORACLE_CONNECTION_STRING || 'localhost:1521/xe';
    }

    // Extract environment ID from environment object or string
    let envId;
    if (typeof environment === 'object' && environment.envId) {
      envId = environment.envId;
    } else if (typeof environment === 'string') {
      envId = environment.startsWith('lx') ? environment.substring(2) : environment;
    } else {
      envId = environment;
    }

    if (isProd) {
      // Production format: swmsdb001.na.sysco.net:1521/swm1
      return `swmsdb${envId}.na.sysco.net:1521/swm1`;
    } else {
      // Development format: lx739q21-db.swms-np.us-east-1.aws.sysco.net:1521/swm1
      return `lx${envId}-db.swms-np.us-east-1.aws.sysco.net:1521/swm1`;
    }
  }

  getEnvironmentVariables(environment = null, isProd = false) {
    let user, password;
    
    if (isProd) {
      // Production environment credentials
      user = process.env.ORACLE_PROD_USER || 
             process.env.ORACLE_PROD_USERNAME ||
             process.env.PROD_ORACLE_USER
      
      password = process.env.ORACLE_PROD_PASSWORD || 
                 process.env.ORACLE_PROD_PASS ||
                 process.env.PROD_ORACLE_PASSWORD;
    } else {
      // Development environment credentials
      user = process.env.ORACLE_DEV_USER || 
             process.env.ORACLE_USER || 
             process.env.ORACLE_DB_USER || 
             process.env.DB_USER ||
             process.env.ORACLE_USERNAME;

      password = process.env.ORACLE_DEV_PASSWORD ||
                 process.env.ORACLE_PASSWORD || 
                 process.env.ORACLE_DB_PASSWORD || 
                 process.env.DB_PASSWORD ||
                 process.env.ORACLE_PASS;
    }

    // Use environment-specific connection string if environment is provided
    const connectionString = environment 
                            ? this.buildConnectionString(environment, isProd)
                            : (process.env.ORACLE_CONNECTION_STRING || 
                               process.env.ORACLE_DB_CONNECT_STRING || 
                               process.env.ORACLE_CONNECT_STRING ||
                               process.env.DB_CONNECTION_STRING ||
                               process.env.DATABASE_URL ||
                               this.buildConnectionString());

    return { user, password, connectionString };
  }

  initializeConfig(environment = null, isProd = false) {
    try {
      this.envVars = this.getEnvironmentVariables(environment, isProd);
      this.validateEnvironment(isProd);
      
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
      console.log(`Oracle Thin mode configuration initialized successfully for environment: ${environment || 'default'} (Production: ${isProd})`);
      console.log(`Connection string: ${this.envVars.connectionString}`);
    } catch (error) {
      this.configError = error.message;
      this.isConfigValid = false;
      console.error('Oracle configuration failed:', error.message);
    }
  }

  validateEnvironment(isProd = false) {
    console.log(`Environment variables check for Thin mode (${isProd ? 'Production' : 'Development'}):`);
    console.log('User:', this.envVars.user ? `SET (${this.envVars.user})` : 'NOT SET');
    console.log('Password:', this.envVars.password ? 'SET' : 'NOT SET');
    console.log('Connection String:', this.envVars.connectionString ? 'SET' : 'NOT SET');
    console.log('Oracle client mode:', oracledb.thin ? 'THIN' : 'THICK');
    
    const missing = [];
    if (!this.envVars.user) missing.push('user');
    if (!this.envVars.password) missing.push('password');
    if (!this.envVars.connectionString) missing.push('connection string');
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for ${isProd ? 'production' : 'development'}: ${missing.join(', ')}`);
    }

    console.log(`Environment validation passed for Thin mode (${isProd ? 'Production' : 'Development'})`);
  }

  // Simple direct connection test (no pool)
  async testDirectConnection(environment = null, isProd = false) {
    // If environment is provided, reinitialize configuration
    if (environment) {
      this.initializeConfig(environment, isProd);
    }
    
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

  async executeQuery(sql, binds = [], environment = null, isProd = false) {
    // If environment is provided, reinitialize configuration
    if (environment) {
      this.initializeConfig(environment, isProd);
    }
    
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

  async testConnection(environment = null, isProd = false) {
    return await this.testDirectConnection(environment, isProd);
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

  // Create temporary directory for log storage
  async ensureTempDirectory() {
    try {
      if (!fs.existsSync(this.tempDataDir)) {
        fs.mkdirSync(this.tempDataDir, { recursive: true });
        console.log(`Created temporary directory: ${this.tempDataDir}`);
      }
      return this.tempDataDir;
    } catch (error) {
      console.error('Error creating temporary directory:', error);
      throw new Error(`Failed to create temporary directory: ${error.message}`);
    }
  }

  // Clean up temporary files
  async cleanupTempFiles(sessionId = null) {
    try {
      if (sessionId) {
        // Clean up specific session directory
        const targetDir = path.join(this.tempDataDir, sessionId);
        
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true });
          console.log(`Cleaned up session directory: ${targetDir}`);
          return { success: true, message: `Session directory cleaned up: ${sessionId}`, deletedDirectories: 1 };
        } else {
          return { success: true, message: 'No temporary files to clean up', deletedDirectories: 0 };
        }
      } else {
        // Clean up entire temp directory
        if (fs.existsSync(this.tempDataDir)) {
          fs.rmSync(this.tempDataDir, { recursive: true, force: true });
          console.log(`Cleaned up all temporary files from: ${this.tempDataDir}`);
          return { success: true, message: 'All temporary files cleaned up successfully' };
        }
        
        return { success: true, message: 'No temporary files to clean up' };
      }
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate time range: 30 minutes before and 15 minutes after the given time
  calculateTimeRange(issueTime) {
    const issueDate = new Date(issueTime);
    
    // 30 minutes before the issue time
    const startTime = new Date(issueDate.getTime() - (30 * 60 * 1000));
    
    // 15 minutes after the issue time
    const endTime = new Date(issueDate.getTime() + (15 * 60 * 1000));
    
    return {
      startTime: startTime,
      endTime: endTime,
      startTimeString: startTime.toISOString(),
      endTimeString: endTime.toISOString()
    };
  }

  // Retrieve SWMS_LOG table data
  async retrieveSwmsLog(environment, isProd = false, issueTime = null, sessionId = null) {
    try {
      // Initialize connection for specific environment
      this.initializeConfig(environment, isProd);
      
      let whereClause = '';
      let binds = [];
      
      if (issueTime) {
        const timeRange = this.calculateTimeRange(issueTime);
        whereClause = 'WHERE ADD_DATE BETWEEN :timeFrom AND :timeTo';
        binds = [timeRange.startTime, timeRange.endTime];
        console.log(`Time range: ${timeRange.startTimeString} to ${timeRange.endTimeString}`);
      }

      const sql = `
        SELECT 
          PROCESS_ID,
          USER_ID,
          USERENV_ID,
          ADD_DATE,
          APPLICATION_FUNC,
          MSG_TYPE,
          PROGRAM_NAME,
          PROCEDURE_NAME,
          MSG_NO,
          MSG_TEXT,
          SQL_ERR_MSG,
          MSG_ALERT
        FROM SWMS_LOG 
        ${whereClause}
        ORDER BY ADD_DATE DESC
      `;

      console.log(`Retrieving SWMS_LOG data from environment: ${environment}`);
      const result = await this.executeQuery(sql, binds, environment, isProd);
      
      if (result.success) {
        // Save to temporary file
        await this.ensureTempDirectory();
        const sessionDir = sessionId ? path.join(this.tempDataDir, sessionId) : this.tempDataDir;
        if (!fs.existsSync(sessionDir)) {
          fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        const filename = path.join(sessionDir, 'swms_log.json');
        fs.writeFileSync(filename, JSON.stringify(result.data, null, 2));
        
        console.log(`SWMS_LOG data saved to: ${filename}`);
        console.log(`Retrieved ${result.data.length} records from SWMS_LOG`);
        
        return {
          success: true,
          data: result.data,
          count: result.data.length,
          filePath: filename,
          tableName: 'SWMS_LOG'
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error retrieving SWMS_LOG:', error);
      return {
        success: false,
        error: error.message,
        tableName: 'SWMS_LOG'
      };
    }
  }

  // Retrieve RF_LOG table data
  async retrieveRfLog(environment, isProd = false, issueTime = null, sessionId = null) {
    try {
      // Initialize connection for specific environment
      this.initializeConfig(environment, isProd);
      
      let whereClause = '';
      let binds = [];
      
      if (issueTime) {
        const timeRange = this.calculateTimeRange(issueTime);
        whereClause = 'WHERE ADD_DATE BETWEEN :timeFrom AND :timeTo';
        binds = [timeRange.startTime, timeRange.endTime];
        console.log(`Time range: ${timeRange.startTimeString} to ${timeRange.endTimeString}`);
      }

      const sql = `
        SELECT 
          ADD_DATE,
          MSG_SEQ,
          USER_ID,
          IP_ADDRESS,
          SID,
          SERIAL#,
          CALLER_OWNER,
          CALLER_NAME,
          CALLER_LINENO,
          CALLER_CALLER_T,
          RF_STATUS,
          EVENT,
          MSG_PRIORITY,
          MSG_TEXT,
          INIT_RECORD
        FROM RF_LOG 
        ${whereClause}
        ORDER BY ADD_DATE DESC
      `;

      console.log(`Retrieving RF_LOG data from environment: ${environment}`);
      const result = await this.executeQuery(sql, binds, environment, isProd);
      
      if (result.success) {
        // Save to temporary file
        await this.ensureTempDirectory();
        const sessionDir = sessionId ? path.join(this.tempDataDir, sessionId) : this.tempDataDir;
        if (!fs.existsSync(sessionDir)) {
          fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        const filename = path.join(sessionDir, 'rf_log.json');
        fs.writeFileSync(filename, JSON.stringify(result.data, null, 2));
        
        console.log(`RF_LOG data saved to: ${filename}`);
        console.log(`Retrieved ${result.data.length} records from RF_LOG`);
        
        return {
          success: true,
          data: result.data,
          count: result.data.length,
          filePath: filename,
          tableName: 'RF_LOG'
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error retrieving RF_LOG:', error);
      return {
        success: false,
        error: error.message,
        tableName: 'RF_LOG'
      };
    }
  }

  // Retrieve both log tables for root cause analysis
  async retrieveAllLogs(environment, isProd = false, issueTime = null, sessionId = null) {
    try {
      console.log(`Starting log retrieval for environment: ${environment} (Production: ${isProd})`);
      
      const timeRange = issueTime ? this.calculateTimeRange(issueTime) : null;
      
      const results = {
        sessionId: sessionId || `session_${Date.now()}`,
        environment: environment,
        isProd: isProd,
        issueTime: issueTime,
        timeRange: timeRange ? { 
          from: timeRange.startTimeString, 
          to: timeRange.endTimeString,
          description: '30 minutes before to 15 minutes after issue time'
        } : null,
        logs: {}
      };

      // Retrieve SWMS_LOG
      console.log('Retrieving SWMS_LOG...');
      const swmsLogResult = await this.retrieveSwmsLog(environment, isProd, issueTime, results.sessionId);
      results.logs.swmsLog = swmsLogResult;

      // Retrieve RF_LOG
      console.log('Retrieving RF_LOG...');
      const rfLogResult = await this.retrieveRfLog(environment, isProd, issueTime, results.sessionId);
      results.logs.rfLog = rfLogResult;

      // Check if both retrievals were successful
      const success = swmsLogResult.success && rfLogResult.success;
      
      if (success) {
        const totalRecords = (swmsLogResult.count || 0) + (rfLogResult.count || 0);
        console.log(`Successfully retrieved ${totalRecords} total log records`);
        
        return {
          success: true,
          sessionId: results.sessionId,
          summary: {
            swmsLogCount: swmsLogResult.count || 0,
            rfLogCount: rfLogResult.count || 0,
            totalRecords: totalRecords,
            environment: environment,
            isProd: isProd
          },
          logs: results.logs
        };
      } else {
        const errors = [];
        if (!swmsLogResult.success) errors.push(`SWMS_LOG: ${swmsLogResult.error}`);
        if (!rfLogResult.success) errors.push(`RF_LOG: ${rfLogResult.error}`);
        
        return {
          success: false,
          sessionId: results.sessionId,
          error: `Failed to retrieve logs: ${errors.join('; ')}`,
          logs: results.logs
        };
      }
    } catch (error) {
      console.error('Error in retrieveAllLogs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ThinOracleConnection();