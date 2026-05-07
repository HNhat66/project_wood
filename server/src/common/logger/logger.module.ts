import { Global, Module } from '@nestjs/common';

import { LogsController } from '../controllers/logs.controller';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { FileLoggerService } from '../services/file-logger.service';

@Global()
@Module({
  controllers: [LogsController],
  providers: [FileLoggerService, LoggingInterceptor],
  exports: [FileLoggerService, LoggingInterceptor],
})
export class LoggerModule {}
