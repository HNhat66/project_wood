import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { LogEntry } from '../services/file-logger.service';

export interface LogFilter {
  method?: string;
  pathname?: string;
  statusCode?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export class LogViewerUtil {
  private readonly logsDir = join(process.cwd(), 'logs');

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getLogFileNames(): string[] {
    if (!existsSync(this.logsDir)) {
      return [];
    }
    return readdirSync(this.logsDir).filter((file) => file.endsWith('.log'));
  }

  getLogEntriesFromFile(filename: string): LogEntry[] {
    const filePath = join(this.logsDir, filename);

    if (!existsSync(filePath)) {
      throw new Error(`Log file ${filename} không tồn tại`);
    }

    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter((line) => line.trim());

    return lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          console.warn(`Lỗi khi phân tích dòng log: ${line}`);
          return null;
        }
      })
      .filter((entry) => entry !== null);
  }

  getLogEntriesForDate(date: Date): LogEntry[] {
    const filename = `${this.formatDate(date)}.log`;
    return this.getLogEntriesFromFile(filename);
  }

  getTodayLogs(): LogEntry[] {
    return this.getLogEntriesForDate(new Date());
  }

  filterLogs(entries: LogEntry[], filter: LogFilter): LogEntry[] {
    return entries.filter((entry) => {
      if (filter.method && entry.method !== filter.method) {
        return false;
      }

      if (filter.pathname && !entry.pathname.includes(filter.pathname)) {
        return false;
      }

      if (filter.statusCode && entry.statusCode !== filter.statusCode) {
        return false;
      }

      if (filter.dateRange) {
        const entryDate = new Date(entry.timestamp);
        if (
          entryDate < filter.dateRange.from ||
          entryDate > filter.dateRange.to
        ) {
          return false;
        }
      }

      return true;
    });
  }

  getErrorLogs(date?: Date): LogEntry[] {
    const entries = date
      ? this.getLogEntriesForDate(date)
      : this.getTodayLogs();
    return this.filterLogs(entries, {
      statusCode: 500,
    }).concat(
      this.filterLogs(entries, { statusCode: 400 }),
      this.filterLogs(entries, { statusCode: 401 }),
      this.filterLogs(entries, { statusCode: 403 }),
      this.filterLogs(entries, { statusCode: 404 }),
    );
  }

  getSlowRequests(date?: Date, thresholdMs: number = 1000): LogEntry[] {
    const entries = date
      ? this.getLogEntriesForDate(date)
      : this.getTodayLogs();
    return entries.filter((entry) => entry.responseTime > thresholdMs);
  }

  getLogStatistics(date?: Date): {
    totalRequests: number;
    errorCount: number;
    averageResponseTime: number;
    statusCodeDistribution: Record<number, number>;
    methodDistribution: Record<string, number>;
  } {
    const entries = date
      ? this.getLogEntriesForDate(date)
      : this.getTodayLogs();

    const totalRequests = entries.length;
    const errorCount = entries.filter(
      (entry) => entry.statusCode >= 400,
    ).length;
    const averageResponseTime =
      entries.reduce((sum, entry) => sum + entry.responseTime, 0) /
        totalRequests || 0;

    const statusCodeDistribution: Record<number, number> = {};
    const methodDistribution: Record<string, number> = {};

    entries.forEach((entry) => {
      statusCodeDistribution[entry.statusCode] =
        (statusCodeDistribution[entry.statusCode] || 0) + 1;
      methodDistribution[entry.method] =
        (methodDistribution[entry.method] || 0) + 1;
    });

    return {
      totalRequests,
      errorCount,
      averageResponseTime: Math.round(averageResponseTime),
      statusCodeDistribution,
      methodDistribution,
    };
  }
}
