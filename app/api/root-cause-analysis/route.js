import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Helper function to read SWMS System Overview
// async function getSWMSSystemOverview() {
//   try {
//     const overviewPath = path.join(process.cwd(), 'public', 'SWMS_System_Overview.md');
//     const overviewContent = await fs.readFile(overviewPath, 'utf-8');
//     return overviewContent;
//   } catch (error) {
//     console.error('Error reading SWMS System Overview:', error);
//     return null;
//   }
// }

// Helper function to format time window for logs
function formatTimeWindow(issueTime) {
  const issueDate = new Date(issueTime);
  const startTime = new Date(issueDate.getTime() - 2 * 60 * 1000); // 2 minutes before
  const endTime = new Date(issueDate.getTime() + 1 * 60 * 1000);   // 1 minute after

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
    if (!sessionId) {
      console.log('[DEBUG] No sessionId provided to getSessionLogs');
      return null;
    }
    
    const logsPath = path.join(process.cwd(), 'temp_logs', sessionId);
    console.log(`[DEBUG] Looking for session logs at: ${logsPath}`);
    
    // Check if directory exists
    try {
      await fs.access(logsPath);
      console.log(`[DEBUG] Session directory found: ${sessionId}`);
    } catch {
      console.log(`Session directory not found: ${sessionId}`);
      return null;
    }
    
    const files = await fs.readdir(logsPath, { withFileTypes: true });
    const logData = {};
    
    console.log(`[DEBUG] Found ${files.length} files in session directory: ${sessionId}`);
    files.forEach(file => {
      console.log(`[DEBUG] File: ${file.name}, isFile: ${file.isFile()}, extension: ${path.extname(file.name)}`);
    });
    
    for (const file of files) {
      if (file.isFile() && (file.name.endsWith('.log') || file.name.endsWith('.txt') || file.name.endsWith('.json'))) {
        try {
          const filePath = path.join(logsPath, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          logData[file.name] = content;
          console.log(`[DEBUG] Successfully read file: ${file.name}, content length: ${content.length}`);
        } catch (error) {
          console.error(`Error reading log file ${file.name}:`, error);
        }
      }
    }
    
    console.log(`[DEBUG] Total log files loaded: ${Object.keys(logData).length}`);
    
    return Object.keys(logData).length > 0 ? logData : null;
  } catch (error) {
    console.error('Error reading session logs:', error);
    return null;
  }
}

// Helper function to read SSH log files
async function getSSHLogs(sessionId) {
    try {
    if (!sessionId) {
      console.log('[DEBUG] No sessionId provided to getSSHLogsStrict');
      return null;
    }
    
    // Extract environment ID and timestamp from session ID
    let envId = null;
    let sessionTimestamp = null;
    
    if (sessionId.startsWith('session_')) {
      const parts = sessionId.split('_');
      if (parts.length >= 3) {
        sessionTimestamp = parseInt(parts[1]);
        envId = parts.slice(2).join('_');
      }
    }
    
    if (!envId || !sessionTimestamp) {
      console.log(`[DEBUG] Could not extract required info from sessionId: ${sessionId}`);
      return null;
    }
    
    // Look for exact SSH session match: ssh_session_<close_timestamp>_<same_envId>
    const tempLogsPath = path.join(process.cwd(), 'temp_logs');
    const expectedSSHPattern = `ssh_session_`;
    
    try {
      await fs.access(tempLogsPath);
    } catch {
      return null;
    }
    
    const directories = await fs.readdir(tempLogsPath, { withFileTypes: true });
    const maxTimeDiff = 5 * 60 * 1000; // 5 minutes maximum difference

    let bestMatch = null;
    let smallestTimeDiff = Infinity;
    
    for (const dir of directories) {
      if (dir.isDirectory() && dir.name.startsWith(expectedSSHPattern)) {
        const parts = dir.name.split('_');
        if (parts.length >= 4 && parts[0] === 'ssh' && parts[1] === 'session') {
          const sshTimestamp = parseInt(parts[2]);
          const sshEnvId = parts.slice(3).join('_');
          
          // Must match environment ID exactly
          if (sshEnvId === envId) {
            const timeDiff = Math.abs(sshTimestamp - sessionTimestamp);
            
            // Must be within acceptable time window
            if (timeDiff <= maxTimeDiff && timeDiff < smallestTimeDiff) {
              bestMatch = {
                name: dir.name,
                timestamp: sshTimestamp,
                envId: sshEnvId,
                timeDiff: timeDiff,
                fullPath: path.join(tempLogsPath, dir.name)
              };
              smallestTimeDiff = timeDiff;
            }
          }
        }
      }
    }
    
    if (!bestMatch) {
      console.log(`[DEBUG] No SSH session found for session ${sessionId}`);
      return null;
    }
    
    console.log(`[DEBUG] Found SSH session: ${bestMatch.name}`);
    
    // Read the logs from the matched directory
    try {
      const sshFiles = await fs.readdir(bestMatch.fullPath, { withFileTypes: true });
      const sshLogData = {};
      
      for (const file of sshFiles) {
        if (file.isFile() && (file.name.endsWith('.log') || file.name.endsWith('.txt'))) {
          try {
            const filePath = path.join(bestMatch.fullPath, file.name);
            const content = await fs.readFile(filePath, 'utf-8');
            sshLogData[file.name] = content;
          } catch (error) {
            console.error(`Error reading SSH log file ${file.name}:`, error);
          }
        }
      }
      
      return Object.keys(sshLogData).length > 0 ? {
        directory: bestMatch.name,
        logs: sshLogData,
        metadata: {
          envId: bestMatch.envId,
          timestamp: bestMatch.timestamp,
          timeDifferenceSeconds: Math.round(bestMatch.timeDiff / 1000),
          matchQuality: 'strict'
        }
      } : null;
      
    } catch (error) {
      console.error(`Error reading SSH logs from ${bestMatch.name}:`, error);
      return null;
    }
    
  } catch (error) {
    console.error('Error reading SSH logs:', error);
    return null;
  }
}

