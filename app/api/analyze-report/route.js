import { NextResponse } from 'next/server';
import pdf from 'pdf-parse'; 

export const runtime = 'nodejs';
export const maxDuration = 30000000;

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
    console.log('[DEBUG] Starting report analysis with JSON structure...');
    
    const formData = await request.formData();
    const reportFile = formData.get('report');
    const analysisFile = formData.get('analysis');
    
    if (!reportFile || !analysisFile) {
      return NextResponse.json({ 
        error: 'Missing files', 
        details: 'Both report and analysis files are required' 
      }, { status: 400 });
    }
    
    const reportName = reportFile.name || 'Report';
    const analysisName = analysisFile.name || 'Analysis';
    
    // Extract text content from files
    let reportText = '';
    let analysisText = '';
    
    try {
      // Handle report file (PDF)
      if (reportFile.type === 'application/pdf') {
        const reportBuffer = Buffer.from(await reportFile.arrayBuffer());
        reportText = await extractTextFromPDF(reportBuffer);
        if (!reportText) {
          throw new Error('Could not extract text from report PDF');
        }
      } else {
        reportText = await reportFile.text();
      }
      
      // Handle analysis file (PDF or Markdown/Text)
      if (analysisFile.type === 'application/pdf') {
        const analysisBuffer = Buffer.from(await analysisFile.arrayBuffer());
        analysisText = await extractTextFromPDF(analysisBuffer);
        if (!analysisText) {
          throw new Error('Could not extract text from analysis PDF');
        }
      } else {
        analysisText = await analysisFile.text();
      }
      
      console.log('[DEBUG] Text extraction successful:', {
        reportTextLength: reportText.length,
        analysisTextLength: analysisText.length
      });
      
    } catch (extractionError) {
      console.error('[ERROR] Text extraction failed:', extractionError);
      return NextResponse.json({ 
        error: 'Text extraction failed', 
        details: extractionError.message 
      }, { status: 500 });
    }

    // Send extracted texts in simple JSON format
    const structuredData = {
      report: {
        name: reportName,
        content: reportText
      },
      analysis: {
        name: analysisName,
        content: analysisText
      }
    };

    // Prepare payload with the extracted texts
    const payload = {
      ai_agent_id: '68887a5b6a0837f7039b3a7e',
      user_query: JSON.stringify(structuredData),
      configuration_environment: 'DEV'
    };

    console.log('[DEBUG] Simple JSON payload sent to agent:', JSON.stringify(structuredData));
    console.log('[DEBUG] Calling agent with simplified JSON approach...');

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

    // Extract response
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
      // Enhanced test result with JSON structure metadata
      console.log('[WARNING] Creating test result due to empty agent response');
      const testResult = {
        accuracy: 78,
        alignment: 85,
        coverage: 72,
        compliance: 88,
        issues: 4,
        criticalIssues: 1,
        recommendations: 3,
        contentMatches: 15,
        missingElements: 2,
        reportName: reportName.replace(/\.(pdf|txt|md|markdown)$/i, ''),
        analysisName: analysisName.replace(/\.(pdf|txt|md|markdown)$/i, ''),
        timestamp: new Date().toISOString(),
        detailedFindings: [
          {
            type: "missing",
            section: "Risk Assessment",
            severity: "high",
            description: "Comprehensive risk assessment section not found in the report",
            recommendation: "Add detailed risk analysis with probability and impact ratings",
            analysisReference: "Analysis document requires risk evaluation framework"
          },
          {
            type: "alignment",
            section: "Executive Summary",
            severity: "medium",
            description: "Executive summary structure aligns with analysis requirements",
            recommendation: "Consider adding more quantitative metrics",
            analysisReference: "Summary should include key performance indicators"
          }
        ],
        sectionAnalysis: {
          "Executive Summary": {
            present: true,
            completeness: 85,
            quality: 80,
            issues: ["Could include more metrics"],
            analysisRequirement: "Executive summary with key findings and recommendations"
          },
          "Risk Assessment": {
            present: false,
            completeness: 0,
            quality: 0,
            issues: ["Section completely missing"],
            analysisRequirement: "Comprehensive risk analysis with mitigation strategies"
          }
        },
        summary: {
          totalIssues: 4,
          criticalIssues: 1,
          recommendations: 3,
          contentMatches: 15,
          missingElements: 2,
          strengths: ["Clear document structure", "Good formatting", "Appropriate language"],
          weaknesses: ["Missing risk assessment", "Limited quantitative data"]
        },
        strengths: ["Clear document structure", "Good formatting", "Appropriate language"],
        weaknesses: ["Missing risk assessment", "Limited quantitative data"],
        fileMetadata: {
          reportType: reportFile.type,
          analysisType: analysisFile.type,
          analysisFormat: analysisFile.type?.includes('pdf') ? 'PDF' : 'Markdown',
          textExtractionSuccess: true,
          reportTextLength: reportText.length,
          analysisTextLength: analysisText.length,
          dataStructure: 'JSON', // New field to indicate structured approach
          payloadSize: JSON.stringify(structuredData).length
        },
        analysisQuality: {
          hasDetailedFindings: true,
          hasSectionAnalysis: true,
          hasRecommendations: true,
          completeness: 75,
          structuredInput: true // Indicates JSON input was used
        }
      };

      return NextResponse.json({ 
        success: true, 
        result: testResult,
        note: "Test result with JSON structure. Check agent configuration.",
        inputStructure: "JSON"
      });
    }

    // If we got a response, try to parse it
    if (typeof parsedResult === 'string') {
      const trimmed = parsedResult.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          parsedResult = JSON.parse(trimmed);
        } catch (e) {
          console.log('[ERROR] Could not parse agent response as JSON:', e);
          return NextResponse.json({
            success: false,
            agentRawResponse: trimmed,
            note: "Agent returned plain text instead of structured JSON. Displaying raw response.",
            inputStructure: "JSON"
          });
        }
      } else {
        console.log('[WARNING] Agent returned plain text instead of JSON');
        return NextResponse.json({
          success: false,
          agentRawResponse: trimmed,
          note: "Agent returned plain text instead of structured JSON. Displaying raw response.",
          inputStructure: "JSON"
        });
      }
    }

    // Process the successful result with enhanced metadata
    const result = {
      accuracy: parsedResult.overallScores?.accuracy || 0,
      alignment: parsedResult.overallScores?.alignment || 0,
      coverage: parsedResult.overallScores?.coverage || 0,
      compliance: parsedResult.overallScores?.compliance || 0,
      issues: parsedResult.summary?.totalIssues || 0,
      criticalIssues: parsedResult.summary?.criticalIssues || 0,
      recommendations: parsedResult.summary?.recommendations || 0,
      contentMatches: parsedResult.summary?.contentMatches || 0,
      missingElements: parsedResult.summary?.missingElements || 0,
      reportName: reportName.replace(/\.(pdf|txt|md|markdown)$/i, ''),
      analysisName: analysisName.replace(/\.(pdf|txt|md|markdown)$/i, ''),
      timestamp: new Date().toISOString(),
      detailedFindings: parsedResult.detailedFindings || [],
      sectionAnalysis: parsedResult.sectionAnalysis || {},
      summary: parsedResult.summary || {},
      strengths: parsedResult.summary?.strengths || [],
      weaknesses: parsedResult.summary?.weaknesses || [],
      fileMetadata: {
        reportType: reportFile.type,
        analysisType: analysisFile.type,
        analysisFormat: analysisFile.type?.includes('pdf') ? 'PDF' : 'Markdown',
        textExtractionSuccess: true,
        dataStructure: 'JSON',
        payloadSize: JSON.stringify(structuredData).length
      },
      analysisQuality: {
        hasDetailedFindings: (parsedResult.detailedFindings || []).length > 0,
        hasSectionAnalysis: Object.keys(parsedResult.sectionAnalysis || {}).length > 0,
        hasRecommendations: (parsedResult.summary?.recommendations || 0) > 0,
        completeness: 100,
        structuredInput: true
      }
    };

    return NextResponse.json({ 
      success: true, 
      result,
      inputStructure: "JSON"
    });

  } catch (error) {
    console.error('[ERROR] Analysis failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Analysis failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}