import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Helper function to read SWMS System Overview
async function getSWMSSystemOverview() {
  try {
    const overviewPath = path.join(process.cwd(), 'public', 'SWMS_System_Overview.md');
    const overviewContent = await fs.readFile(overviewPath, 'utf-8');
    return overviewContent;
  } catch (error) {
    console.error('Error reading SWMS System Overview:', error);
    return null;
  }
}

// Helper function to format time window for logs
function formatTimeWindow(issueTime) {
  const issueDate = new Date(issueTime);
  const startTime = new Date(issueDate.getTime() - 30 * 60 * 1000); // 30 minutes before
  const endTime = new Date(issueDate.getTime() + 15 * 60 * 1000);   // 15 minutes after
  
  return {
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    issueTime: issueDate.toISOString(),
    description: `Time window: ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`
  };
}

// Helper function to process images and extract text descriptions
function processImages(images) {
  if (!images || images.length === 0) return '';
  
  return images.map((img, index) => {
    return `Image ${index + 1}: ${img.name || `image_${index + 1}`} (${img.type || 'unknown type'})`;
  }).join('\n');
}

// Helper function to read log files from session directory
async function getSessionLogs(sessionId) {
  try {
    if (!sessionId) return null;
    
    const logsPath = path.join(process.cwd(), 'temp_logs', sessionId);
    
    // Check if directory exists
    try {
      await fs.access(logsPath);
    } catch {
      console.log(`Session directory not found: ${sessionId}`);
      return null;
    }
    
    const files = await fs.readdir(logsPath, { withFileTypes: true });
    const logData = {};
    
    for (const file of files) {
      if (file.isFile() && (file.name.endsWith('.log') || file.name.endsWith('.txt'))) {
        try {
          const filePath = path.join(logsPath, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          logData[file.name] = content;
        } catch (error) {
          console.error(`Error reading log file ${file.name}:`, error);
        }
      }
    }
    
    return Object.keys(logData).length > 0 ? logData : null;
  } catch (error) {
    console.error('Error reading session logs:', error);
    return null;
  }
}

// Helper function to read SSH log files
async function getSSHLogs(sessionId) {
  try {
    if (!sessionId) return null;
    
    const tempLogsPath = path.join(process.cwd(), 'temp_logs');
    const directories = await fs.readdir(tempLogsPath, { withFileTypes: true });
    
    // Find SSH session directories that might be related
    const sshSessionDirs = directories
      .filter(dir => dir.isDirectory() && dir.name.startsWith('ssh_session_'))
      .map(dir => dir.name);
    
    if (sshSessionDirs.length === 0) return null;
    
    // Try to find the most recent SSH session or one with similar timestamp
    const sessionTimestamp = sessionId.split('_')[1]; // Extract timestamp from session ID
    let matchingSSHDir = null;
    
    if (sessionTimestamp) {
      // Look for SSH session with similar timestamp (within 10 minutes)
      const sessionTime = parseInt(sessionTimestamp);
      for (const sshDir of sshSessionDirs) {
        const sshTimestamp = sshDir.split('_')[2];
        if (sshTimestamp && Math.abs(parseInt(sshTimestamp) - sessionTime) < 600000) { // 10 minutes
          matchingSSHDir = sshDir;
          break;
        }
      }
    }
    
    // If no matching timestamp, use the most recent SSH session
    if (!matchingSSHDir && sshSessionDirs.length > 0) {
      matchingSSHDir = sshSessionDirs.sort().pop(); // Get the latest one
    }
    
    if (!matchingSSHDir) return null;
    
    const sshLogsPath = path.join(tempLogsPath, matchingSSHDir);
    const sshFiles = await fs.readdir(sshLogsPath, { withFileTypes: true });
    const sshLogData = {};
    
    for (const file of sshFiles) {
      if (file.isFile() && (file.name.endsWith('.log') || file.name.endsWith('.txt'))) {
        try {
          const filePath = path.join(sshLogsPath, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          sshLogData[file.name] = content;
        } catch (error) {
          console.error(`Error reading SSH log file ${file.name}:`, error);
        }
      }
    }
    
    return Object.keys(sshLogData).length > 0 ? { directory: matchingSSHDir, logs: sshLogData } : null;
  } catch (error) {
    console.error('Error reading SSH logs:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    console.log('[DEBUG] Starting Root Cause Analysis with Hugging Face...');
    
    const formData = await request.formData();
    
    // Extract form data
    const issueDescription = formData.get('issueDescription');
    const timeOccurred = formData.get('timeOccurred');
    const environmentType = formData.get('environmentType');
    const environment = JSON.parse(formData.get('environment') || '{}');
    const logSummary = JSON.parse(formData.get('logSummary') || '{}');
    const sessionId = formData.get('sessionId');
    
    // Process attached images
    const attachedImages = [];
    let imageIndex = 0;
    while (formData.get(`image_${imageIndex}`)) {
      const imageFile = formData.get(`image_${imageIndex}`);
      attachedImages.push({
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size
      });
      imageIndex++;
    }

    console.log('[DEBUG] Extracted form data:', {
      issueDescription: issueDescription?.substring(0, 100) + '...',
      timeOccurred,
      environmentType,
      environment: environment.name,
      sessionId,
      imageCount: attachedImages.length
    });

    // Validate required fields
    if (!issueDescription || !timeOccurred) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'Issue description and time occurred are required' 
      }, { status: 400 });
    }

    // Get SWMS System Overview
    const swmsOverview = await getSWMSSystemOverview();
    if (!swmsOverview) {
      console.warn('[WARNING] Could not load SWMS System Overview');
    }

    // Format time window
    const timeWindow = formatTimeWindow(timeOccurred);

    // Get session logs (database logs)
    const sessionLogs = await getSessionLogs(sessionId);
    
    // Get SSH logs
    const sshLogs = await getSSHLogs(sessionId);

    // Process images
    const imageDescriptions = processImages(attachedImages);

    // Create the comprehensive prompt for LLM
    const prompt = `**Role:**
You are an expert in diagnosing issues in SWMS (Sysco Warehouse Management System) with deep knowledge of its architecture, workflows, database design, and log structures. You are also skilled in correlating SWMS system logs, database logs, and other evidence (including screenshots) to determine the root cause of technical problems.

**Context:**
You will be provided with:
- A markdown document containing a high-level overview of SWMS
- A description of the reported issue and the exact time it occurred
- Relevant SWMS system logs and database logs covering a time window of 30 minutes before the reported time and 15 minutes after
- Optional images or screenshots attached by the user that may contain error messages, visual anomalies, or diagnostic information

**System Overview:**
${swmsOverview || 'SWMS System Overview not available'}

**Issue Details:**
- **Environment Type:** ${environmentType}
- **Environment:** ${environment.name || 'Unknown'} (${environment.description || 'No description'})
- **Issue Description:** ${issueDescription}
- **Time Occurred:** ${timeOccurred}
- **Analysis Time Window:** ${timeWindow.description}

**Attached Images:**
${imageDescriptions || 'No images provided'}

**Database Log Summary:**
${logSummary ? JSON.stringify(logSummary, null, 2) : 'No database log summary available'}

**Database Logs Retrieved:**
${sessionLogs ? Object.entries(sessionLogs).map(([filename, content]) => 
  `**File: ${filename}**\n${content.substring(0, 2000)}${content.length > 2000 ? '...\n[Content truncated - showing first 2000 characters]' : ''}`
).join('\n\n') : 'No database logs available'}

**SSH System Logs:**
${sshLogs ? Object.entries(sshLogs.logs).map(([filename, content]) => 
  `**SSH File: ${filename}**\n${content.substring(0, 2000)}${content.length > 2000 ? '...\n[Content truncated - showing first 2000 characters]' : ''}`
).join('\n\n') : 'No SSH logs available'}

**Instructions:**

1. **Time Filtering:**
   - Focus on events within the time window: ${timeWindow.start} to ${timeWindow.end}
   - The issue occurred at: ${timeWindow.issueTime}
   - Maintain chronological order for context

2. **Evidence Extraction:**
   - Identify key log entries, error codes, transaction IDs, or warnings relevant to the issue
   - Cross-reference system logs with database logs for linked events
   - Examine provided images for visible error messages, codes, timestamps, or context clues

3. **Correlation & Reasoning:**
   - Determine relationships between system events, database events, and any information from images
   - Look for patterns such as recurring failures, transaction rollbacks, resource locks, or unusual activity

4. **Root Cause Determination:**
   - Provide a clear, evidence-supported explanation of what most likely caused the issue
   - Include a step-by-step breakdown of how you reached this conclusion
   - Only state causes that are directly supported by the provided evidence

5. **When Evidence is Insufficient:**
   - If logs and images do not provide enough information to confirm the root cause, explicitly state this
   - Example: "The available logs and attached evidence do not contain sufficient information to determine a definitive root cause for this issue."

**Output Format:**
Provide the analysis in JSON format with the following structure:

{
  "issueAnalysis": {
    "summary": "Brief restatement of the issue and time",
    "timeWindow": {
      "start": "${timeWindow.start}",
      "end": "${timeWindow.end}",
      "issueTime": "${timeWindow.issueTime}"
    },
    "relevantEvidence": [
      {
        "timestamp": "ISO timestamp",
        "source": "database|ssh|image",
        "type": "error|warning|info",
        "description": "Description of the evidence",
        "relevance": "Why this evidence is important"
      }
    ],
    "rootCauseAnalysis": {
      "primaryCause": "Main identified cause",
      "reasoning": "Detailed step-by-step explanation",
      "evidenceTrail": ["Evidence point 1", "Evidence point 2", "etc."],
      "affectedComponents": ["Component 1", "Component 2", "etc."]
    },
    "confidenceLevel": "High|Medium|Low",
    "confidenceReasoning": "Explanation of why this confidence level",
    "recommendations": {
      "immediate": "Immediate actions to take",
      "longTerm": "Long-term preventive measures"
    },
    "additionalDataNeeded": ["What additional data would help confirm the root cause"]
  }
}

**Important Rules:**
- No hallucinations: Only draw conclusions directly supported by logs or image evidence
- Do not fabricate data or speculate beyond the given information
- Be concise but thorough in reasoning
- If unsure, clearly indicate uncertainty
- Provide specific timestamps and log entries as evidence`;

    console.log('[DEBUG] Prompt created, calling Hugging Face API...');

    // Call Hugging Face API using the official client
    const HF_TOKEN = process.env.HF_TOKEN;
    const HF_MODEL = process.env.HF_MODEL;

    console.log('[DEBUG] Hugging Face API Key available:', !!HF_TOKEN);

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
    let result = null;
    let generatedText = '';

    try {
      const hf = new HfInference(HF_TOKEN);
      
      console.log('[DEBUG] Calling Hugging Face API for Root Ripple...');

      // Check if it's a chat model
      const isChatModel = HF_MODEL.toLowerCase().includes('chat') || 
                         HF_MODEL.toLowerCase().includes('instruct') || 
                         HF_MODEL.toLowerCase().includes('gemma') ||
                         HF_MODEL.toLowerCase().includes('gpt-oss') ||
                         HF_MODEL.toLowerCase().includes('conversational');

      if (isChatModel) {
        console.log('[DEBUG] Using chat completion for model:', HF_MODEL);
        
        // Use chat completion with correct message structure
        result = await hf.chatCompletion({
          model: HF_MODEL,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          stream: false
        });

        if (result && result.choices && result.choices.length > 0) {
          generatedText = result.choices[0].message.content;
        } else {
          throw new Error('No valid response from chat completion');
        }
      } else {
        console.log('[DEBUG] Using text generation for model:', HF_MODEL);
        
        // Use text generation for other models
        try {
          result = await hf.textGeneration({
            model: HF_MODEL,
            inputs: prompt,
            parameters: {
              max_new_tokens: 2000,
              temperature: 0.3,
              do_sample: true,
              return_full_text: false
            }
          });
          
          generatedText = result.generated_text;
        } catch (textGenError) {
          console.log('[WARNING] Text generation failed, trying chat completion fallback:', textGenError.message);
          
          // Fallback to chat completion if text generation fails
          result = await hf.chatCompletion({
            model: HF_MODEL,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.3,
            stream: false
          });

          if (result && result.choices && result.choices.length > 0) {
            generatedText = result.choices[0].message.content;
          } else {
            throw new Error('Both text generation and chat completion failed');
          }
        }
      }

      console.log('[DEBUG] Successfully received response from Hugging Face');
      
    } catch (hfError) {
      console.error('[ERROR] Hugging Face API call failed:', hfError);
      console.error('[ERROR] Error details:', {
        message: hfError.message,
        name: hfError.name,
        stack: hfError.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      });
      
      // Fallback to mock response for development/testing
      console.log('[DEBUG] Using mock response due to API failure');
      generatedText = JSON.stringify({
        issueAnalysis: {
          summary: `Analysis for issue: ${issueDescription.substring(0, 100)}... occurred at ${timeOccurred}`,
          timeWindow: {
            start: timeWindow.start,
            end: timeWindow.end,
            issueTime: timeWindow.issueTime
          },
          relevantEvidence: [
            {
              timestamp: timeWindow.issueTime,
              source: "analysis",
              type: "info",
              description: "LLM API temporarily unavailable - using fallback analysis",
              relevance: "System status information"
            }
          ],
          rootCauseAnalysis: {
            primaryCause: "Analysis service temporarily unavailable",
            reasoning: "The Hugging Face LLM service could not be reached. This appears to be a temporary connectivity or API issue.",
            evidenceTrail: ["API call failed", "Fallback response generated"],
            affectedComponents: ["Root Cause Analysis Service"]
          },
          confidenceLevel: "Low",
          confidenceReasoning: "Analysis could not be performed due to API unavailability",
          recommendations: {
            immediate: "Retry the analysis when the LLM service becomes available",
            longTerm: "Implement backup analysis methods or local LLM deployment"
          },
          additionalDataNeeded: ["LLM service restoration", "Alternative analysis tools"]
        }
      });
    }

    // Parse the response
    let analysisResult;
    try {
      // Try to extract JSON from the response
      let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create structured response from text
        analysisResult = {
          issueAnalysis: {
            summary: `Analysis for: ${issueDescription.substring(0, 100)}...`,
            timeWindow: {
              start: timeWindow.start,
              end: timeWindow.end,
              issueTime: timeWindow.issueTime
            },
            relevantEvidence: [{
              timestamp: timeWindow.issueTime,
              source: "llm",
              type: "info",
              description: "LLM response received but not in expected JSON format",
              relevance: "Response formatting issue"
            }],
            rootCauseAnalysis: {
              primaryCause: "Analysis completed but response format unexpected",
              reasoning: generatedText.substring(0, 500),
              evidenceTrail: ["LLM response received", "JSON parsing attempted"],
              affectedComponents: ["Response Parser"]
            },
            confidenceLevel: "Medium",
            confidenceReasoning: "Analysis performed but response formatting needs improvement",
            recommendations: {
              immediate: "Review response format and retry if needed",
              longTerm: "Improve prompt engineering for consistent JSON responses"
            },
            additionalDataNeeded: ["Better response formatting", "Prompt optimization"]
          }
        };
      }
    } catch (parseError) {
      console.error('[ERROR] Failed to parse LLM response:', parseError);
      console.log('[DEBUG] Raw response:', generatedText);
      
      // Create error response
      analysisResult = {
        issueAnalysis: {
          summary: `Analysis attempted for: ${issueDescription.substring(0, 100)}...`,
          timeWindow: {
            start: timeWindow.start,
            end: timeWindow.end,
            issueTime: timeWindow.issueTime
          },
          relevantEvidence: [{
            timestamp: timeWindow.issueTime,
            source: "system",
            type: "error",
            description: "Failed to parse LLM analysis response",
            relevance: "System processing error"
          }],
          rootCauseAnalysis: {
            primaryCause: "LLM response parsing failed",
            reasoning: "The LLM provided a response but it could not be parsed into the expected format",
            evidenceTrail: ["LLM call successful", "Response parsing failed"],
            affectedComponents: ["Response Parser", "LLM Integration"]
          },
          confidenceLevel: "Low",
          confidenceReasoning: "Technical issue prevented proper analysis",
          recommendations: {
            immediate: "Check LLM response format and retry analysis",
            longTerm: "Improve error handling and response parsing"
          },
          additionalDataNeeded: ["Working LLM integration", "Better error handling"]
        }
      };
    }

    console.log('[DEBUG] Analysis completed successfully');

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        sessionId,
        environment: environment.name,
        timeWindow,
        logsAvailable: {
          database: !!sessionLogs,
          ssh: !!sshLogs,
          images: attachedImages.length > 0
        }
      }
    });

  } catch (error) {
    console.error('[ERROR] Root cause analysis failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'An error occurred during root cause analysis'
    }, { status: 500 });
  }
}