// Create unified prompt for both root cause analysis and solution
function createUnifiedRCAPrompt(data) {
  const { issueDescription, timeOccurred, environmentType, environment, timeWindow, imageDescriptions, logSummary, sessionLogs, sshLogs } = data;
  
  console.log('[DEBUG] Creating unified prompt with data:');
  console.log('[DEBUG] - sessionLogs available:', !!sessionLogs);
  console.log('[DEBUG] - sessionLogs keys:', sessionLogs ? Object.keys(sessionLogs) : 'none');
  console.log('[DEBUG] - sshLogs available:', !!sshLogs);
  console.log('[DEBUG] - logSummary:', JSON.stringify(logSummary, null, 2));
  
  return `

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
${sessionLogs ? Object.entries(sessionLogs).map(([filename, content]) => {
  // Try to format JSON database logs better for LLM readability
  if (filename.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return `**Database File: ${filename}** (${parsed.length} records)\n${JSON.stringify(parsed, null, 2)}`;
      } else if (typeof parsed === 'object') {
        return `**Database File: ${filename}**\n${JSON.stringify(parsed, null, 2)}`;
      }
    } catch (e) {
      // If JSON parsing fails, treat as regular text
    }
  }
  return `**File: ${filename}**\n${content}`;
}).join('\n\n') : 'No database logs available'}

**SSH System Logs:**
${sshLogs ? Object.entries(sshLogs.logs).map(([filename, content]) => 
  `**SSH File: ${filename}**\n${content}`
).join('\n\n') : 'No SSH logs available'}

Please perform comprehensive Root Cause Analysis and provide Solution/Remediation for this SWMS issue using the provided data and logs.`;
}

// Helper function to save query to file for debugging
async function saveQueryToFile(prompt, sessionId) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `query_${sessionId}_${timestamp}.txt`;
    const filePath = path.join(process.cwd(), 'temp_logs', filename);
    
    const queryContent = `=== ROOT RIPPLE LLM QUERY ===
Timestamp: ${new Date().toISOString()}
Session ID: ${sessionId}
Query Length: ${prompt.length} characters

=== FULL QUERY CONTENT ===
${prompt}

=== END OF QUERY ===`;

    await fs.writeFile(filePath, queryContent, 'utf-8');
    console.log(`[DEBUG] Query saved to file: ${filename}`);
  } catch (error) {
    console.error('Error saving query to file:', error);
  }
}

