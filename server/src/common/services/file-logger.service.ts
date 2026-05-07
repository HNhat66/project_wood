import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import { Injectable } from '@nestjs/common';

export interface LogEntry {
  timestamp: string;
  method: string;
  pathname: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  requestBody?: any;
  responseBody?: any;
}

@Injectable()
export class FileLoggerService {
  private readonly logsDir: string;
  private readonly isServerless: boolean;

  constructor() {
    // Check if running in serverless environment (Vercel, AWS Lambda, etc.)
    this.isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
    
    // Use /tmp directory for serverless environments, otherwise use logs directory
    this.logsDir = this.isServerless ? '/tmp/logs' : join(process.cwd(), 'logs');

    // Only create directory if not in serverless environment or if we can write to /tmp
    if (!this.isServerless) {
      try {
        if (!existsSync(this.logsDir)) {
          mkdirSync(this.logsDir, { recursive: true });
        }
      } catch (error) {
        console.warn('Could not create logs directory:', error.message);
      }
    } else {
      // For serverless, try to create /tmp/logs directory
      try {
        if (!existsSync(this.logsDir)) {
          mkdirSync(this.logsDir, { recursive: true });
        }
      } catch (error) {
        console.warn('Could not create logs directory in /tmp:', error.message);
      }
    }
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private getLogFileName(): string {
    const today = new Date();
    const dateStr = this.formatDate(today).replace(/\//g, '-'); // Replace / with - for filename
    return `${dateStr}.log`;
  }

  private formatLogEntry(entry: LogEntry): string {
    const logLine = {
      timestamp: entry.timestamp,
      method: entry.method,
      pathname: entry.pathname,
      statusCode: entry.statusCode,
      responseTime: `${entry.responseTime}ms`,
      userAgent: entry.userAgent || 'N/A',
      ip: entry.ip || 'N/A',
      requestBody: entry.requestBody
        ? JSON.stringify(entry.requestBody)
        : 'N/A',
      responseBody: entry.responseBody
        ? JSON.stringify(entry.responseBody)
        : 'N/A',
    };

    return JSON.stringify(logLine) + '\n';
  }

  log(entry: LogEntry): void {
    const logFileName = this.getLogFileName();
    const logFilePath = join(this.logsDir, logFileName);
    const formattedEntry = this.formatLogEntry(entry);

    try {
      // In serverless environments, we might not be able to write files
      // So we'll fall back to console logging
      if (this.isServerless) {
        // Try to write to /tmp, but if it fails, just log to console
        try {
          appendFileSync(logFilePath, formattedEntry, 'utf8');
        } catch (fileError) {
          console.log('LOG:', formattedEntry.trim());
        }
      } else {
        appendFileSync(logFilePath, formattedEntry, 'utf8');
      }
    } catch (error) {
      console.error('Lỗi khi ghi log:', error);
      // Fallback to console logging
      console.log('LOG:', formattedEntry.trim());
    }
  }

  logRequest(
    method: string,
    pathname: string,
    statusCode: number,
    responseTime: number,
    options?: {
      userAgent?: string;
      ip?: string;
      requestBody?: any;
      responseBody?: any;
    },
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method,
      pathname,
      statusCode,
      responseTime,
      ...options,
    };

    this.log(entry);
  }
}
