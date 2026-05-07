import { OrdersModule } from 'src/orders/orders.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VnpayController } from './controllers/vnpay.controller';
import { VnpayLog } from './entities/vnpay-log.entity';
import { VnpayService } from './services/vnpay.service';

@Module({
  providers: [VnpayService],
  controllers: [VnpayController],
  imports: [TypeOrmModule.forFeature([VnpayLog]), OrdersModule],
  exports: [VnpayService],
})
export class VnpayModule {}
