import { NextResponse } from 'next/server';
import { Client } from 'ssh2';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';

export async function POST(request) {
  let sftp = null;
  let conn = null;
  
  try {
    const body = await request.json();
    const { 
      username, 
      password, 
      environment, 
      timeRange,
      sessionId 
    } = body;

    // Validate required parameters
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required', authenticationFailed: true },
        { status: 400 }
      );
    }

    if (!environment) {
      return NextResponse.json(
        { success: false, error: 'Environment is required' },
        { status: 400 }
      );
    }

    // Extract environment details
    const host = environment.host || environment.sshHost;
    const port = environment.sshPort || 22;
    
    if (!host) {
      return NextResponse.json(
        { success: false, error: 'SSH host not configured for this environment' },
        { status: 400 }
      );
    }

    console.log(`Starting SSH connection to ${host}:${port} as ${username}`);

    // Create SSH connection
    conn = new Client();
    
    const connectionPromise = new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('SSH connection established');
        resolve();
      });

      conn.on('error', (err) => {
        console.error('SSH connection error:', err.message);
        if (err.level === 'client-authentication') {
          reject(new Error('Authentication failed. Please check your username and password.'));
        } else {
          reject(new Error(`SSH connection failed: ${err.message}`));
        }
      });

      conn.on('timeout', () => {
        reject(new Error('SSH connection timeout'));
      });

      // Connect to the server
      conn.connect({
        host: host,
        port: port,
        username: username,
        password: password,
        readyTimeout: 30000, // 30 seconds
        keepaliveInterval: 30000
      });
    });

    // Wait for connection to establish
    await connectionPromise;

    // Create SFTP session
    sftp = await new Promise((resolve, reject) => {
      conn.sftp((err, sftpClient) => {
        if (err) {
          reject(new Error(`SFTP session failed: ${err.message}`));
        } else {
          resolve(sftpClient);
        }
      });
    });

    console.log('SFTP session established');

    // Determine log file paths based on environment
    const logPaths = getLogPaths(environment, timeRange);
    
    // Create temporary directory for this session
    const tempDir = path.join(process.cwd(), 'temp_logs', sessionId);
    await fs.mkdir(tempDir, { recursive: true });

    const downloadedFiles = [];
    const errors = [];

    // Use grep for time-based filtering when possible
    for (const logPath of logPaths) {
      try {
        const fileName = path.basename(logPath.remotePath);
        const envId = environment.envId || environment.id || environment;
        // Save file with environment ID prefix
        const localPath = path.join(tempDir, `${envId}_${fileName}`);
        
        console.log(`Processing ${logPath.remotePath}`);
        
        // Try to use grep for time-based filtering first
        const filteredContent = await grepLogFile(conn, logPath.remotePath, timeRange);
        
        if (filteredContent && filteredContent.trim()) {
          // Save filtered content to local file
          await fs.writeFile(localPath, filteredContent);
          
          downloadedFiles.push({
            type: logPath.type,
            remotePath: logPath.remotePath,
            localPath: localPath,
            fileName: `${envId}_${logPath.type}_${fileName}`,
            originalFileName: fileName,
            size: await getFileSize(localPath),
            filtered: true
          });
          
          console.log(`Successfully filtered and downloaded ${fileName} using grep`);
        } else {
          // Fallback to full file download if grep filtering fails
          console.log(`Grep filtering failed for ${logPath.remotePath}, downloading full file`);
          await downloadFile(sftp, logPath.remotePath, localPath);
          
          downloadedFiles.push({
            type: logPath.type,
            remotePath: logPath.remotePath,
            localPath: localPath,
            fileName: `${envId}_${logPath.type}_${fileName}`,
            originalFileName: fileName,
            size: await getFileSize(localPath),
            filtered: false
          });
          
          console.log(`Successfully downloaded ${fileName} (full file)`);
        }
      } catch (error) {
        console.error(`Failed to process ${logPath.remotePath}:`, error.message);
        errors.push({
          path: logPath.remotePath,
          error: error.message
        });
      }
    }

    // Process the downloaded log files
    const processedLogs = await processLogFiles(downloadedFiles, timeRange);

    // Close SFTP and SSH connections
    if (sftp) {
      sftp.end();
    }
    if (conn) {
      conn.end();
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      message: `Successfully retrieved ${downloadedFiles.length} log files`,
      downloadedFiles: downloadedFiles.map(f => ({
        type: f.type,
        fileName: f.fileName,
        size: f.size,
        filtered: f.filtered || false
      })),
      processedLogs: processedLogs,
      errors: errors.length > 0 ? errors : undefined,
      environment: {
        host: host,
        name: environment.name || environment
      },
      timeRange: timeRange,
      grepFilteringUsed: downloadedFiles.some(f => f.filtered)
    });

  } catch (error) {
    console.error('SSH transfer error:', error);
    
    // Clean up connections
    if (sftp) {
      try { sftp.end(); } catch (e) { /* ignore */ }
    }
    if (conn) {
      try { conn.end(); } catch (e) { /* ignore */ }
    }

    const isAuthError = error.message.toLowerCase().includes('authentication');
    
    return NextResponse.json({
      success: false,
      error: error.message,
      authenticationFailed: isAuthError
    }, { status: isAuthError ? 401 : 500 });
  }
}

