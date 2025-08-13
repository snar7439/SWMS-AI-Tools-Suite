import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { HfInference } from '@huggingface/inference';

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
${reportContent}

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

    // Call Hugging Face API using the official client
    const HF_TOKEN = process.env.HF_TOKEN;
    const HF_MODEL = process.env.HF_MODEL;

    if (!HF_TOKEN) {
      return NextResponse.json({
        error: 'Server misconfigured: missing HF_TOKEN'
      }, { status: 500 });
    }

    if (!HF_MODEL) {
      return NextResponse.json({
        error: 'Server misconfigured: missing HF_MODEL'
      }, { status: 500 });
    }

    console.log('[DEBUG] Using Hugging Face model:', HF_MODEL);

    // Initialize variables outside try block to avoid scope issues
    let parsedResult = null;

    try {
      const hf = new HfInference(HF_TOKEN);
      
      console.log('[DEBUG] Calling Hugging Face API for report accuracy check...');

      // Use textGeneration for most models, or chatCompletion for chat models
      let response;
      let generatedText = '';

      // Check if it's a chat model (models with "chat" or "instruct" in the name)
      const isChatModel = HF_MODEL.toLowerCase().includes('chat') || 
                         HF_MODEL.toLowerCase().includes('instruct') || 
                         HF_MODEL.toLowerCase().includes('gemma') ||
                         HF_MODEL.toLowerCase().includes('gpt-oss') ||
                         HF_MODEL.toLowerCase().includes('conversational');

      if (isChatModel) {
        // Use chat completion for conversational models
        response = await hf.chatCompletion({
          model: HF_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.3,
        });
        
        if (response && response.choices && response.choices.length > 0) {
          generatedText = response.choices[0].message.content;
        }
      } else {
        // Use text generation for other models, with fallback to chat completion
        try {
          response = await hf.textGeneration({
            model: HF_MODEL,
            inputs: prompt,
            parameters: {
              max_new_tokens: 2048,
              temperature: 0.3,
              top_p: 0.9,
              repetition_penalty: 1.1,
              return_full_text: false
            }
          });
          
          generatedText = response.generated_text;
        } catch (textGenError) {
          console.log('[WARNING] Text generation failed, trying chat completion:', textGenError.message);
          
          // Fallback to chat completion if text generation fails
          response = await hf.chatCompletion({
            model: HF_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
            temperature: 0.3,
          });
          
          if (response && response.choices && response.choices.length > 0) {
            generatedText = response.choices[0].message.content;
          }
        }
      }

      console.log('[DEBUG] Hugging Face response received');
      console.log('[DEBUG] Generated text length:', generatedText?.length || 0);

      if (!generatedText) {
        console.log('[WARNING] No generated text found in response, using fallback');
      }

      // Parse the generated text as JSON
      if (generatedText) {
        try {
          // Try to extract JSON from the generated text
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            console.log('[WARNING] No JSON found in generated text:', generatedText.substring(0, 200));
          }
        } catch (parseError) {
          console.error('[ERROR] Failed to parse generated text as JSON:', parseError);
          console.log('[DEBUG] Generated text sample:', generatedText.substring(0, 500));
        }
      }

    } catch (hfError) {
      console.error('[ERROR] Hugging Face API call failed:', hfError);
      
      // Check if it's a model not found error
      if (hfError.message && hfError.message.includes('404')) {
        return NextResponse.json({
          error: 'Model not found or not accessible',
          details: `The model "${HF_MODEL}" was not found. Please check the model name or try a different model.`,
          suggestions: [
            'microsoft/DialoGPT-medium',
            'gpt2',
            'google/flan-t5-base',
            'facebook/bart-large-cnn'
          ]
        }, { status: 404 });
      }

      // Check if it's a model loading error
      if (hfError.message && hfError.message.includes('loading')) {
        return NextResponse.json({
          error: 'Model is loading',
          details: 'Please wait a moment for the model to load and try again.',
          retryAfter: 60
        }, { status: 503 });
      }

      return NextResponse.json({ 
        error: 'Hugging Face API error', 
        details: hfError.message || 'Unknown error occurred',
        model: HF_MODEL
      }, { status: 502 });
    }

    console.log('[DEBUG] Parsed result:', {
      type: typeof parsedResult,
      content: parsedResult,
      isEmpty: !parsedResult || parsedResult === ""
    });

    if (!parsedResult || parsedResult === "" || parsedResult === null) {
      // Return a fallback result to verify the frontend works
      console.log('[WARNING] Creating fallback result due to empty Hugging Face response');
      const fallbackResult = {
        accuracyScore: 75,
        alignmentScore: 80,
        dataConsistency: 70,
        overallAccuracy: 75,
        findings: [
          {
            type: "analysis",
            severity: "medium",
            description: "Hugging Face model response was empty, using fallback analysis",
            queryData: "Query executed successfully",
            reportData: "Report content available",
            impact: "Unable to perform detailed comparison due to model response issue"
          }
        ],
        summary: {
          totalChecks: 1,
          matches: 0,
          discrepancies: 0,
          missing: 1,
          strengths: ["Query executed successfully", "Report content accessible"],
          improvements: ["Hugging Face model configuration needs review", "Response parsing improvements needed"]
        }
      };

      return NextResponse.json({ 
        success: true, 
        result: {
          ...fallbackResult,
          checkedAt: new Date().toISOString(),
          queryId: parsedQueryData.id || 'unknown',
          note: "This is a fallback result due to empty model response. Check Hugging Face model configuration.",
          model: HF_MODEL
        }
      });
    }

    // If we got a response, try to parse it
    if (typeof parsedResult === 'string') {
      try {
        parsedResult = JSON.parse(parsedResult);
      } catch (e) {
        console.log('[ERROR] Could not parse Hugging Face response as JSON:', e);
        return NextResponse.json({ 
          error: 'Invalid response format', 
          details: 'Hugging Face model returned non-JSON response',
          modelResponse: parsedResult
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
      model: HF_MODEL,
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
