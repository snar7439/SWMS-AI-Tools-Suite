import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { adminKey, action } = await request.json();
    
    // Server-side admin key
    const ADMIN_KEY = process.env.ADMIN_KEY;
    
    if (!ADMIN_KEY) {
      console.error('ADMIN_KEY not configured in environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Validate admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin key' },
        { status: 401 }
      );
    }
    
    // If validation passes, return success
    return NextResponse.json({ 
      success: true, 
      message: `Admin access granted for action: ${action}` 
    });
    
  } catch (error) {
    console.error('Admin validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
