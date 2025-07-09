import { NextResponse } from 'next/server';
import { swmsReports } from '../../lib/reportsConfig';

export async function POST(request) {
  try {
    const receivedPayload = await request.json();
    console.log('Received payload from browser:', receivedPayload);

    // Look up reportPath from the config using reportValue
    const reportConfig = swmsReports.find(report => 
      report.payload.reportValue === receivedPayload.reportValue
    );
    
    if (!reportConfig) {
      throw new Error(`No report configuration found for reportValue: ${receivedPayload.reportValue}`);
    }
    
    const swmsUrl = `${process.env.REPORTS_API_URL || 'https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net'}${reportConfig.reportPath}`;

    console.log('Using received payload for SWMS (with user ID override):', receivedPayload);
    console.log('Fetching SWMS report from:', swmsUrl);

    const swmsRes = await fetch(swmsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'syy-site-id': 'LX739Q60',
        'x-opco-number': 'lx739q60',
        'x-session-user-id': 'OPS$TEST0100',
        'x-swms-version': '61.0.0',
        'accept-language': 'en-US',
        'cookie': '_ga=GA1.1.1134090752.1749581339; _ga_ML9Z3SL0FP=GS2.1.s1751296511$o15$g1$t1751296678$j60$l0$h0; swmslx739q60=3f5e993aab2c083be9cbb778523d9303f045bec9249d313513dec9e6bc7f4675'
      },
      body: JSON.stringify(receivedPayload), // Use the payload from browser (with user ID override)
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
