import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { FileLoggerService } from '../services/file-logger.service';
import { LogFilter, LogViewerUtil } from '../utils/log-viewer.util';

@ApiTags('Logs Management')
@ApiBearerAuth()
@Controller('admin/logs')
export class LogsController {
  private readonly logViewer = new LogViewerUtil();

  constructor(private readonly fileLoggerService: FileLoggerService) {}

  @Get('files')
  @ApiOperation({ summary: 'Lấy danh sách các file log' })
  getLogFiles() {
    return {
      success: true,
      data: this.logViewer.getLogFileNames(),
    };
  }

  @Get('today')
  @ApiOperation({ summary: 'Lấy log của hôm nay' })
  getTodayLogs(
    @Query('method') method?: string,
    @Query('pathname') pathname?: string,
    @Query('statusCode') statusCode?: string,
  ) {
    try {
      let logs = this.logViewer.getTodayLogs();

      const filter: LogFilter = {};
      if (method) filter.method = method;
      if (pathname) filter.pathname = pathname;
      if (statusCode) filter.statusCode = parseInt(statusCode);

      if (Object.keys(filter).length > 0) {
        logs = this.logViewer.filterLogs(logs, filter);
      }

      return {
        success: true,
        data: logs,
        count: logs.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve logs: ${error.message}`,
      );
    }
  }

  @Get('date')
  @ApiOperation({ summary: 'Lấy log cho một ngày cụ thể' })
  @ApiQuery({ name: 'date', description: 'Ngày trong định dạng YYYY-MM-DD' })
  getLogsByDate(
    @Query('date') dateString: string,
    @Query('method') method?: string,
    @Query('pathname') pathname?: string,
    @Query('statusCode') statusCode?: string,
  ) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new BadRequestException(
          'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
        );
      }

      let logs = this.logViewer.getLogEntriesForDate(date);

      const filter: LogFilter = {};
      if (method) filter.method = method;
      if (pathname) filter.pathname = pathname;
      if (statusCode) filter.statusCode = parseInt(statusCode);

      if (Object.keys(filter).length > 0) {
        logs = this.logViewer.filterLogs(logs, filter);
      }

      return {
        success: true,
        data: logs,
        count: logs.length,
        date: dateString,
      };
    } catch (error) {
      throw new BadRequestException(`Lấy log thất bại: ${error.message}`);
    }
  }

  @Get('errors')
  @ApiOperation({ summary: 'Lấy log lỗi' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Ngày trong định dạng YYYY-MM-DD',
  })
  getErrorLogs(@Query('date') dateString?: string) {
    try {
      const date = dateString ? new Date(dateString) : undefined;
      if (dateString && date && isNaN(date.getTime())) {
        throw new BadRequestException(
          'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
        );
      }

      const errorLogs = this.logViewer.getErrorLogs(date!);

      return {
        success: true,
        data: errorLogs,
        count: errorLogs.length,
        date: dateString || 'today',
      };
    } catch (error) {
      throw new BadRequestException(`Lấy log lỗi thất bại: ${error.message}`);
    }
  }

  @Get('slow-requests')
  @ApiOperation({ summary: 'Lấy các yêu cầu chậm' })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Ngưỡng thời gian (mặc định: 1000)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Ngày trong định dạng YYYY-MM-DD',
  })
  getSlowRequests(
    @Query('threshold') threshold?: string,
    @Query('date') dateString?: string,
  ) {
    try {
      const date = dateString ? new Date(dateString) : undefined;
      const thresholdMs = threshold ? parseInt(threshold) : 1000;

      if (dateString && date && isNaN(date.getTime())) {
        throw new BadRequestException(
          'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
        );
      }

      if (isNaN(thresholdMs)) {
        throw new BadRequestException('Giá trị ngưỡng không hợp lệ');
      }

      const slowRequests = this.logViewer.getSlowRequests(date!, thresholdMs);

      return {
        success: true,
        data: slowRequests,
        count: slowRequests.length,
        threshold: `${thresholdMs}ms`,
        date: dateString || 'today',
      };
    } catch (error) {
      throw new BadRequestException(
        `Lấy các yêu cầu chậm thất bại: ${error.message}`,
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê log' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Ngày trong định dạng YYYY-MM-DD',
  })
  getLogStatistics(@Query('date') dateString?: string) {
    try {
      const date = dateString ? new Date(dateString) : undefined;
      if (dateString && date && isNaN(date.getTime())) {
        throw new BadRequestException(
          'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
        );
      }

      const statistics = this.logViewer.getLogStatistics(date!);

      return {
        success: true,
        data: statistics,
        date: dateString || 'today',
      };
    } catch (error) {
      throw new BadRequestException(
        `Lấy thống kê log thất bại: ${error.message}`,
      );
    }
  }
}
