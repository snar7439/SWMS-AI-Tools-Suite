import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { clearAll, adminKey } = await request.json();
    
    // Validate admin key for security
    const ADMIN_KEY = process.env.ADMIN_KEY;
    if (adminKey && adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin key' },
        { status: 401 }
      );
    }
    
    if (!clearAll) {
      return NextResponse.json(
        { success: false, error: 'clearAll parameter is required' },
        { status: 400 }
      );
    }
    
    // Path to temp_logs directory
    const tempLogsPath = path.join(process.cwd(), 'temp_logs');
    
    if (!fs.existsSync(tempLogsPath)) {
      return NextResponse.json({
        success: true,
        message: 'temp_logs directory does not exist',
        deletedDirectories: 0
      });
    }
    
    // Read all directories in temp_logs
    const logDirectories = fs.readdirSync(tempLogsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    let deletedCount = 0;
    const errors = [];
    
    // Delete each directory
    for (const dirName of logDirectories) {
      try {
        const dirPath = path.join(tempLogsPath, dirName);
        await fs.promises.rm(dirPath, { recursive: true, force: true });
        deletedCount++;
        console.log(`Deleted log directory: ${dirName}`);
      } catch (error) {
        console.error(`Error deleting directory ${dirName}:`, error);
        errors.push(`Failed to delete ${dirName}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Partially completed. Errors: ${errors.join(', ')}`,
        deletedDirectories: deletedCount,
        totalDirectories: logDirectories.length
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleared all log files`,
      deletedDirectories: deletedCount,
      totalDirectories: logDirectories.length
    });
    
  } catch (error) {
    console.error('Error clearing log files:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
