import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import {
  CreateTrackingLogDto,
  TrackingLogResponseDto,
  UpdateOrderStatusWithLogDto,
} from './dto/tracking-log.dto';
import { OrderTrackingLogsService } from './order-tracking-logs.service';

@Controller('order-tracking-logs')
export class OrderTrackingLogsController {
  constructor(private readonly trackingLogsService: OrderTrackingLogsService) {}

  // Admin endpoint: Create tracking log
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async createTrackingLog(
    @Body() createDto: CreateTrackingLogDto,
    @Request() req: any,
  ): Promise<TrackingLogResponseDto> {
    return this.trackingLogsService.createTrackingLog(createDto, req.user.sub);
  }

  // Admin endpoint: Update order status with optional tracking log
  @Put('order/:orderId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async updateOrderStatusWithLog(
    @Param('orderId') orderId: string,
    @Body() updateDto: UpdateOrderStatusWithLogDto,
    @Request() req: any,
  ) {
    return this.trackingLogsService.updateOrderStatusWithLog(
      parseInt(orderId),
      updateDto,
      req.user.sub,
    );
  }

  @Get('order-number/:orderNumber')
  async getTrackingLogsByOrderNumber(
    @Param('orderNumber') orderNumber: string,
  ): Promise<TrackingLogResponseDto[]> {
    return this.trackingLogsService.getTrackingLogsByOrderNumber(orderNumber);
  }
}
