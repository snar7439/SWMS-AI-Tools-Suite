// app/api/test-thin/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to import thin connection with correct path for App Router
    const thinConnection = (await import('../../lib/database/oracle-thin.js')).default;
    
    // Get status
    const status = thinConnection.getStatus();
    console.log('Thin connection status:', status);

    if (!status.configValid) {
      return NextResponse.json({
        success: false,
        error: status.configError,
        status: status
      }, { status: 500 });
    }

    // Test connection
    const testResult = await thinConnection.testConnection();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'Database connection successful' : 'Connection failed',
      timestamp: testResult.timestamp,
      error: testResult.error,
      mode: testResult.mode,
      status: status
    });
  } catch (importError) {
    console.error('Import error:', importError);
    return NextResponse.json({
      success: false,
      error: 'Failed to import Oracle connection module',
      details: importError.message,
      stack: importError.stack
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const thinConnection = (await import('../../lib/database/oracle-thin.js')).default;
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      return NextResponse.json({
        success: false,
        error: 'Only SELECT queries are allowed for testing'
      }, { status: 400 });
    }

    const result = await thinConnection.executeQuery(query);
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      metadata: result.metadata,
      error: result.error || null,
      rowCount: result.data ? result.data.length : 0,
      mode: result.mode
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}