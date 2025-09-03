import { NextResponse } from "next/server";
import { Client } from "ssh2";
import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";

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
      sessionId,
      beforeMinutes = 2,
      afterMinutes = 1,
    } = body;

    // Validate required parameters
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Username and password are required",
          authenticationFailed: true,
        },
        { status: 400 }
      );
    }

    if (!environment) {
      return NextResponse.json(
        { success: false, error: "Environment is required" },
        { status: 400 }
      );
    }

    // Extract environment details
    const host = environment.host || environment.sshHost;
    const port = environment.sshPort || 22;

    if (!host) {
      return NextResponse.json(
        {
          success: false,
          error: "SSH host not configured for this environment",
        },
        { status: 400 }
      );
    }

    console.log(`Starting SSH connection to ${host}:${port} as ${username}`);

    // Create SSH connection
    conn = new Client();

    const connectionPromise = new Promise((resolve, reject) => {
      conn.on("ready", () => {
        console.log("SSH connection established");
        resolve();
      });

      conn.on("error", (err) => {
        console.error("SSH connection error:", err.message);
        if (err.level === "client-authentication") {
          reject(
            new Error(
              "Authentication failed. Please check your username and password."
            )
          );
        } else {
          reject(new Error(`SSH connection failed: ${err.message}`));
        }
      });

      conn.on("timeout", () => {
        reject(new Error("SSH connection timeout"));
      });

      // Connect to the server
      conn.connect({
        host: host,
        port: port,
        username: username,
        password: password,
        readyTimeout: 30000, // 30 seconds
        keepaliveInterval: 30000,
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

    console.log("SFTP session established");

    // Determine log file paths based on environment
    const logPaths = getLogPaths(environment, timeRange);

    // Create temporary directory for this session
    const tempDir = path.join(process.cwd(), "temp_logs", sessionId);
    await fs.mkdir(tempDir, { recursive: true });

    const downloadedFiles = [];
    const errors = [];

    // Process each log file with enhanced filtering
    for (const logPath of logPaths) {
      try {
        const fileName = path.basename(logPath.remotePath);
        const envId = environment.envId || environment.id || environment;
        // Save file with environment ID prefix
        const localPath = path.join(tempDir, `${envId}_${fileName}`);

        console.log(`Processing ${logPath.remotePath}`);

        // Try to use grep for time-based filtering first
        const filteredContent = await grepLogFile(
          conn,
          logPath.remotePath,
          timeRange
        );

        if (filteredContent && filteredContent.trim()) {
          // Remote grep filtering successful
          await fs.writeFile(localPath, filteredContent);

          downloadedFiles.push({
            type: logPath.type,
            remotePath: logPath.remotePath,
            localPath: localPath,
            fileName: `${envId}_${logPath.type}_${fileName}`,
            originalFileName: fileName,
            size: await getFileSize(localPath),
            filtered: true,
            filterMethod: "remote_grep",
          });

          console.log(
            `Successfully filtered and downloaded ${fileName} using remote grep`
          );
        } else {
          // Remote grep failed, download full file and try local filtering
          console.log(
            `Remote grep filtering failed for ${logPath.remotePath}, downloading full file for local filtering`
          );

          const fullLocalPath = path.join(tempDir, `${envId}_${fileName}_full`);
          await downloadFile(sftp, logPath.remotePath, fullLocalPath);

          console.log(`Full file downloaded, attempting local grep filtering`);

          // Try local grep filtering on the downloaded file
          const locallyFilteredContent = await localGrepFilter(
            fullLocalPath,
            timeRange
          );

          if (locallyFilteredContent && locallyFilteredContent.trim()) {
            // Local filtering successful
            await fs.writeFile(localPath, locallyFilteredContent);

            downloadedFiles.push({
              type: logPath.type,
              remotePath: logPath.remotePath,
              localPath: localPath,
              fileName: `${envId}_${logPath.type}_${fileName}`,
              originalFileName: fileName,
              size: await getFileSize(localPath),
              filtered: true,
              filterMethod: "local_grep",
            });

            console.log(
              `Successfully filtered ${fileName} using local grep after download`
            );
          } else {
            // Both remote and local filtering failed - do not send to agent
            const fullFileSize = await getFileSize(fullLocalPath);

            console.log(
              `Both grep filtering methods failed for ${fileName}. File will not be sent to agent to prevent processing issues.`
            );

            // Add to errors - file will not be processed by the agent
            errors.push({
              path: logPath.remotePath,
              error: `Both remote and local grep filtering failed. File excluded from analysis to prevent request entity issues. File size: ${(fullFileSize / 1024 / 1024).toFixed(2)}MB`,
              reason: "grep_filtering_failed",
              fileSize: fullFileSize,
            });

            // Keep the full file for potential manual analysis and rename it to indicate it's unprocessed
            const unprocessedPath = path.join(
              tempDir,
              `${envId}_${fileName}_unprocessed`
            );
            try {
              await fs.rename(fullLocalPath, unprocessedPath);
              console.log(
                `Full unfiltered file preserved at: ${unprocessedPath}`
              );
            } catch (renameError) {
              console.warn(
                `Could not rename unprocessed file:`,
                renameError.message
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `Failed to process ${logPath.remotePath}:`,
          error.message
        );
        errors.push({
          path: logPath.remotePath,
          error: error.message,
          reason: "processing_error",
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
      downloadedFiles: downloadedFiles.map((f) => ({
        type: f.type,
        fileName: f.fileName,
        size: f.size,
        filtered: f.filtered || false,
        filterMethod: f.filterMethod || "none",
        warning: f.warning || null,
      })),
      processedLogs: processedLogs,
      errors: errors.length > 0 ? errors : undefined,
      environment: {
        host: host,
        name: environment.name || environment,
      },
      timeRange: timeRange,
      filteringSummary: {
        remoteGrepSuccess: downloadedFiles.filter(
          (f) => f.filterMethod === "remote_grep"
        ).length,
        localGrepSuccess: downloadedFiles.filter(
          (f) => f.filterMethod === "local_grep"
        ).length,
        noFilteringNeeded: downloadedFiles.filter(
          (f) => f.filterMethod === "none"
        ).length,
        skippedTooLarge: errors.filter((e) => e.error.includes("too large"))
          .length,
      },
    });
  } catch (error) {
    console.error("SSH transfer error:", error);

    // Clean up connections
    if (sftp) {
      try {
        sftp.end();
      } catch (e) {
        /* ignore */
      }
    }
    if (conn) {
      try {
        conn.end();
      } catch (e) {
        /* ignore */
      }
    }

    const isAuthError = error.message.toLowerCase().includes("authentication");

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        authenticationFailed: isAuthError,
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

// Helper function to determine log file paths based on environment
function getLogPaths(environment, timeRange) {
  const logPaths = [];

  // Use the simplified log paths from environment configuration
  const basePaths = environment.logPaths || {
    swms: "/var/log/swms.log",
  };

  // Main log file - we'll use time-based grep filtering
  Object.entries(basePaths).forEach(([type, basePath]) => {
    logPaths.push({
      type: type,
      remotePath: basePath,
    });
  });

  return logPaths;
}

// Helper function to use grep for time-based log filtering via SSH
function grepLogFile(conn, remotePath, timeRange) {
  return new Promise((resolve, reject) => {
    try {
      const startTime = new Date(timeRange.start);
      const endTime = new Date(timeRange.end);

      // Format times for grep patterns
      const startHour = startTime.getHours().toString().padStart(2, "0");
      const startMinute = startTime.getMinutes().toString().padStart(2, "0");
      const endHour = endTime.getHours().toString().padStart(2, "0");
      const endMinute = endTime.getMinutes().toString().padStart(2, "0");

      // Get month abbreviation for SWMS log format (e.g., "Jul", "Aug")
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const startMonth = months[startTime.getMonth()];
      const endMonth = months[endTime.getMonth()];
      const startDay = startTime.getDate().toString().padStart(2, " ");
      const endDay = endTime.getDate().toString().padStart(2, " ");

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

      console.log(`Executing remote grep command: ${grepCommand}`);

      conn.exec(grepCommand, (err, stream) => {
        if (err) {
          console.log(
            `Remote grep command failed: ${err.message}, will try local filtering`
          );
          resolve(null);
          return;
        }

        let output = "";
        let errorOutput = "";

        stream.on("close", (code, signal) => {
          if (code === 0 || code === 1) {
            // Code 0: matches found, Code 1: no matches found (both acceptable)
            resolve(output);
          } else {
            console.log(
              `Remote grep command exited with code ${code}, will try local filtering`
            );
            resolve(null);
          }
        });

        stream.on("data", (data) => {
          output += data.toString();
        });

        stream.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        stream.on("error", (err) => {
          console.log(
            `Remote grep stream error: ${err.message}, will try local filtering`
          );
          resolve(null);
        });
      });
    } catch (error) {
      console.log(
        `Remote grep setup error: ${error.message}, will try local filtering`
      );
      resolve(null);
    }
  });
}

// Helper function for local grep filtering on downloaded files
// Uses the EXACT same filtering logic as remote grep for consistency
async function localGrepFilter(filePath, timeRange) {
  try {
    const startTime = new Date(timeRange.start);
    const endTime = new Date(timeRange.end);

    // Format times for grep patterns - same as remote grep
    const startHour = startTime.getHours().toString().padStart(2, "0");
    const startMinute = startTime.getMinutes().toString().padStart(2, "0");
    const endHour = endTime.getHours().toString().padStart(2, "0");
    const endMinute = endTime.getMinutes().toString().padStart(2, "0");

    // Get month abbreviation for SWMS log format - same as remote grep
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startMonth = months[startTime.getMonth()];
    const endMonth = months[endTime.getMonth()];
    const startDay = startTime.getDate().toString().padStart(2, " ");
    const endDay = endTime.getDate().toString().padStart(2, " ");

    console.log(
      `Attempting local grep filtering for time range: ${startMonth} ${startDay} ${startHour}:${startMinute} to ${endMonth} ${endDay} ${endHour}:${endMinute}`
    );

    // Read the entire file
    const fileContent = await fs.readFile(filePath, "utf8");
    const lines = fileContent.split("\n");

    // Apply the EXACT same filtering logic as remote grep
    const filteredLines = lines.filter((line) => {
      // First check: Match the timestamp pattern (same regex as remote grep)
      const timestampMatch = line.match(
        /^(\w{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/
      );

      if (!timestampMatch) {
        // Include lines without timestamps (they might be continuation lines)
        return true;
      }

      const [, logMonth, logDayStr, logHourStr, logMinuteStr] = timestampMatch;
      const logDay = logDayStr.padStart(2, " "); // Ensure same padding as remote grep
      const logHour = parseInt(logHourStr);
      const logMinute = parseInt(logMinuteStr);

      if (startTime.toDateString() === endTime.toDateString()) {
        // Same day filtering - exact same logic as remote grep
        if (logMonth === startMonth && logDay === startDay) {
          const totalMinutes = logHour * 60 + logMinute;
          const startMinutes = parseInt(startHour) * 60 + parseInt(startMinute);
          const endMinutes = parseInt(endHour) * 60 + parseInt(endMinute);

          return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
        }
        return false;
      } else {
        // Multiple days - same logic as remote grep
        if (
          (logMonth === startMonth && logDay === startDay) ||
          (logMonth === endMonth && logDay === endDay)
        ) {
          return true;
        }
        return false;
      }
    });

    const filteredContent = filteredLines.join("\n");

    console.log(
      `Local grep filtering completed. Original lines: ${lines.length}, Filtered lines: ${filteredLines.length}`
    );

    // Return the filtered content if we actually filtered something meaningfully
    if (filteredLines.length < lines.length * 0.9) {
      // If we filtered out at least 10% of content
      return filteredContent;
    } else if (filteredLines.length > 0) {
      // If we didn't filter much, but there's still content, return it
      return filteredContent;
    } else {
      // No relevant content found
      return null;
    }
  } catch (error) {
    console.error("Local grep filtering error:", error.message);
    return null;
  }
}

// Helper function to download a file via SFTP
function downloadFile(sftp, remotePath, localPath) {
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(localPath);

    sftp
      .createReadStream(remotePath)
      .on("error", (err) => {
        writeStream.destroy();
        reject(new Error(`Failed to read remote file: ${err.message}`));
      })
      .pipe(writeStream)
      .on("error", (err) => {
        reject(new Error(`Failed to write local file: ${err.message}`));
      })
      .on("finish", () => {
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
    filteringSummary: {
      remoteFiltered: downloadedFiles.filter(
        (f) => f.filterMethod === "remote_grep"
      ).length,
      localFiltered: downloadedFiles.filter(
        (f) => f.filterMethod === "local_grep"
      ).length,
      unfiltered: downloadedFiles.filter((f) => f.filterMethod === "none")
        .length,
    },
    files: [],
  };

  for (const file of downloadedFiles) {
    try {
      // Read and process the log file
      const content = await fs.readFile(file.localPath, "utf8");

      // For already filtered files, just count the lines
      // For unfiltered files, attempt to filter them one more time for counting
      let relevantLogs;
      if (file.filtered) {
        relevantLogs = content.split("\n").filter((line) => line.trim() !== "");
      } else {
        relevantLogs = filterLogsByTimeRange(content, timeRange);
      }

      processedLogs.files.push({
        type: file.type,
        fileName: file.fileName,
        size: file.size,
        filtered: file.filtered,
        filterMethod: file.filterMethod,
        warning: file.warning,
        relevantEntries: relevantLogs.length,
        sampleEntries: relevantLogs.slice(0, 10), // First 10 entries for preview
      });
    } catch (error) {
      console.error(`Error processing file ${file.fileName}:`, error.message);
      processedLogs.files.push({
        type: file.type,
        fileName: file.fileName,
        size: file.size,
        filtered: file.filtered,
        filterMethod: file.filterMethod,
        warning: file.warning,
        error: `Failed to process: ${error.message}`,
      });
    }
  }

  return processedLogs;
}

// Helper function to filter logs by time range (used for processing and fallback)
function filterLogsByTimeRange(content, timeRange) {
  const lines = content.split("\n");
  const startTime = new Date(timeRange.start);
  const endTime = new Date(timeRange.end);

  const relevantLines = lines.filter((line) => {
    // Match the SWMS log format: Jul  7 00:02:56
    // Also handle standard ISO formats as fallback
    const swmsTimestampMatch = line.match(
      /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/
    );
    const isoTimestampMatch = line.match(
      /(\d{4}-\d{2}-\d{2}[\s\T]\d{2}:\d{2}:\d{2})/
    );

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
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const tempLogsDir = path.join(process.cwd(), "temp_logs");
    const targetDir = path.join(tempLogsDir, sessionId);
    const deletedDirs = [];

    try {
      // Clean up the specific session directory
      if (
        await fs
          .access(targetDir)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.rm(targetDir, { recursive: true, force: true });
        deletedDirs.push(sessionId);
        console.log(`Cleaned up SSH session directory: ${sessionId}`);
      }

      // If this is a regular session, also clean up related SSH sessions
      if (
        sessionId.startsWith("session_") &&
        (await fs
          .access(tempLogsDir)
          .then(() => true)
          .catch(() => false))
      ) {
        // Extract environment ID from regular session: session_<timestamp>_<envId>
        const parts = sessionId.split("_");
        if (parts.length >= 3) {
          const envId = parts.slice(2).join("_"); // Handle envIds that might contain underscores

          const allDirs = await fs.readdir(tempLogsDir);

          for (const dir of allDirs) {
            const fullDirPath = path.join(tempLogsDir, dir);

            try {
              const stat = await fs.stat(fullDirPath);
              // Check if it's a directory and matches SSH session pattern for the same environment
              if (
                stat.isDirectory() &&
                dir.startsWith("ssh_session_") &&
                dir.endsWith("_" + envId)
              ) {
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

      const message =
        deletedDirs.length > 0
          ? `Cleaned up ${
              deletedDirs.length
            } session directory(ies): ${deletedDirs.join(", ")}`
          : `Session directory ${sessionId} already cleaned or doesn't exist`;

      return NextResponse.json({
        success: true,
        message: message,
        deletedDirectories: deletedDirs.length,
        sessionIds: deletedDirs,
      });
    } catch (error) {
      // Directory might not exist, which is fine
      return NextResponse.json({
        success: true,
        message: `Session files already cleaned or don't exist: ${sessionId}`,
        deletedDirectories: 0,
      });
    }
  } catch (error) {
    console.error("Error cleaning up SSH files:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
