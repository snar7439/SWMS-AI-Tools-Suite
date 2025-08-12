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
      sessionId 
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
    console.log(`Issue time: ${issueTimeFrom} (will retrieve 2 hours before to 30 minutes after)`);

    // Convert time string to Date object
    const issueTime = new Date(issueTimeFrom);

    // Validate date
    if (isNaN(issueTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid issue time format' },
        { status: 400 }
      );
    }

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

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const result = await oracleConnection.cleanupTempFiles(sessionId);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
