import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing SWMS connectivity...');
    
    // Test basic connectivity to SWMS
    const testUrl = 'https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net';
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Report-Test-Tool/1.0'
      }
    });
    
    console.log('SWMS Base URL Test:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      available: response.status < 500
    });
    
  } catch (error) {
    console.error('SWMS connectivity test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      available: false
    });
  }
}

export async function POST(request) {
  try {
    const { testType = 'basic' } = await request.json();
    
    if (testType === 'auth') {
      // Test with authentication headers
      const testUrl = 'https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net/report/equipment-overview';
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'syy-site-id': 'LX739Q60',
          'x-session-user-id': 'OPS$TEST0100',
          'x-opco-number': 'swms',
          'x-swms-version': '61.0.0',
        },
        body: JSON.stringify({
          userId: 'OPS$TEST0100',
          opcoNumber: 'swms',
          type: 'PDF',
          reportValue: 'me1ra'
        })
      });
      
      const responseText = await response.text();
      
      return NextResponse.json({
        testType: 'auth',
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText.substring(0, 500)
      });
    }
    
    return NextResponse.json({ error: 'Unknown test type' });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
