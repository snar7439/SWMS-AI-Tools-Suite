import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Parse the user_query to extract the reports
    const queryData = JSON.parse(body.user_query);
    const baseReport = queryData.baseline;
    const testReport = queryData.test;
    
    // Convert base64 PDF data to proper format if needed
    let basePdfData = baseReport.pdfData;
    let testPdfData = testReport.pdfData;
    
    // If the PDF data is base64 encoded, we need to handle it properly
    if (typeof basePdfData === 'string' && basePdfData.startsWith('data:application/pdf;base64,')) {
      basePdfData = basePdfData.split(',')[1]; // Remove the data URL prefix
    }
    if (typeof testPdfData === 'string' && testPdfData.startsWith('data:application/pdf;base64,')) {
      testPdfData = testPdfData.split(',')[1]; // Remove the data URL prefix
    }
    
    // Prepare the payload for the agent API with proper binary handling
    const agentPayload = {
      ai_agent_id: body.ai_agent_id,
      user_query: JSON.stringify({
        // instruction: "Compare the following two PDF reports. Extract and analyze their contents thoroughly. Return a structured JSON highlighting ALL differences in text, tables, and layout, along with numeric metrics like severityScore, textDifferenceRatio, and mismatchSections. Be precise in detecting even minor differences.",
        instruction: "Extract and summarize the text content from these two PDF reports.",
        files: {
          baseReport: {
            name: baseReport.name,
            type: "application/pdf",
            data: basePdfData // This should be base64 encoded PDF content
          },
          testReport: {
            name: testReport.name,
            type: "application/pdf", 
            data: testPdfData // This should be base64 encoded PDF content
          }
        },
        compareOptions: {
          detectMinorDifferences: true,
          ignoreTimestamps: false, // Set to false to catch all differences initially
          sensitivityLevel: "high",
          includeLayoutAnalysis: true,
          includeTableAnalysis: true
        }
      }),
      configuration_environment: body.configuration_environment
    };
    
    console.log('Sending to agent:', {
      instruction: agentPayload.user_query.includes('instruction'),
      hasBaseReport: !!basePdfData,
      hasTestReport: !!testPdfData,
      basePdfSize: typeof basePdfData === 'string' ? basePdfData.length : 'not string',
      testPdfSize: typeof testPdfData === 'string' ? testPdfData.length : 'not string'
    });
    
    // Forward the request to the external agent API
    const agentRes = await fetch('https://sage.paastry.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/generic/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentPayload)
    });
    
    if (!agentRes.ok) {
      const errorText = await agentRes.text();
      console.error('Agent API error:', errorText);
      return NextResponse.json({ 
        error: 'Agent API error', 
        status: agentRes.status,
        details: errorText 
      }, { status: agentRes.status });
    }
    
    const data = await agentRes.json();
    console.log('Agent response received:', typeof data.result);
    
    // Parse the response if it's a string
    let parsedResult = data.result || data;
    if (typeof parsedResult === 'string') {
      try {
        parsedResult = JSON.parse(parsedResult);
      } catch (e) {
        console.warn('Failed to parse agent response as JSON:', e);
        // If parsing fails, keep the original result
      }
    }
    
    return NextResponse.json({ result: parsedResult });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}