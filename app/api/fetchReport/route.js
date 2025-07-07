import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const payload = await request.json();
    
    const {
      userId, 
      opcoNumber, 
      reportValue, 
      reportPath,
      ...additionalPayloadFields // Capture any additional fields for specific reports
    } = payload;

    // Validate required fields
    if (!userId) {
      throw new Error('Missing required field: userId');
    }
    if (!reportPath) {
      throw new Error('Missing required field: reportPath');
    }
    if (!reportValue) {
      throw new Error('Missing required field: reportValue');
    }

    const swmsUrl = `https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net${reportPath}`;

    console.log('Fetching SWMS report:', {
      swmsUrl,
      userId,
      opcoNumber,
      reportValue,
      reportPath,
      additionalFields: additionalPayloadFields
    });

    // Build the complete payload for SWMS
    const swmsPayload = {
      userId,
      opcoNumber: opcoNumber || 'swms',
      type: 'PDF',
      reportValue,
      ...additionalPayloadFields // Include report-specific fields
    };

    console.log('SWMS Request Details:', {
      url: swmsUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'syy-site-id': 'LX739Q60',
        'x-session-user-id': userId,
        'x-opco-number': opcoNumber,
      },
      payload: swmsPayload
    });

    const swmsRes = await fetch(swmsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'syy-site-id': 'LX739Q60',
        'x-session-user-id': userId,
        'x-opco-number': opcoNumber,
        'x-swms-version': '61.0.0',
        'syy-swms-version': '61.0.0',
        'x-bff-version': '2.1.0',
        'x-fe-version': '1.1.4',
        'origin': 'https://lx739q60-swms-frontend-layer.swms-np.us-east-1.aws.sysco.net'
      },
      body: JSON.stringify(swmsPayload),
    });

    if (!swmsRes.ok) {
      // Try to get error details from SWMS response
      let errorDetails = `${swmsRes.status}: ${swmsRes.statusText}`;
      let errorBody = '';
      
      try {
        const errorText = await swmsRes.text();
        if (errorText) {
          errorBody = errorText;
          errorDetails += ` - ${errorText.substring(0, 500)}...`; // Limit error text length
        }
      } catch (e) {
        // If we can't read the response body, just use status
      }
      
      console.error('SWMS API Error Details:', {
        status: swmsRes.status,
        statusText: swmsRes.statusText,
        headers: Object.fromEntries(swmsRes.headers.entries()),
        url: swmsUrl,
        errorBody: errorBody.substring(0, 1000) // Log first 1000 chars of error
      });
      
      // For development: if SWMS is not available, return sample PDF
      if (swmsRes.status === 500 || swmsRes.status === 404) {
        console.log('SWMS not available, returning sample PDF data');
        
        // Create a more robust sample PDF
        const samplePdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 18 Tf
72 720 Td
(SWMS Report - ${reportValue}) Tj
0 -30 Td
/F1 12 Tf
(Generated: ${new Date().toISOString()}) Tj
0 -20 Td
(Status: SWMS API not available - showing sample data) Tj
0 -20 Td
(Report Path: ${reportPath}) Tj
0 -20 Td
(User: ${userId}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000526 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
605
%%EOF`;

        return new NextResponse(Buffer.from(samplePdfContent), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${reportValue}-sample.pdf`,
            'Content-Length': Buffer.from(samplePdfContent).length.toString()
          }
        });
      }
      
      throw new Error(`SWMS API returned ${errorDetails}`);
    }

    const contentType = swmsRes.headers.get('content-type');
    const buffer = await swmsRes.arrayBuffer();

    console.log('Successfully fetched SWMS report:', {
      contentType,
      bufferSize: buffer.byteLength
    });

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Content-Disposition': swmsRes.headers.get('content-disposition') || 'attachment; filename=report.pdf'
      }
    });

  } catch (err) {
    console.error('SWMS report fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch report', details: err.message },
      { status: 500 }
    );
  }
}
