import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Check if session cookies exist
    const swmsSessionCookie = request.cookies.get('swms-session')?.value;
    const authenticatedUsername = request.cookies.get('swms-username')?.value;

    if (!swmsSessionCookie || !authenticatedUsername) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session found'
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      username: authenticatedUsername,
      sessionExists: true
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
