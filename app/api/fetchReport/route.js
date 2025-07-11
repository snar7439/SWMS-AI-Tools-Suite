import { NextResponse } from 'next/server';
import { swmsReports } from '../../lib/reportsConfig';

export async function POST(request) {
  try {
    const receivedPayload = await request.json();
    console.log('Received payload from browser:', receivedPayload);

    // Get authentication info from cookies
    const swmsSessionCookie = request.cookies.get('swms-session')?.value;
    const authenticatedUsername = request.cookies.get('swms-username')?.value;

    if (!swmsSessionCookie || !authenticatedUsername) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          details: 'Please login first to access SWMS reports' 
        },
        { status: 401 }
      );
    }

    console.log('Using authenticated user:', authenticatedUsername);

    // Look up reportPath from the config using reportValue
    const reportConfig = swmsReports.find(report => 
      report.payload.reportValue === receivedPayload.reportValue
    );
    
    if (!reportConfig) {
      throw new Error(`No report configuration found for reportValue: ${receivedPayload.reportValue}`);
    }
    
    const swmsUrl = `${process.env.REPORTS_API_URL || 'https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net'}${reportConfig.reportPath}`;

    // Use the authenticated username for the payload, with OPS$ prefix if not already present
    const formattedUsername = authenticatedUsername.startsWith('OPS$') ? authenticatedUsername : `OPS$${authenticatedUsername}`;
    const finalPayload = {
      ...receivedPayload,
      userId: formattedUsername
    };

    console.log('Using authenticated payload for SWMS:', finalPayload);
    console.log('Fetching SWMS report from:', swmsUrl);

    const swmsRes = await fetch(swmsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'syy-site-id': 'LX739Q60',
        'x-opco-number': 'lx739q60',
        'x-session-user-id': formattedUsername,
        'x-swms-version': '61.0.0',
        'accept-language': 'en-US',
        'cookie': '_ga=GA1.1.1134090752.1749581339; _ga_ML9Z3SL0FP=GS2.1.s1751296511$o15$g1$t1751296678$j60$l0$h0; swmslx739q60=bb7f6a8598dc9193f4919dd8735545c8c4ac0ab8518f20d85cb08ba8f96f85d6' //swmsSessionCookie // Use the authenticated session cookie
      },
      body: JSON.stringify(finalPayload), // Use the payload with authenticated username
    });

    if (!swmsRes.ok) {
      // Try to get the actual error response
      let errorBody = '';
      try {
        errorBody = await swmsRes.text();
        console.error('SWMS API Error Response:', errorBody);
      } catch (e) {
        console.error('Could not read SWMS error response');
      }
      
      throw new Error(`SWMS API Error (${swmsRes.status}): ${swmsRes.statusText} - ${errorBody}`);
    }

    const buffer = await swmsRes.arrayBuffer();
    console.log('Successfully fetched SWMS report, size:', buffer.byteLength);

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=report.pdf'
      }
    });

  } catch (err) {
    console.error('SWMS report fetch error:', err.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch report', 
        details: err.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
