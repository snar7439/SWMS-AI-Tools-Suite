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
    
    // Look for SSH session directories under temp_logs that belong to this environment
    const tempLogsPath = path.join(process.cwd(), 'temp_logs');

    try {
      await fs.access(tempLogsPath);
    } catch {
      return null;
    }

    const directories = await fs.readdir(tempLogsPath, { withFileTypes: true });

    // Helper to detect filtered files inside an ssh session dir
    const hasFilteredFiles = async (dirPath, sshEnvIdRaw) => {
      try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const f of files) {
          if (!f.isFile()) continue;
          const name = f.name;
          // We consider a file 'filtered' if it starts with the env id prefix and does NOT end with _full or _unprocessed
          if (name.startsWith(sshEnvIdRaw + '_') && !name.endsWith('_full') && !name.endsWith('_unprocessed')) {
            const ext = path.extname(name).toLowerCase();
            if (ext === '.log' || ext === '.txt' || ext === '.json') return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    };

    // Scanning helper: given a time window (ms), find best candidate preferring after->before
    const scanForWindow = async (windowMs) => {
      let bestAfter = null;
      let bestAfterDiff = Infinity;
      let bestBefore = null;
      let bestBeforeAbsDiff = Infinity; 

      const simpleNormalize = (s) => s.toString().toLowerCase().replace(/^lx|^opco/, '').replace(/[^a-z0-9]/g, '');

      for (const dir of directories) {
        if (!dir.isDirectory()) continue;
        if (!dir.name.startsWith('ssh_session_')) continue;

        const parts = dir.name.split('_');
        if (!(parts.length >= 4 && parts[0] === 'ssh' && parts[1] === 'session')) continue;

        const sshTimestamp = parseInt(parts[2]);
        const sshEnvIdRaw = parts.slice(3).join('_');

        // Require environment id to match exactly (or via simple normalization) before we consider this dir
        const matchEnvExact = sshEnvIdRaw === envId;
        const matchEnvNormalized = simpleNormalize(sshEnvIdRaw) === simpleNormalize(envId);
        if (!matchEnvExact && !matchEnvNormalized) continue;

        const fullPath = path.join(tempLogsPath, dir.name);

        // Only accept this SSH session if it contains filtered files
        const filtered = await hasFilteredFiles(fullPath, sshEnvIdRaw);
        if (!filtered) {
          // console.log(`[DEBUG] SSH dir ${dir.name} has no filtered files; skipping`);
          continue;
        }

        const rawDiff = sshTimestamp - sessionTimestamp;
        const absDiff = Math.abs(rawDiff);

        if (absDiff <= windowMs) {
          if (rawDiff >= 0) {
            // SSH session is after the main session
            if (rawDiff < bestAfterDiff) {
              bestAfter = { name: dir.name, timestamp: sshTimestamp, envId: sshEnvIdRaw, timeDiff: rawDiff, fullPath };
              bestAfterDiff = rawDiff;
            }
          } else {
            // SSH session is before the main session
            if (absDiff < bestBeforeAbsDiff) {
              bestBefore = { name: dir.name, timestamp: sshTimestamp, envId: sshEnvIdRaw, timeDiff: rawDiff, fullPath };
              bestBeforeAbsDiff = absDiff;
            }
          }
        }
      }

      // Prefer sessions after the main session, fallback to before
      return bestAfter || bestBefore;
    };

    // Phase 1: strict 2 minute window
    const STRICT_WINDOW = 2 * 60 * 1000; // 2 minutes
    let bestMatch = await scanForWindow(STRICT_WINDOW);

    // Phase 2: broader fallback - search up to 5 minutes
    if (!bestMatch) {
      const BROAD_WINDOW = 5 * 60 * 1000; // 5 minutes
      console.log('[DEBUG] No SSH match within strict window, expanding search to 5 minutes');
      bestMatch = await scanForWindow(BROAD_WINDOW);
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


// SAGE API configuration
const SAGE_API_URL = "https://sage.paastry.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/rag/answer";
const SAGE_AGENT_ID = "68aea0abb52288d30e349dbe";
const SAGE_FALLBACK_AGENT_ID = "68bfc7067bff2d63326a67c9"; // Fallback agent (no logs) id
const SAGE_ENV = "DEV";

// Call SAGE API
async function callSAGEAPI(prompt, additionalData = {}, options = {}) {
  // Save query to file for debugging purposes
  if (additionalData.sessionId) {
    await saveQueryToFile(prompt, additionalData.sessionId);
  }

  if (!SAGE_API_URL || !SAGE_AGENT_ID) {
    throw new Error('SAGE API not configured - missing SAGE_API_URL or SAGE_AGENT_ID');
  }

  try {
    console.log(`[DEBUG] Calling SAGE API for unified RCA analysis...`);
    
    const agentToUse = options.agentId || SAGE_AGENT_ID;

    // Add logging to show which agent is being used
    console.log(`[DEBUG] Using agent ID: ${agentToUse}`);
    if (agentToUse === SAGE_FALLBACK_AGENT_ID) {
      console.log('[DEBUG] ** USING FALLBACK AGENT (NO LOGS) **');
    } else {
      console.log('[DEBUG] ** USING PRIMARY AGENT (WITH LOGS) **');
    }
    
    const requestBody = {
      ai_agent_id: agentToUse,
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
    
    // Handle the different response formats from SAGE
    if (result && typeof result === 'object') {
      
      // Format 1: Standard nested structure
      if (result.data && result.data.responses && result.data.responses.agent_response) {
        generatedText = result.data.responses.agent_response;
        console.log('[DEBUG] Extracted from: data.responses.agent_response');
      }
      // Format 2: Direct agent_response
      else if (result.agent_response) {
        generatedText = result.agent_response;
        console.log('[DEBUG] Extracted from: agent_response');
      }
      // Format 3: Other nested variations
      else if (result.data && result.data.agent_response) {
        generatedText = result.data.agent_response;
        console.log('[DEBUG] Extracted from: data.agent_response');
      }
      else if (result.response) {
        generatedText = result.response;
        console.log('[DEBUG] Extracted from: response');
      }
      else if (result.answer) {
        generatedText = result.answer;
        console.log('[DEBUG] Extracted from: answer');
      }
      else if (result.content) {
        generatedText = result.content;
        console.log('[DEBUG] Extracted from: content');
      }
      else if (result.data && typeof result.data === 'string') {
        generatedText = result.data;
        console.log('[DEBUG] Extracted from: data (string)');
      }
      else if (result.message) {
        generatedText = result.message;
        console.log('[DEBUG] Extracted from: message');
      }
      else if (result.text) {
        generatedText = result.text;
        console.log('[DEBUG] Extracted from: text');
      }
      else {
        console.log('[DEBUG] No standard field found, checking if result itself is the response');
        // Sometimes the entire result object might be the response
        generatedText = JSON.stringify(result);
      }
    } 
    else if (typeof result === 'string') {
      generatedText = result;
      console.log('[DEBUG] Result is direct string');
    }

    // Handle special case: Array format like ['{"agent_response": "..."}']
    if (typeof generatedText === 'string') {
      const trimmedText = generatedText.trim();
      
      // Case 1: Direct markdown response (starts with ##)
      if (trimmedText.startsWith('## ')) {
        console.log('[DEBUG] Detected direct markdown response format');
        // Already in the right format, no parsing needed
      }
      // Case 2: JSON array format ['{"agent_response": "..."}'] or malformed variants
      else if (trimmedText.startsWith('[') || trimmedText.includes('["{\n')) {
        console.log('[DEBUG] Detected JSON array format (possibly malformed)');
        try {
          // First, try direct parsing
          let arrayToParse = trimmedText;
          
          // Handle malformed cases with extra quotes or characters
          if (!trimmedText.startsWith('[')) {
            // Look for the actual array start
            const arrayStart = trimmedText.indexOf('[');
            if (arrayStart !== -1) {
              arrayToParse = trimmedText.substring(arrayStart);
              console.log('[DEBUG] Cleaned array string, removed prefix');
            }
          }
          
          // Try to fix common malformations
          arrayToParse = arrayToParse
            .replace(/^'?\[/, '[')  // Remove leading quote before [
            .replace(/\]'?$/, ']')  // Remove trailing quote after ]
            .trim();
          
          console.log('[DEBUG] Attempting to parse cleaned array:', arrayToParse.substring(0, 100) + '...');
          
          const parsed = JSON.parse(arrayToParse);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstItem = parsed[0];
            if (typeof firstItem === 'string') {
              // Parse the string inside the array
              const innerParsed = JSON.parse(firstItem);
              if (innerParsed.agent_response) {
                generatedText = innerParsed.agent_response;
                console.log('[DEBUG] Extracted from JSON array string format');
              }
            } else if (typeof firstItem === 'object' && firstItem.agent_response) {
              generatedText = firstItem.agent_response;
              console.log('[DEBUG] Extracted from JSON array object format');
            }
          }
        } catch (jsonError) {
          console.log('[DEBUG] Failed to parse JSON array format:', jsonError.message);
          
          // Last resort: try to extract using regex
          console.log('[DEBUG] Attempting regex extraction as fallback');
          const regexMatch = trimmedText.match(/"agent_response":\s*"([\s\S]*?)"\s*}/);
          if (regexMatch && regexMatch[1]) {
            generatedText = regexMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            console.log('[DEBUG] Extracted using regex fallback');
          }
        }
      }
      // Case 3: JSON object format {"agent_response": "..."}
      else if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
        console.log('[DEBUG] Detected JSON object format');
        try {
          const parsed = JSON.parse(trimmedText);
          if (parsed.agent_response) {
            generatedText = parsed.agent_response;
            console.log('[DEBUG] Extracted from JSON object format');
          }
        } catch (jsonError) {
          console.log('[DEBUG] Failed to parse JSON object format:', jsonError.message);
          
          // Fallback regex for malformed JSON object
          const regexMatch = trimmedText.match(/"agent_response":\s*"([\s\S]*?)"\s*}/);
          if (regexMatch && regexMatch[1]) {
            generatedText = regexMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            console.log('[DEBUG] Extracted using regex fallback for JSON object');
          }
        }
      }
    }

    // Final validation and additional cleanup
    if (!generatedText || generatedText.trim() === '') {
      console.log('[ERROR] No valid response extracted. Raw result:', JSON.stringify(result, null, 2));
      throw new Error('Empty response from SAGE API');
    }

    // Additional check: if the response still looks like malformed JSON, try one more extraction
    const finalTrimmed = generatedText.trim();
    if (finalTrimmed.startsWith('[\'') || finalTrimmed.startsWith('["')) {
      console.log('[DEBUG] Response still appears to be malformed JSON, attempting final extraction');
      
      // Look for the actual markdown content
      const markdownMatch = finalTrimmed.match(/## [^"\\][\s\S]*/);
      if (markdownMatch) {
        generatedText = markdownMatch[0]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        console.log('[DEBUG] Final extraction successful using markdown pattern');
      } else {
        // Try to find any content that starts with ##
        const simpleMatch = finalTrimmed.match(/##[\s\S]*/);
        if (simpleMatch) {
          generatedText = simpleMatch[0]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          console.log('[DEBUG] Final extraction using simple ## pattern');
        }
      }
    }

    // Clean up any remaining escape characters
    generatedText = generatedText
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .trim();

    // Validate that we have actual markdown content
    if (!generatedText.includes('##') && generatedText.length > 100) {
      console.log('[WARNING] Extracted content does not appear to contain markdown headers');
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
    
    if (hasInsufficientInfo) {
      console.log('[WARNING] SAGE API returned insufficient information response');
    }
    
    if (generatedText.trim().length < 50) {
      console.log('[WARNING] SAGE API returned very short response');
    }

    console.log(`[DEBUG] SAGE API unified analysis completed successfully`);
    console.log('[DEBUG] Final extracted response length:', generatedText.length);
    console.log('[DEBUG] Final extracted response (first 200 chars):', generatedText.substring(0, 200) + '...');

    return {
      response: generatedText,
      hasInsufficientInfo
    };
  } catch (error) {
    console.error(`[ERROR] SAGE API call failed:`, error.message);
    throw error;
  }
}

// Helper function to parse unified response into RCA and Solution parts
function parseUnifiedResponse(unifiedResponse) {
  // Clean up any remaining escape characters first - more aggressive approach
  let cleanedResponse = unifiedResponse;
  let previousLength = 0;
  let iterations = 0;
  
  while (cleanedResponse.length !== previousLength && iterations < 5) {
    previousLength = cleanedResponse.length;
    cleanedResponse = cleanedResponse
      .replace(/\\\\n/g, '\n')    // Double-escaped newlines
      .replace(/\\n/g, '\n')      // Single-escaped newlines
      .replace(/\\\\/g, '')       // Remove stray double backslashes
      .replace(/\\\\"/g, '"')     // Double-escaped quotes
      .replace(/\\"/g, '"')       // Single-escaped quotes
      .replace(/\\\\\\\\/g, '\\') // Quadruple-escaped backslashes
      .replace(/\\\\/g, '\\');    // Double-escaped backslashes
    iterations++;
  }
  
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
    
    // Build the primary unified prompt (original flow remains unchanged)
    const unifiedPrompt = createUnifiedRCAPrompt(promptData);

    // Decide whether client requested to use fallback agent (no logs)
    const useFallbackAgent = formData.get('useFallbackAgent') === 'true';

    // Prepare a separate fallback prompt builder (minimal) when requested
    const createFallbackRCAPrompt = (data) => {
      const { issueDescription, imageDescriptions } = data || {};
      return `
**Issue Details:**
- **Issue Description:** ${issueDescription}

**Attached Images:**
${imageDescriptions || 'No images provided'}

Please provide root cause analysis and remediation recommendations based only on the issue description and screenshots. Do not assume or request database or system logs.`;
    };

    // Call SAGE API - primary flow or fallback flow
    let unifiedResult;
    if (useFallbackAgent) {
      console.log('[DEBUG] Using fallback agent (logs-less) as requested by client');
      const fallbackPrompt = createFallbackRCAPrompt({ issueDescription, imageDescriptions });
      unifiedResult = await callSAGEAPI(fallbackPrompt, { issueDescription, timeOccurred, environment, sessionId }, { agentId: SAGE_FALLBACK_AGENT_ID });
    } else {
      unifiedResult = await callSAGEAPI(unifiedPrompt, { issueDescription, timeOccurred, environment, sessionId });
    }
    
    console.log('[DEBUG] Unified analysis completed');

    // If primary agent indicated insufficient info and we didn't already use fallback, signal client
    if (unifiedResult.hasInsufficientInfo && !useFallbackAgent) {
      console.log('[DEBUG] Primary agent didn\'t return meaningful analysis. Suggesting fallback agent.');
      return NextResponse.json({
        success: false,
        agentFallbackNeeded: true,
        reason: 'no_logs',
        message: 'Primary agent could not produce a meaningful analysis from available logs. Confirm to continue without logs.'
      }, { status: 200 });
    }

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        const content = currentContent.join('\n').trim();
        sections[currentSection] = content;
      }
      // Start new section
      const sectionTitle = line.replace('## ', '').trim();
      currentSection = sectionTitle.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/&/g, 'and')
        .replace(/[^\w_]/g, '');
      currentContent = [];
    } else if (line.startsWith('### ')) {
      // Handle subsections (for CAPA sections)
      if (currentSection) {
        const subsectionName = line.replace('### ', '').trim().toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^\w_]/g, '');
        const fullSubsectionKey = currentSection + '_' + subsectionName;
        currentContent.push(line);
      }
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    const content = currentContent.join('\n').trim();
    sections[currentSection] = content;
  }
  
  // Create some common aliases for UI compatibility
  if (sections['incident_summary'] && !sections['summary']) {
    sections['summary'] = sections['incident_summary'];
  }
  if (sections['root_cause_analysis'] && !sections['root_cause_detailed']) {
    sections['root_cause_detailed'] = sections['root_cause_analysis'];
  }
  if (sections['impact_analysis'] && !sections['impact']) {
    sections['impact'] = sections['impact_analysis'];
  }
  
  return sections;
}