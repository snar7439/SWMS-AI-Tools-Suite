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
  
  // Format times using the exact times (no timezone conversion)
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  return {
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    issueTime: issueDate.toISOString(),
    description: `Time window: ${startTime.toLocaleString('en-US', options)} to ${endTime.toLocaleString('en-US', options)} (using exact entered time)`
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

// Create prompt for root cause analysis only
function createRootCausePrompt(data) {
  const { swmsOverview, issueDescription, timeOccurred, environmentType, environment, timeWindow, imageDescriptions, logSummary, sessionLogs, sshLogs } = data;
  
  return `**Role:**
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
Provide the analysis in Markdown:

## Issue Summary
Brief restatement of the issue and time

## Relevant Evidence
Summarized key log entries, database events, and notable image observations — include timestamps and relevance

## Root Cause Analysis
Detailed reasoning and evidence trail that led to the root cause

## Confidence Level
High / Medium / Low — based on certainty from the provided evidence

## Additional Data Needed
(if applicable) What more is required to confirm the root cause

**Important Rules:**
- No hallucinations: Only draw conclusions directly supported by logs or image evidence
- Do not fabricate data or speculate beyond the given information
- Be concise but thorough in reasoning
- If unsure, clearly indicate uncertainty
- Provide specific timestamps and log entries as evidence`;
}

// Create prompt for solution generation
function createSolutionPrompt(data, rootCauseAnalysis) {
  const { swmsOverview, issueDescription, timeOccurred, environmentType, environment, timeWindow, imageDescriptions, logSummary, sessionLogs, sshLogs } = data;
  
  return `**Role:**
You are an expert SWMS (Sysco Warehouse Management System) engineer with extensive experience in resolving operational, database, and integration issues. You are also an experienced incident responder skilled in creating actionable, realistic, and safe remediation steps for complex system problems.

**Context:**
You will be provided with:
- A confirmed root cause of the issue
- Relevant SWMS system logs, database logs, and optionally images/screenshots attached by the user
- A high-level overview of SWMS for reference

**System Overview:**
${swmsOverview || 'SWMS System Overview not available'}

**Original Issue Details:**
- **Environment Type:** ${environmentType}
- **Environment:** ${environment.name || 'Unknown'} (${environment.description || 'No description'})
- **Issue Description:** ${issueDescription}
- **Time Occurred:** ${timeOccurred}
- **Analysis Time Window:** ${timeWindow.description}

**Confirmed Root Cause:**
${rootCauseAnalysis}

**Supporting Evidence:**
**Database Log Summary:**
${logSummary ? JSON.stringify(logSummary, null, 2) : 'No database log summary available'}

**Database Logs:**
${sessionLogs ? Object.entries(sessionLogs).map(([filename, content]) => 
  `**File: ${filename}**\n${content.substring(0, 1500)}${content.length > 1500 ? '...\n[Content truncated]' : ''}`
).join('\n\n') : 'No database logs available'}

**SSH System Logs:**
${sshLogs ? Object.entries(sshLogs.logs).map(([filename, content]) => 
  `**SSH File: ${filename}**\n${content.substring(0, 1500)}${content.length > 1500 ? '...\n[Content truncated]' : ''}`
).join('\n\n') : 'No SSH logs available'}

**Instructions:**

1. **Understand the Root Cause:**
   - Read the provided root cause carefully
   - Cross-check with logs and any evidence provided for context

2. **Develop a Targeted Solution:**
   - Propose only evidence-based, realistic actions that address the identified root cause
   - Include both immediate actions to mitigate impact and long-term preventative measures
   - Ensure solutions are relevant to a SWMS production environment and feasible for warehouse IT teams

3. **Structure the Solution:**
   - Immediate Fix: Steps to quickly resolve the current issue
   - Validation Steps: How to confirm the fix worked (tests, log checks, transaction verifications)
   - Preventive Actions: Long-term measures to reduce recurrence (config changes, monitoring, training, patches)

4. **When a Solution Cannot Be Provided:**
   - If the root cause is unclear or lacks enough supporting evidence to design a safe fix, explicitly state that a solution cannot be proposed without further data
   - Suggest what additional evidence or context would be required

**Output Format:**
Provide the solution in Markdown:

## Solution Overview
Brief summary of how the solution addresses the root cause

## Immediate Fix
Step-by-step technical actions to resolve the issue quickly

## Validation Steps
How to verify that the fix has resolved the issue

## Preventive Actions
Long-term recommendations to avoid recurrence

## Confidence Level
High / Medium / Low — based on certainty that the solution addresses the root cause

## Additional Data Needed
(if applicable) If a solution cannot be provided with the given details, state what more is needed

**Important Rules:**
- No hallucinations: Only propose solutions directly related to the provided root cause and evidence
- Do not suggest risky changes without warnings about potential side effects
- Be practical: Assume real-world SWMS operational constraints (e.g., minimal downtime, integration dependencies)
- If a workaround is temporary, mark it clearly and note that a permanent fix is still required`;
}

// Call Hugging Face API
async function callHuggingFaceAPI(prompt) {
  const HF_TOKEN = process.env.HF_TOKEN;
  const HF_MODEL = process.env.HF_MODEL;

  if (!HF_TOKEN || !HF_MODEL) {
    throw new Error('Missing HF_TOKEN or HF_MODEL configuration');
  }

  const hf = new HfInference(HF_TOKEN);
  
  // Check if it's a chat model
  const isChatModel = HF_MODEL.toLowerCase().includes('chat') || 
                     HF_MODEL.toLowerCase().includes('instruct') || 
                     HF_MODEL.toLowerCase().includes('gemma') ||
                     HF_MODEL.toLowerCase().includes('gpt-oss') ||
                     HF_MODEL.toLowerCase().includes('conversational');

  let result;
  let generatedText = '';

  if (isChatModel) {
    result = await hf.chatCompletion({
      model: HF_MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.3,
      stream: false
    });

    if (result && result.choices && result.choices.length > 0) {
      generatedText = result.choices[0].message.content;
    } else {
      throw new Error('No valid response from chat completion');
    }
  } else {
    try {
      result = await hf.textGeneration({
        model: HF_MODEL,
        inputs: prompt,
        parameters: {
          max_new_tokens: 3000,
          temperature: 0.3,
          do_sample: true,
          return_full_text: false
        }
      });
      
      generatedText = result.generated_text;
    } catch (textGenError) {
      // Fallback to chat completion
      result = await hf.chatCompletion({
        model: HF_MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
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

  return generatedText;
}

export async function POST(request) {
  try {
    console.log('[DEBUG] Starting Enhanced Root Cause Analysis...');
    
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

    // Prepare data for prompts
    const promptData = {
      swmsOverview,
      issueDescription,
      timeOccurred,
      environmentType,
      environment,
      timeWindow,
      imageDescriptions,
      logSummary,
      sessionLogs,
      sshLogs
    };

    console.log('[DEBUG] Step 1: Calling AI for Root Cause Analysis...');
    
    // Step 1: Root Cause Analysis
    const rootCausePrompt = createRootCausePrompt(promptData);
    const rootCauseResponse = await callHuggingFaceAPI(rootCausePrompt);
    
    console.log('[DEBUG] Root Cause Analysis completed');
    console.log('[DEBUG] Step 2: Calling AI for Solution Generation...');

    // Step 2: Solution Generation
    const solutionPrompt = createSolutionPrompt(promptData, rootCauseResponse);
    const solutionResponse = await callHuggingFaceAPI(solutionPrompt);
    
    console.log('[DEBUG] Solution Generation completed');

    // Parse responses and create structured result
    const analysisResult = {
      rootCauseAnalysis: {
        raw: rootCauseResponse,
        parsed: parseMarkdownResponse(rootCauseResponse)
      },
      solutionAnalysis: {
        raw: solutionResponse,
        parsed: parseMarkdownResponse(solutionResponse)
      },
      metadata: {
        sessionId,
        environment: environment.name,
        environmentType,
        timeWindow,
        analysisTimestamp: new Date().toISOString(),
        logsAvailable: {
          database: !!sessionLogs,
          ssh: !!sshLogs,
          images: attachedImages.length > 0
        }
      }
    };

    console.log('[DEBUG] Enhanced Analysis completed successfully');

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: analysisResult.metadata
    });

  } catch (error) {
    console.error('[ERROR] Enhanced root cause analysis failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'An error occurred during enhanced root cause analysis'
    }, { status: 500 });
  }
}

// Helper function to parse markdown response into structured data
function parseMarkdownResponse(markdown) {
  const sections = {};
  const lines = markdown.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      // Start new section
      currentSection = line.replace('## ', '').trim().toLowerCase().replace(/\s+/g, '_');
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}