// Call SAGE API
async function callSAGEAPI(prompt, additionalData = {}) {
  // Save query to file for debugging purposes
  if (additionalData.sessionId) {
    await saveQueryToFile(prompt, additionalData.sessionId);
  }

  // SAGE API configuration
  const SAGE_API_URL = "https://sage.paastry.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/rag/answer";
  const SAGE_AGENT_ID = "68aea0abb52288d30e349dbe";
  const SAGE_ENV = "DEV";

  if (!SAGE_API_URL || !SAGE_AGENT_ID) {
    throw new Error('SAGE API not configured - missing SAGE_API_URL or SAGE_AGENT_ID');
  }

  try {
    console.log(`[DEBUG] Calling SAGE API for unified RCA analysis...`);
    
    const requestBody = {
      ai_agent_id: SAGE_AGENT_ID,
      user_query: prompt,
      configuration_environment: SAGE_ENV
    };

    // Log the full request details
    console.log('[DEBUG] SAGE API Request URL:', SAGE_API_URL);
    // console.log('[DEBUG] SAGE API Request Body:', JSON.stringify(requestBody, null, 2));
    // console.log('[DEBUG] SAGE API User Query (first 500 chars):', prompt.substring(0, 500) + '...');
    // console.log('[DEBUG] SAGE API User Query (full):', prompt);

    const response = await fetch(SAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.log('[ERROR] SAGE API HTTP Error Response:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('[ERROR] SAGE API Error Body:', errorText);
      // throw new Error(`SAGE API error: ${response.status} ${response.statusText}`);
      
    }

    const result = await response.json();
    
    console.log('[DEBUG] SAGE API Response Status:', response.status);
    console.log('[DEBUG] SAGE API Response structure:', Object.keys(result));
    // console.log('[DEBUG] SAGE API Full Response:', JSON.stringify(result, null, 2));
    
    // Extract and clean the response from SAGE API response structure
    let generatedText = '';
    if (result && typeof result === 'object') {
      // SAGE API returns response in nested structure: data.responses.agent_response
      if (result.data && result.data.responses && result.data.responses.agent_response) {
        generatedText = result.data.responses.agent_response;
      } else if (result.agent_response) {
        generatedText = result.agent_response;
      } else if (result.data && result.data.agent_response) {
        generatedText = result.data.agent_response;
      } else if (result.response) {
        generatedText = result.response;
      } else if (result.answer) {
        generatedText = result.answer;
      } else if (result.content) {
        generatedText = result.content;
      } else if (result.data && typeof result.data === 'string') {
        generatedText = result.data;
      } else if (result.data && result.data.response) {
        generatedText = result.data.response;
      } else if (result.data && result.data.answer) {
        generatedText = result.data.answer;
      } else if (result.message) {
        generatedText = result.message;
      } else if (result.text) {
        generatedText = result.text;
      } else {
        console.log('[DEBUG] Full SAGE API response:', JSON.stringify(result, null, 2));
        throw new Error('No valid response field found in SAGE API response. Expected data.responses.agent_response field.');
      }
    } else if (typeof result === 'string') {
      generatedText = result;
    } else {
      throw new Error('Invalid response format from SAGE API - expected object with agent_response field');
    }

    // Clean up the response if it's wrapped in JSON format
    if (typeof generatedText === 'string') {
      // Check if the response is a JSON string containing agent_response
      if (generatedText.trim().startsWith('[') || generatedText.trim().startsWith('{')) {
        try {
          // Try to parse as JSON
          let parsed = JSON.parse(generatedText);
          
          // Handle array of objects case: ['{"agent_response": "..."}']
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (typeof parsed[0] === 'string') {
              // Parse the string inside the array
              const innerParsed = JSON.parse(parsed[0]);
              if (innerParsed.agent_response) {
                generatedText = innerParsed.agent_response;
              }
            } else if (parsed[0].agent_response) {
              generatedText = parsed[0].agent_response;
            }
          }
          // Handle direct object case: {"agent_response": "..."}
          else if (parsed.agent_response) {
            generatedText = parsed.agent_response;
          }
          // If it's just a regular JSON object without agent_response, keep as is
        } catch (jsonError) {
          console.log('[DEBUG] Response is not valid JSON, treating as plain text');
          // If JSON parsing fails, treat as regular text
        }
      }
    }

    if (!generatedText || generatedText.trim() === '') {
      throw new Error('Empty response from SAGE API');
    }

    // Additional validation for response quality
    const insufficientInfoPatterns = [
      'The available logs and evidence do not contain sufficient information',
      'insufficient information to determine a definitive answer',
      'please provide specific issue details',
      'unable to provide an answer',
      'not enough information available'
    ];
    
    const hasInsufficientInfo = insufficientInfoPatterns.some(pattern => 
      generatedText.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (hasInsufficientInfo || generatedText.trim().length < 50) {
      console.log('[WARNING] SAGE API returned insufficient or low-quality response');
      // throw new Error('SAGE API returned insufficient response quality');
    }

    console.log(`[DEBUG] SAGE API unified analysis completed successfully`);
    console.log('[DEBUG] Extracted response length:', generatedText.length);
    console.log('[DEBUG] Extracted response (first 500 chars):', generatedText.substring(0, 500) + '...');

    return {
      response: generatedText
    };
  } catch (error) {
    console.error(`[ERROR] SAGE API call failed:`, error.message);
    throw error;
  }
}

// Helper function to parse unified response into RCA and Solution parts
function parseUnifiedResponse(unifiedResponse) {
  // Look for the start of Part 2 (Solution) to split the response
  const solutionMarkers = [
    'Part 2 – Solution / Remediation',
    'Part 2 - Solution / Remediation', 
    '## Resolution & Recovery',
    '## Immediate Actions',
    'Solution / Remediation',
    'Solution:',
    'Remediation:'
  ];
  
  let splitIndex = -1;
  let usedMarker = '';
  
  for (const marker of solutionMarkers) {
    const index = unifiedResponse.indexOf(marker);
    if (index !== -1) {
      splitIndex = index;
      usedMarker = marker;
      break;
    }
  }
  
  if (splitIndex === -1) {
    // If no clear split found, try to find any solution-related headers
    const solutionPatterns = [
      /##\s*(Resolution|Solution|Remediation|Immediate Actions|Preventive Actions)/i,
      /\*\*\s*(Resolution|Solution|Remediation)\s*\*\*/i
    ];
    
    for (const pattern of solutionPatterns) {
      const match = unifiedResponse.match(pattern);
      if (match) {
        splitIndex = match.index;
        usedMarker = match[0];
        break;
      }
    }
  }
  
  if (splitIndex === -1) {
    console.log('[WARNING] Could not find solution section in unified response, returning full response as RCA');
    return {
      rootCauseAnalysis: unifiedResponse,
      solutionAnalysis: 'Solution section not clearly identified in the response. Please review the full analysis above.'
    };
  }
  
  console.log(`[DEBUG] Split unified response at marker: "${usedMarker}"`);
  
  const rootCauseAnalysis = unifiedResponse.substring(0, splitIndex).trim();
  const solutionAnalysis = unifiedResponse.substring(splitIndex).trim();
  
  return {
    rootCauseAnalysis,
    solutionAnalysis
  };
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
    // const swmsOverview = await getSWMSSystemOverview();
    // if (!swmsOverview) {
    //   console.warn('[WARNING] Could not load SWMS System Overview');
    // }

    // Format time window
    const timeWindow = formatTimeWindow(timeOccurred);
    
    // Get SSH logs
    const sshLogs = await getSSHLogs(sessionId);

    // Get session logs
    const sessionLogs = await getSessionLogs(sessionId);

    // Process images
    const imageDescriptions = processImages(attachedImages);

    // Prepare data for prompts
    const promptData = {
      //swmsOverview,
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

    console.log('[DEBUG] Calling SAGE API for unified Root Cause Analysis and Solution...');
    console.log('[DEBUG] Creating unified prompt with data:');
    console.log(`[DEBUG] - sessionLogs available: ${!!sessionLogs}`);
    console.log(`[DEBUG] - sshLogs available: ${!!sshLogs}`);
    console.log(`[DEBUG] - logSummary:`, logSummary);
    
    // Single call to SAGE API for both RCA and Solution
    const unifiedPrompt = createUnifiedRCAPrompt(promptData);
    const unifiedResult = await callSAGEAPI(
      unifiedPrompt, 
      { issueDescription, timeOccurred, environment, sessionId }
    );
    
    console.log('[DEBUG] Unified analysis completed');

    // Parse the unified response into RCA and Solution parts
    const { rootCauseAnalysis, solutionAnalysis } = parseUnifiedResponse(unifiedResult.response);

    // Parse responses and create structured result
    const analysisResult = {
      rootCauseAnalysis: {
        raw: rootCauseAnalysis,
        parsed: parseMarkdownResponse(rootCauseAnalysis)
      },
      solutionAnalysis: {
        raw: solutionAnalysis,
        parsed: parseMarkdownResponse(solutionAnalysis)
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
      currentSection = line.replace('## ', '').trim().toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and');
      currentContent = [];
    } else if (line.startsWith('### ')) {
      // Handle subsections (for CAPA sections)
      if (currentSection) {
        const subsectionName = line.replace('### ', '').trim().toLowerCase().replace(/\s+/g, '_');
        sections[currentSection + '_' + subsectionName] = [];
        currentContent.push(line);
      }
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