// Helper function to determine log file paths based on environment
function getLogPaths(environment, timeRange) {
  const logPaths = [];

  // Use the simplified log paths from environment configuration
  const basePaths = environment.logPaths || {
    swms: '/var/log/swms.log'
  };

  // Main log file - we'll use time-based grep filtering
  Object.entries(basePaths).forEach(([type, basePath]) => {
    logPaths.push({
      type: type,
      remotePath: basePath
    });
  });

  return logPaths;
}

// Helper function to use grep for time-based log filtering
function grepLogFile(conn, remotePath, timeRange) {
  return new Promise((resolve, reject) => {
    try {
      const startTime = new Date(timeRange.start);
      const endTime = new Date(timeRange.end);
      
      // Format times for grep patterns
      const startHour = startTime.getHours().toString().padStart(2, '0');
      const startMinute = startTime.getMinutes().toString().padStart(2, '0');
      const endHour = endTime.getHours().toString().padStart(2, '0');
      const endMinute = endTime.getMinutes().toString().padStart(2, '0');
      
      // Get month abbreviation for SWMS log format (e.g., "Jul", "Aug")
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const startMonth = months[startTime.getMonth()];
      const endMonth = months[endTime.getMonth()];
      const startDay = startTime.getDate().toString().padStart(2, ' ');
      const endDay = endTime.getDate().toString().padStart(2, ' ');
      
      // Build grep command to filter by time range
      let grepCommand;
      
      if (startTime.toDateString() === endTime.toDateString()) {
        // Same day - filter by hour and minute range
        grepCommand = `grep -E "^${startMonth}\\s+${startDay}\\s+([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]" "${remotePath}" | awk '{
          time = $3;
          split(time, t, ":");
          hour = int(t[1]);
          minute = int(t[2]);
          totalMinutes = hour * 60 + minute;
          startMinutes = ${startHour} * 60 + ${startMinute};
          endMinutes = ${endHour} * 60 + ${endMinute};
          if (totalMinutes >= startMinutes && totalMinutes <= endMinutes) print $0;
        }'`;
      } else {
        // Multiple days - more complex filtering
        grepCommand = `grep -E "^(${startMonth}\\s+${startDay}|${endMonth}\\s+${endDay})\\s+([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]" "${remotePath}"`;
      }
      
      console.log(`Executing grep command: ${grepCommand}`);
      
      conn.exec(grepCommand, (err, stream) => {
        if (err) {
          console.log(`Grep command failed: ${err.message}, will fallback to full file download`);
          resolve(null);
          return;
        }
        
        let output = '';
        let errorOutput = '';
        
        stream.on('close', (code, signal) => {
          if (code === 0 || code === 1) {
            // Code 0: matches found, Code 1: no matches found (both acceptable)
            resolve(output);
          } else {
            console.log(`Grep command exited with code ${code}, will fallback to full file download`);
            resolve(null);
          }
        });
        
        stream.on('data', (data) => {
          output += data.toString();
        });
        
        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        stream.on('error', (err) => {
          console.log(`Grep stream error: ${err.message}, will fallback to full file download`);
          resolve(null);
        });
      });
    } catch (error) {
      console.log(`Grep setup error: ${error.message}, will fallback to full file download`);
      resolve(null);
    }
  });
}

// Helper function to download a file via SFTP
function downloadFile(sftp, remotePath, localPath) {
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(localPath);
    
    sftp.createReadStream(remotePath)
      .on('error', (err) => {
        writeStream.destroy();
        reject(new Error(`Failed to read remote file: ${err.message}`));
      })
      .pipe(writeStream)
      .on('error', (err) => {
        reject(new Error(`Failed to write local file: ${err.message}`));
      })
      .on('finish', () => {
        resolve();
      });
  });
}

