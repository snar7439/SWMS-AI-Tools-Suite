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
    console.log('[DEBUG] Starting report verification with Hugging Face...');
    
    const formData = await request.formData();
    const reportFile = formData.get('report');
    const analysisFile = formData.get('analysis');
    
    if (!reportFile || !analysisFile) {
      return NextResponse.json({ 
        error: 'Missing files', 
        details: 'Both report and verification files are required' 
      }, { status: 400 });
    }
    
    const reportName = reportFile.name || 'Report';
    const analysisName = analysisFile.name || 'Verification';
    
    // Extract text content from files
    let reportText = '';
    let analysisText = '';
    
    try {
      // Handle report file (PDF or text)
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

    // Create the enhanced verification prompt for Hugging Face
    const prompt = `**Role**
You are an expert document analyst specializing in compliance and report validation. Your responsibility is to perform precise, standards-based evaluations of reports against provided verification documents, especially in regulatory, structural, and quality dimensions.

**Instructions**
You are to conduct a comprehensive, structured comparison between a Sysco Warehouse Management System (SWMS) report and its corresponding verification document. The objective is to validate whether the report meets the requirements, structure, standards, and expectations laid out in the verification document.

Please output your results in **valid JSON format**, adhering strictly to the structure outlined below.

**Steps**
1. Understand the context by reviewing the content of both documents:

**REPORT DOCUMENT:**
Name: ${reportName}
Content: ${reportText}

**Verification DOCUMENT:**
Name: ${analysisName}
Format: ${analysisFile.type?.includes('pdf') ? 'PDF (converted text)' : 'Markdown/Text'}
Content: ${analysisText}

2. Compare the report against the verification document on the following dimensions:
   - Content Structure: Does the report reflect the outlined structure?
   - Required Sections: Are all mandated sections present?
   - Compliance Requirements: Does it meet legal/safety/regulatory standards?
   - Quality Standards: Does the language, detail, and clarity meet expectations?
   - Completeness: Are all required components addressed?

3. Apply format-specific considerations:
   - If verification is in Markdown: Look for structured headings, bullet points, checklists, or code blocks
   - If verification is in PDF: Look for converted structures like numbered lists, tables, or sections

4. Generate a structured response using this EXACT JSON format:

{
  "overallScores": {
    "accuracy": 85,
    "alignment": 78,
    "coverage": 90,
    "compliance": 82
  },
  "detailedFindings": [
    {
      "type": "alignment|missing|inconsistency|recommendation|compliance",
      "section": "Executive Summary",
      "severity": "high|medium|low",
      "description": "Detailed finding description with specific references",
      "recommendation": "Actionable step to address the finding",
      "verificationReference": "Direct reference to requirement from verification document"
    }
  ],
  "summary": {
    "totalIssues": 5,
    "criticalIssues": 2,
    "recommendations": 8,
    "contentMatches": 12,
    "missingElements": 3,
    "strengths": ["Well-structured risk assessment", "Clear compliance section"],
    "weaknesses": ["Missing emergency procedures", "Incomplete stakeholder analysis"]
  },
  "sectionAnalysis": {
    "Executive Summary": {
      "present": true,
      "completeness": 85,
      "quality": 90,
      "issues": ["Missing key risk metrics"],
      "verificationRequirement": "Must include overview of all major risks and mitigation strategies"
    },
    "Risk Assessment": {
      "present": false,
      "completeness": 0,
      "quality": 0,
      "issues": ["Section completely missing"],
      "verificationRequirement": "Comprehensive risk matrix with probability and impact ratings"
    }
  }
}

5. Use the following scoring criteria for consistency:
   - Accuracy (0-100): Factual correctness and precision
   - Alignment (0-100): Structural and contextual match with verification requirements
   - Coverage (0-100): Breadth of requirement fulfillment
   - Compliance (0-100): Adherence to standards and regulations

**Critical Requirements:**
- Provide specific, actionable findings
- Reference both documents directly in your analysis
- Use only the defined finding types: alignment, missing, inconsistency, recommendation, compliance
- Score all metrics on 0-100 scale
- Ensure JSON output is valid and properly formatted
- Be objective and evidence-based in all assessments

**End Goal**
Provide a structured, objective, and actionable validation summary of the report, quantifying alignment with the verification document, highlighting gaps and strengths, and enabling targeted improvement.

Return only the JSON response with no additional text or formatting.`;

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

    console.log('[DEBUG] Using Hugging Face model for analysis:', HF_MODEL);

    // Initialize variables outside try block to avoid scope issues
    let parsedResult = null;

    try {
      const hf = new HfInference(HF_TOKEN);
      
      console.log('[DEBUG] Calling Hugging Face API for enhanced report verification...');

      // Use textGeneration for most models, or chatCompletion for chat models
      let response;
      let generatedText = '';

      // Check if it's a chat model
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
          max_tokens: 3072,
          temperature: 0.1,
          top_p: 0.9,
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
              max_new_tokens: 3072,
              temperature: 0.1,
              top_p: 0.9,
              repetition_penalty: 1.1,
              return_full_text: false,
              do_sample: true
            }
          });
          
          generatedText = response.generated_text;
        } catch (textGenError) {
          console.log('[WARNING] Text generation failed, trying chat completion:', textGenError.message);
          
          // Fallback to chat completion if text generation fails
          response = await hf.chatCompletion({
            model: HF_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 3072,
            temperature: 0.1,
          });
          
          if (response && response.choices && response.choices.length > 0) {
            generatedText = response.choices[0].message.content;
          }
        }
      }

      console.log('[DEBUG] Hugging Face response received');
      console.log('[DEBUG] Generated text length:', generatedText?.length || 0);

      if (!generatedText) {
        console.log('[WARNING] No generated text found in response, using enhanced fallback');
      }

      // Parse the generated text as JSON
      if (generatedText) {
        try {
          // Clean the response to extract JSON
          let cleanedText = generatedText.trim();
          
          // Remove markdown code blocks if present
          if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
          } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '');
          }
          
          // Try to extract JSON from the cleaned text
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
            console.log('[DEBUG] Successfully parsed JSON from Hugging Face response');
          } else {
            console.log('[WARNING] No JSON found in generated text:', cleanedText.substring(0, 200));
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
            'facebook/bart-large-cnn',
            'mistralai/Mistral-7B-Instruct-v0.1'
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
      hasOverallScores: !!parsedResult?.overallScores,
      hasDetailedFindings: !!(parsedResult?.detailedFindings?.length),
      hasSectionAnalysis: !!(parsedResult?.sectionAnalysis && Object.keys(parsedResult.sectionAnalysis).length),
      isEmpty: !parsedResult || parsedResult === ""
    });

    if (!parsedResult || parsedResult === "" || parsedResult === null) {
      // Enhanced fallback result for analysis
      console.log('[WARNING] Creating enhanced fallback result due to empty Hugging Face response');
      const fallbackResult = {
        overallScores: {
          accuracy: 65,
          alignment: 60,
          coverage: 70,
          compliance: 68
        },
        detailedFindings: [
          {
            type: "recommendation",
            section: "Analysis Status",
            severity: "medium",
            description: "Hugging Face model response was empty, automated analysis could not be completed",
            recommendation: "Verify model configuration and try again with a different model",
            verificationReference: "System requirement for successful document verification"
          }
        ],
        summary: {
          totalIssues: 1,
          criticalIssues: 0,
          recommendations: 3,
          contentMatches: 0,
          missingElements: 1,
          strengths: ["Documents uploaded successfully", "Text extraction completed"],
          weaknesses: ["Model analysis unavailable", "Automated validation incomplete"]
        },
        sectionAnalysis: {
          "System Analysis": {
            present: false,
            completeness: 0,
            quality: 0,
            issues: ["Model response unavailable"],
            verificationRequirement: "Successful AI model analysis of document alignment"
          }
        }
      };

      const structuredData = {
        accuracy: fallbackResult.overallScores.accuracy,
        alignment: fallbackResult.overallScores.alignment,
        coverage: fallbackResult.overallScores.coverage,
        compliance: fallbackResult.overallScores.compliance,
        issues: fallbackResult.summary.totalIssues,
        criticalIssues: fallbackResult.summary.criticalIssues,
        recommendations: fallbackResult.summary.recommendations,
        contentMatches: fallbackResult.summary.contentMatches,
        missingElements: fallbackResult.summary.missingElements,
        reportName: reportName.replace(/\.(pdf|txt|md|markdown)$/i, ''),
        analysisName: analysisName.replace(/\.(pdf|txt|md|markdown)$/i, ''),
        timestamp: new Date().toISOString(),
        detailedFindings: fallbackResult.detailedFindings,
        sectionAnalysis: fallbackResult.sectionAnalysis,
        summary: fallbackResult.summary,
        strengths: fallbackResult.summary.strengths,
        weaknesses: fallbackResult.summary.weaknesses,
        fileMetadata: {
          reportType: reportFile.type,
          analysisType: analysisFile.type,
          analysisFormat: analysisFile.type?.includes('pdf') ? 'PDF' : 'Markdown',
          textExtractionSuccess: true,
          dataStructure: 'JSON',
          payloadSize: JSON.stringify(fallbackResult).length
        },
        analysisQuality: {
          hasDetailedFindings: true,
          hasSectionAnalysis: true,
          hasRecommendations: true,
          completeness: 30,
          structuredInput: true,
          modelResponse: 'fallback'
        }
      };

      return NextResponse.json({ 
        success: true, 
        result: structuredData,
        note: "This is a fallback result due to empty model response. Check Hugging Face model configuration."
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
          modelResponse: parsedResult.substring ? parsedResult.substring(0, 500) : parsedResult
        }, { status: 422 });
      }
    }

    // Validate the structure of parsedResult
    if (!parsedResult.overallScores) {
      console.log('[WARNING] Missing overallScores in response, adding defaults');
      parsedResult.overallScores = {
        accuracy: 75,
        alignment: 75,
        coverage: 75,
        compliance: 75
      };
    }

    if (!parsedResult.summary) {
      console.log('[WARNING] Missing summary in response, adding defaults');
      parsedResult.summary = {
        totalIssues: 0,
        criticalIssues: 0,
        recommendations: 0,
        contentMatches: 0,
        missingElements: 0,
        strengths: [],
        weaknesses: []
      };
    }

    // Process the successful result with enhanced structure
    const structuredData = {
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
        payloadSize: JSON.stringify(parsedResult).length
      },
      analysisQuality: {
        hasDetailedFindings: (parsedResult.detailedFindings || []).length > 0,
        hasSectionAnalysis: Object.keys(parsedResult.sectionAnalysis || {}).length > 0,
        hasRecommendations: (parsedResult.summary?.recommendations || 0) > 0,
        completeness: 100,
        structuredInput: true,
        modelResponse: 'success'
      }
    };

    console.log('[DEBUG] Final structured data:', {
      hasAllScores: !!(structuredData.accuracy && structuredData.alignment && structuredData.coverage && structuredData.compliance),
      findingsCount: structuredData.detailedFindings.length,
      sectionsCount: Object.keys(structuredData.sectionAnalysis).length,
      dataCompleteness: structuredData.analysisQuality.completeness
    });

    return NextResponse.json({ success: true, result: structuredData });

  } catch (error) {
    console.error('[ERROR] Analysis failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Analysis failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}