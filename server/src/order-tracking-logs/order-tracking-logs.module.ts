import { OrdersModule } from 'src/orders/orders.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderTrackingLog } from '../entities/order-tracking-logs.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { OrderTrackingLogsController } from './order-tracking-logs.controller';
import { OrderTrackingLogsService } from './order-tracking-logs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderTrackingLog, Order, User]),
    OrdersModule,
  ],
  controllers: [OrderTrackingLogsController],
  providers: [OrderTrackingLogsService],
  exports: [OrderTrackingLogsService],
})
export class OrderTrackingLogsModule {}
