import { NextResponse } from 'next/server';
import { swmsReports } from '../../lib/reportsConfig';

export async function POST(request) {
  try {
    const receivedPayload = await request.json();
    console.log('Received payload from browser:', receivedPayload);

    // Get authentication info from cookies
    const authenticatedUsername = request.cookies.get('swms-username')?.value;
    const allSessionCookies = request.cookies.get('swms-session-all')?.value;
    
    // Also get individual cookies in case we need them
    const individualCookies = {};
    
    // Get all cookies and filter for SWMS ones
    const allCookies = request.cookies.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('swms-') && cookie.name !== 'swms-username' && cookie.name !== 'swms-session-all') {
        const cookieName = cookie.name.replace('swms-', '');
        individualCookies[cookieName] = cookie.value;
      }
    });

    console.log('Available cookies for report fetching:', {
      authenticatedUsername,
      allSessionCookies,
      individualCookies: Object.keys(individualCookies),
      cookieDetails: individualCookies,
      totalCookiesFound: allCookies.length
    });

    if (!authenticatedUsername || (!allSessionCookies && Object.keys(individualCookies).length === 0)) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          details: 'Please login first to access SWMS reports. Missing session cookies.' 
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
    
    const swmsUrl = `${process.env.REPORTS_API_URL || 'https://lx739q21-swms-service-layer.swms-np.us-east-1.aws.sysco.net'}${reportConfig.reportPath}`;

    // Use the authenticated username for the payload, with OPS$ prefix if not already present
    const formattedUsername = authenticatedUsername.startsWith('OPS$') ? authenticatedUsername : `OPS$${authenticatedUsername}`;
    const finalPayload = {
      ...receivedPayload,
      userId: formattedUsername
    };

    console.log('Using authenticated payload for SWMS:', finalPayload);
    console.log('Fetching SWMS report from:', swmsUrl);

    // Prepare cookies for the request
    let cookieHeader = '';
    if (allSessionCookies) {
      // Use the combined cookie string if available
      cookieHeader = allSessionCookies;
    } else {
      // Build cookie string from individual cookies
      const cookiePairs = Object.entries(individualCookies).map(([name, value]) => `${name}=${value}`);
      cookieHeader = cookiePairs.join('; ');
    }

    console.log('Using cookie header for SWMS request:', cookieHeader);

    const swmsRes = await fetch(swmsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'syy-site-id': 'LX739Q21',
        'x-opco-number': 'lx739q21',
        'x-session-user-id': formattedUsername,
        'x-swms-version': '61.0.0',
        'accept-language': 'en-US',
        'accept': 'application/json',
        'user-agent': 'SWMS-Report-Tool/1.0',
        'cookie': cookieHeader // Use all session cookies
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