// Helper function to get file size
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// Helper function to process downloaded log files
async function processLogFiles(downloadedFiles, timeRange) {
  const processedLogs = {
    totalFiles: downloadedFiles.length,
    totalSize: downloadedFiles.reduce((sum, file) => sum + (file.size || 0), 0),
    timeRange: timeRange,
    files: []
  };

  for (const file of downloadedFiles) {
    try {
      // Read and process the log file
      const content = await fs.readFile(file.localPath, 'utf8');
      
      // Filter logs by time range (basic implementation)
      const relevantLogs = filterLogsByTimeRange(content, timeRange);
      
      processedLogs.files.push({
        type: file.type,
        fileName: file.fileName,
        size: file.size,
        relevantEntries: relevantLogs.length,
        sampleEntries: relevantLogs.slice(0, 10) // First 10 entries for preview
      });
      
    } catch (error) {
      console.error(`Error processing file ${file.fileName}:`, error.message);
      processedLogs.files.push({
        type: file.type,
        fileName: file.fileName,
        size: file.size,
        error: `Failed to process: ${error.message}`
      });
    }
  }

  return processedLogs;
}

// Helper function to filter logs by time range
function filterLogsByTimeRange(content, timeRange) {
  const lines = content.split('\n');
  const startTime = new Date(timeRange.start);
  const endTime = new Date(timeRange.end);
  
  const relevantLines = lines.filter(line => {
    // Match the SWMS log format: Jul  7 00:02:56
    // Also handle standard ISO formats as fallback
    const swmsTimestampMatch = line.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/);
    const isoTimestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[\s\T]\d{2}:\d{2}:\d{2})/);
    
    if (swmsTimestampMatch) {
      try {
        // Parse SWMS format: Jul  7 00:02:56
        const currentYear = new Date().getFullYear();
        const logTimeStr = `${currentYear} ${swmsTimestampMatch[1]}`;
        const logTime = new Date(logTimeStr);
        
        // If parsing failed, try with previous year (in case we're at year boundary)
        if (isNaN(logTime.getTime())) {
          const prevYear = currentYear - 1;
          const prevYearTimeStr = `${prevYear} ${swmsTimestampMatch[1]}`;
          const prevYearLogTime = new Date(prevYearTimeStr);
          if (!isNaN(prevYearLogTime.getTime())) {
            return prevYearLogTime >= startTime && prevYearLogTime <= endTime;
          }
        }
        
        return logTime >= startTime && logTime <= endTime;
      } catch (error) {
        // If timestamp parsing fails, include the line to be safe
        return true;
      }
    } else if (isoTimestampMatch) {
      try {
        const logTime = new Date(isoTimestampMatch[1]);
        return logTime >= startTime && logTime <= endTime;
      } catch (error) {
        // If timestamp parsing fails, include the line to be safe
        return true;
      }
    }
    
    // Include lines without timestamps (they might be continuation lines)
    return true;
  });

  return relevantLines;
}

// DELETE endpoint to clean up temporary files
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const tempLogsDir = path.join(process.cwd(), 'temp_logs');
    const targetDir = path.join(tempLogsDir, sessionId);
    const deletedDirs = [];

    try {
      // Clean up the specific session directory
      if (await fs.access(targetDir).then(() => true).catch(() => false)) {
        await fs.rm(targetDir, { recursive: true, force: true });
        deletedDirs.push(sessionId);
        console.log(`Cleaned up SSH session directory: ${sessionId}`);
      }

      // If this is a regular session, also clean up related SSH sessions
      if (sessionId.startsWith('session_') && await fs.access(tempLogsDir).then(() => true).catch(() => false)) {
        // Extract environment ID from regular session: session_<timestamp>_<envId>
        const parts = sessionId.split('_');
        if (parts.length >= 3) {
          const envId = parts.slice(2).join('_'); // Handle envIds that might contain underscores
          
          const allDirs = await fs.readdir(tempLogsDir);
          
          for (const dir of allDirs) {
            const fullDirPath = path.join(tempLogsDir, dir);
            
            try {
              const stat = await fs.stat(fullDirPath);
              // Check if it's a directory and matches SSH session pattern for the same environment
              if (stat.isDirectory() && 
                  dir.startsWith('ssh_session_') && 
                  dir.endsWith('_' + envId)) {
                
                await fs.rm(fullDirPath, { recursive: true, force: true });
                deletedDirs.push(dir);
                console.log(`Cleaned up related SSH session directory: ${dir}`);
              }
            } catch (statError) {
              // Ignore errors reading individual directories
              continue;
            }
          }
        }
      }

      const message = deletedDirs.length > 0 
        ? `Cleaned up ${deletedDirs.length} session directory(ies): ${deletedDirs.join(', ')}`
        : `Session directory ${sessionId} already cleaned or doesn't exist`;

      return NextResponse.json({
        success: true,
        message: message,
        deletedDirectories: deletedDirs.length,
        sessionIds: deletedDirs
      });

    } catch (error) {
      // Directory might not exist, which is fine
      return NextResponse.json({
        success: true,
        message: `Session files already cleaned or don't exist: ${sessionId}`,
        deletedDirectories: 0
      });
    }

  } catch (error) {
    console.error('Error cleaning up SSH files:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
