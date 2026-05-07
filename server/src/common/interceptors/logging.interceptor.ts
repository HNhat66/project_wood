import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { FileLoggerService } from '../services/file-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly fileLoggerService: FileLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();
    const method = request.method;
    const pathname = request.url;
    const userAgent = request.get('User-Agent');
    const ip = request.ip || request.connection.remoteAddress;

    // Clone request body (avoid modifying original)
    const requestBody = this.sanitizeRequestBody(request.body);

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const statusCode = response.statusCode;

          // Sanitize response body (remove sensitive data if needed)
          const sanitizedResponse = this.sanitizeResponseBody(responseBody);

          this.fileLoggerService.logRequest(
            method,
            pathname,
            statusCode,
            responseTime,
            {
              userAgent,
              ip,
              requestBody,
              responseBody: sanitizedResponse,
            },
          );
        },
        error: (error) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const statusCode = error.status || 500;

          this.fileLoggerService.logRequest(
            method,
            pathname,
            statusCode,
            responseTime,
            {
              userAgent,
              ip,
              requestBody,
              responseBody: {
                error: error.message,
                stack: error.stack,
              },
            },
          );
        },
      }),
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return null;

    // Create a copy and remove sensitive fields
    const sanitized = { ...body };

    // Remove password fields
    if (sanitized.password) {
      sanitized.password = '[REDACTED]';
    }
    if (sanitized.currentPassword) {
      sanitized.currentPassword = '[REDACTED]';
    }
    if (sanitized.newPassword) {
      sanitized.newPassword = '[REDACTED]';
    }
    if (sanitized.confirmPassword) {
      sanitized.confirmPassword = '[REDACTED]';
    }

    return sanitized;
  }

  private sanitizeResponseBody(body: any): any {
    if (!body) return null;

    // If response is too large, truncate it
    const maxSize = 1000; // Maximum characters for response body
    const serialized = typeof body === 'string' ? body : JSON.stringify(body);

    if (serialized.length > maxSize) {
      return serialized.substring(0, maxSize) + '... [TRUNCATED]';
    }

    return body;
  }
}
