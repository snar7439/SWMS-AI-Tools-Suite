// app/api/retrieve-logs/route.js
import { NextResponse } from 'next/server';
import oracleConnection from '../../lib/database/oracle-thin.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      environment, 
      environmentType, 
      issueTimeFrom, 
      issueTimeTo, 
      sessionId,
      timezoneOffsetMinutes  
    } = body;

    // Validate required parameters
    if (!environment) {
      return NextResponse.json(
        { success: false, error: 'Environment is required' },
        { status: 400 }
      );
    }

    if (!issueTimeFrom) {
      return NextResponse.json(
        { success: false, error: 'Issue start time is required' },
        { status: 400 }
      );
    }

    // Convert the datetime-local input to proper local time
    let issueTime;
    
    if (timezoneOffsetMinutes !== undefined) {
      // Method 1: Use timezone offset to adjust the time
      
      // Parse the datetime-local string as if it were UTC
      const dateTimeString = issueTimeFrom.includes('T') ? issueTimeFrom : issueTimeFrom + 'T00:00';
      const tempDate = new Date(dateTimeString + (dateTimeString.includes('Z') ? '' : 'Z'));
      
      // Adjust to get the correct local time
      issueTime = new Date(tempDate.getTime());
      
      console.log(`Timezone offset: ${timezoneOffsetMinutes} minutes`);
      console.log(`Original datetime-local value: ${issueTimeFrom}`);
      console.log(`Parsed as: ${tempDate.toISOString()}`);
      console.log(`Adjusted to local time: ${issueTime.toISOString()}`);
    } else {
      // Method 2: Fallback - parse as local time components
      const dateTimeString = issueTimeFrom.includes('T') ? issueTimeFrom : issueTimeFrom + 'T00:00';
      const tempDate = new Date(dateTimeString + 'Z'); // Parse as UTC first
      
      // Create a new date with the same components but as local time
      issueTime = new Date(
        tempDate.getUTCFullYear(),
        tempDate.getUTCMonth(),
        tempDate.getUTCDate(),
        tempDate.getUTCHours(),
        tempDate.getUTCMinutes(),
        tempDate.getUTCSeconds()
      );
      
      console.log(`No timezone offset provided, using fallback method`);
      console.log(`Original: ${issueTimeFrom} -> Adjusted: ${issueTime.toISOString()}`);
    }

    // Validate date
    if (isNaN(issueTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid issue time format' },
        { status: 400 }
      );
    }

    // Determine if this is a production environment
    const isProd = environmentType === 'production';
    
    // Extract environment ID from the environment object or string
    let envId;
    if (typeof environment === 'object' && environment.envId) {
      envId = environment.envId;
    } else if (typeof environment === 'string') {
      envId = environment;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid environment format' },
        { status: 400 }
      );
    }

    console.log(`Starting log retrieval for environment: ${envId} (${environmentType})`);
    console.log(`Issue time: ${issueTimeFrom} (will retrieve 30 minutes before to 15 minutes after)`);

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${Date.now()}_${envId}`;

    // Test database connection first
    console.log('Testing database connection...');
    const connectionTest = await oracleConnection.testConnection(envId, isProd);
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: `Database connection failed: ${connectionTest.error}`,
        step: 'database_connection'
      }, { status: 500 });
    }

    console.log('Database connection successful, proceeding with log retrieval...');

    // Retrieve logs from both tables
    const logResults = await oracleConnection.retrieveAllLogs(
      envId,
      isProd,
      issueTime,
      finalSessionId
    );

    if (logResults.success) {
      return NextResponse.json({
        success: true,
        sessionId: logResults.sessionId,
        summary: logResults.summary,
        message: `Successfully retrieved ${logResults.summary.totalRecords} log records`,
        environment: {
          id: envId,
          type: environmentType,
          isProd: isProd
        },
        timeRange: logResults.timeRange
      });
    } else {
      return NextResponse.json({
        success: false,
        error: logResults.error,
        sessionId: logResults.sessionId,
        step: 'log_retrieval'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in retrieve-logs API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      step: 'api_processing'
    }, { status: 500 });
  }
}

// GET endpoint to check the status of log retrieval
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if temporary files exist for this session
    const path = require('path');
    const fs = require('fs');
    
    const tempDir = path.join(process.cwd(), 'temp_logs', sessionId);
    
    if (!fs.existsSync(tempDir)) {
      return NextResponse.json({
        success: false,
        error: 'Session not found or logs have been cleaned up',
        sessionId: sessionId
      }, { status: 404 });
    }

    // Check for log files
    const swmsLogFile = path.join(tempDir, 'swms_log.json');
    const rfLogFile = path.join(tempDir, 'rf_log.json');
    
    const status = {
      sessionId: sessionId,
      swmsLogExists: fs.existsSync(swmsLogFile),
      rfLogExists: fs.existsSync(rfLogFile),
      files: []
    };

    if (status.swmsLogExists) {
      const swmsStats = fs.statSync(swmsLogFile);
      status.files.push({
        name: 'swms_log.json',
        size: swmsStats.size,
        created: swmsStats.birthtime
      });
    }

    if (status.rfLogExists) {
      const rfStats = fs.statSync(rfLogFile);
      status.files.push({
        name: 'rf_log.json',
        size: rfStats.size,
        created: rfStats.birthtime
      });
    }

    return NextResponse.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('Error checking log retrieval status:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE endpoint to clean up temporary files
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const cleanupAll = searchParams.get('cleanupAll') === 'true';

    if (!sessionId && !cleanupAll) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required unless cleanupAll=true' },
        { status: 400 }
      );
    }

    if (cleanupAll) {
      // Clean up all temporary files
      const result = await oracleConnection.cleanupTempFiles(null);
      return NextResponse.json(result);
    }

    // Clean up specific session and find related SSH sessions
    const result = await cleanupSessionAndRelated(sessionId);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to clean up a session and find related SSH sessions
async function cleanupSessionAndRelated(sessionId) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const tempLogsDir = path.join(process.cwd(), 'temp_logs');
    const deletedDirs = [];
    let totalDeleted = 0;

    // First, clean up the main session using the oracle connection
    const mainResult = await oracleConnection.cleanupTempFiles(sessionId);
    if (mainResult.deletedDirectories > 0) {
      totalDeleted += mainResult.deletedDirectories;
    }

    // Now find and clean up all SSH sessions that might be related
    // Strategy: Look for SSH sessions that were created around the same time
    if (await fs.access(tempLogsDir).then(() => true).catch(() => false)) {
      const allDirs = await fs.readdir(tempLogsDir);
      
      // Extract timestamp from the main session ID
      let mainTimestamp = null;
      if (sessionId.startsWith('session_')) {
        const parts = sessionId.split('_');
        if (parts.length >= 2) {
          mainTimestamp = parseInt(parts[1]);
        }
      }
      
      if (mainTimestamp) {
        // Look for SSH sessions within a 10-minute window (600,000 ms)
        const timeWindow = 10 * 60 * 1000; // 10 minutes
        
        for (const dir of allDirs) {
          if (dir.startsWith('ssh_session_')) {
            const sshParts = dir.split('_');
            if (sshParts.length >= 3) {
              const sshTimestamp = parseInt(sshParts[2]);
              
              // If the SSH session was created within the time window, delete it
              if (Math.abs(sshTimestamp - mainTimestamp) <= timeWindow) {
                try {
                  const fullDirPath = path.join(tempLogsDir, dir);
                  const stat = await fs.stat(fullDirPath);
                  
                  if (stat.isDirectory()) {
                    await fs.rm(fullDirPath, { recursive: true, force: true });
                    deletedDirs.push(dir);
                    totalDeleted++;
                    console.log(`Cleaned up related SSH session: ${dir}`);
                  }
                } catch (dirError) {
                  console.warn(`Error cleaning SSH session ${dir}:`, dirError.message);
                }
              }
            }
          }
        }
      }
    }

    const message = totalDeleted > 0 
      ? `Successfully cleaned up ${totalDeleted} session directory(ies)${deletedDirs.length > 0 ? ` including SSH sessions: ${deletedDirs.join(', ')}` : ''}`
      : 'No temporary files found to clean up';

    return {
      success: true,
      message: message,
      deletedDirectories: totalDeleted,
      sshSessionsDeleted: deletedDirs.length,
      sshSessions: deletedDirs
    };

  } catch (error) {
    console.error('Error in cleanupSessionAndRelated:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
