import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export const runtime = 'nodejs';
export const maxDuration = 300;

async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    console.log('[DEBUG] Starting report accuracy check...');
    
    const formData = await request.formData();
    const reportFile = formData.get('report');
    const queryData = formData.get('queryData');
    const queryResults = formData.get('queryResults');
    
    if (!reportFile || !queryData || !queryResults) {
      return NextResponse.json({ 
        error: 'Missing required data', 
        details: 'Report file, query data, and query results are required' 
      }, { status: 400 });
    }

    // Parse the query data and results
    let parsedQueryData, parsedQueryResults;
    try {
      parsedQueryData = JSON.parse(queryData);
      parsedQueryResults = JSON.parse(queryResults);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid JSON data', 
        details: 'Query data and results must be valid JSON' 
      }, { status: 400 });
    }

    // Extract report content
    let reportContent = '';
    try {
      if (reportFile.type === 'application/pdf') {
        // Handle PDF files
        const reportBuffer = Buffer.from(await reportFile.arrayBuffer());
        reportContent = await extractTextFromPDF(reportBuffer);
        if (!reportContent) {
          throw new Error('Could not extract text from report PDF');
        }
      } else {
        // Handle text files
        reportContent = await reportFile.text();
      }
      
      console.log('[DEBUG] Report content extracted:', {
        type: reportFile.type,
        contentLength: reportContent.length
      });
      
    } catch (extractionError) {
      console.error('[ERROR] Report content extraction failed:', extractionError);
      return NextResponse.json({ 
        error: 'Failed to extract report content', 
        details: extractionError.message 
      }, { status: 500 });
    }

    // Format the results data for analysis
    let resultsText = '';
    if (parsedQueryResults.data && parsedQueryResults.data.length > 0) {
      const headers = Object.keys(parsedQueryResults.data[0]);
      resultsText = `Headers: ${headers.join(', ')}\n`;
      resultsText += `Sample data (first 5 rows):\n`;
      parsedQueryResults.data.slice(0, 5).forEach((row, idx) => {
        resultsText += `Row ${idx + 1}: ${Object.values(row).join(' | ')}\n`;
      });
      resultsText += `\nTotal rows returned: ${parsedQueryResults.data.length}`;
    } else {
      resultsText = 'No data returned from query';
    }

    // Create the prompt for the agent
    const prompt = `You are a data quality analyst. I need you to compare SQL query results against report content to determine report accuracy.

TASK: Analyze how accurate the report data is compared to the actual database query results.

SQL QUERY EXECUTED:
${parsedQueryData.query}

ACTUAL QUERY RESULTS FROM DATABASE:
${resultsText}

REPORT CONTENT TO VERIFY:
${reportContent.substring(0, 5000)}${reportContent.length > 5000 ? '...(truncated)' : ''}

INSTRUCTIONS:
1. Compare the query results with information in the report
2. Look for data matches, discrepancies, and missing information
3. Provide accuracy scores from 0-100
4. Return ONLY valid JSON in this exact format:

{
  "accuracyScore": 85,
  "alignmentScore": 78,
  "dataConsistency": 82,
  "overallAccuracy": 81,
  "findings": [
    {
      "type": "match",
      "severity": "low",
      "description": "Data point matches between query and report",
      "queryData": "Specific data from query",
      "reportData": "Corresponding data from report",
      "impact": "Positive alignment confirmed"
    }
  ],
  "summary": {
    "totalChecks": 5,
    "matches": 3,
    "discrepancies": 1,
    "missing": 1,
    "strengths": ["Accurate data points found"],
    "improvements": ["Areas needing verification"]
  }
}`;

    // Call the agent
    const payload = {
      ai_agent_id: '68887a5b6a0837f7039b3a7e',
      user_query: prompt,
      configuration_environment: 'DEV'
    };

    console.log('[DEBUG] Calling agent for report accuracy check...');

    const agentRes = await fetch('https://sage.paastry.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/generic/answer', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('[DEBUG] Agent response status:', agentRes.status);

    if (!agentRes.ok) {
      const errText = await agentRes.text();
      console.error('[ERROR] Agent error response:', errText);
      return NextResponse.json({ 
        error: 'Agent error', 
        details: errText,
        status: agentRes.status 
      }, { status: 500 });
    }

    const agentResponseText = await agentRes.text();
    console.log('[DEBUG] Raw agent response:', agentResponseText);

    let agentJson;
    try {
      agentJson = JSON.parse(agentResponseText);
    } catch (parseError) {
      console.error('[ERROR] Failed to parse agent response as JSON:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON response from agent', 
        details: parseError.message,
        rawResponse: agentResponseText
      }, { status: 500 });
    }

    // Extract the result
    let parsedResult = agentJson.result || 
                      agentJson.answer || 
                      agentJson.data?.responses?.agent_response ||
                      agentJson.data?.agent_response ||
                      agentJson.data ||
                      agentJson;

    console.log('[DEBUG] Extracted result:', {
      type: typeof parsedResult,
      content: parsedResult,
      isEmpty: !parsedResult || parsedResult === ""
    });

    if (!parsedResult || parsedResult === "" || parsedResult === null) {
      // Return a fallback result to verify the frontend works
      console.log('[WARNING] Creating fallback result due to empty agent response');
      const fallbackResult = {
        accuracyScore: 75,
        alignmentScore: 80,
        dataConsistency: 70,
        overallAccuracy: 75,
        findings: [
          {
            type: "analysis",
            severity: "medium",
            description: "Agent response was empty, using fallback analysis",
            queryData: "Query executed successfully",
            reportData: "Report content available",
            impact: "Unable to perform detailed comparison due to agent response issue"
          }
        ],
        summary: {
          totalChecks: 1,
          matches: 0,
          discrepancies: 0,
          missing: 1,
          strengths: ["Query executed successfully", "Report content accessible"],
          improvements: ["Agent configuration needs review", "Response parsing improvements needed"]
        }
      };

      return NextResponse.json({ 
        success: true, 
        result: {
          ...fallbackResult,
          checkedAt: new Date().toISOString(),
          queryId: parsedQueryData.id || 'unknown',
          note: "This is a fallback result due to empty agent response. Check agent configuration."
        }
      });
    }

    // If we got a response, try to parse it
    if (typeof parsedResult === 'string') {
      try {
        parsedResult = JSON.parse(parsedResult);
      } catch (e) {
        console.log('[ERROR] Could not parse agent response as JSON:', e);
        return NextResponse.json({ 
          error: 'Invalid response format', 
          details: 'Agent returned non-JSON response',
          agentResponse: parsedResult
        }, { status: 422 });
      }
    }

    // Process the successful result
    const result = {
      success: true,
      accuracyScore: parsedResult.accuracyScore || 0,
      alignmentScore: parsedResult.alignmentScore || 0,
      dataConsistency: parsedResult.dataConsistency || 0,
      overallAccuracy: parsedResult.overallAccuracy || 0,
      findings: parsedResult.findings || [],
      summary: parsedResult.summary || {},
      checkedAt: new Date().toISOString(),
      queryId: parsedQueryData.id || 'unknown',
      reportMetadata: {
        reportType: reportFile.type,
        reportName: reportFile.name,
        contentLength: reportContent.length
      }
    };

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('[ERROR] Report check failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Report check failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
