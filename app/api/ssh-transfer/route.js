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

    // Download each log file
    for (const logPath of logPaths) {
      try {
        const fileName = path.basename(logPath.remotePath);
        const envId = environment.envId || environment.id || environment;
        // Save file with environment ID prefix
        const localPath = path.join(tempDir, `${envId}_${fileName}`);
        
        console.log(`Downloading ${logPath.remotePath} to ${localPath}`);
        
        await downloadFile(sftp, logPath.remotePath, localPath);
        
        downloadedFiles.push({
          type: logPath.type,
          remotePath: logPath.remotePath,
          localPath: localPath,
          fileName: `${envId}_${logPath.type}_${fileName}`,
          originalFileName: fileName,
          size: await getFileSize(localPath)
        });
        
        console.log(`Successfully downloaded ${fileName} as ${envId}_${fileName}`);
      } catch (error) {
        console.error(`Failed to download ${logPath.remotePath}:`, error.message);
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
        size: f.size
      })),
      processedLogs: processedLogs,
      errors: errors.length > 0 ? errors : undefined,
      environment: {
        host: host,
        name: environment.name || environment
      },
      timeRange: timeRange
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
  const envId = environment.envId || environment.id || environment;
  const logPaths = [];

  // Use the simplified log paths from environment configuration
  const basePaths = environment.logPaths || {
    swms: '/var/log/swms.log'
  };

  // Add the main log file
  Object.entries(basePaths).forEach(([type, basePath]) => {
    logPaths.push({
      type: type,
      remotePath: basePath
    });
  });

  // Also try to get dated/rotated log files for the time range
  const startDate = new Date(timeRange.start);
  const endDate = new Date(timeRange.end);
  
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const altDateStr = currentDate.getFullYear() + 
                      String(currentDate.getMonth() + 1).padStart(2, '0') + 
                      String(currentDate.getDate()).padStart(2, '0'); // YYYYMMDD
    
    Object.entries(basePaths).forEach(([type, basePath]) => {
      // Try different date formats commonly used in log rotation
      const dirName = path.dirname(basePath);
      const fileName = path.basename(basePath, '.log');
      
      // Try: swms.log.2024-07-07
      logPaths.push({
        type: `${type}_dated_dash`,
        remotePath: `${basePath}.${dateStr}`
      });
      
      // Try: swms.20240707.log  
      logPaths.push({
        type: `${type}_dated_format`,
        remotePath: path.join(dirName, `${fileName}.${altDateStr}.log`)
      });
      
      // Try: swms.log.20240707
      logPaths.push({
        type: `${type}_dated_simple`,
        remotePath: `${basePath}.${altDateStr}`
      });
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return logPaths;
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

    const tempDir = path.join(process.cwd(), 'temp_logs', sessionId);
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`Cleaned up SSH session files: ${sessionId}`);
      
      return NextResponse.json({
        success: true,
        message: `SSH session files cleaned up: ${sessionId}`
      });
    } catch (error) {
      // Directory might not exist, which is fine
      return NextResponse.json({
        success: true,
        message: `SSH session files already cleaned or don't exist: ${sessionId}`
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
