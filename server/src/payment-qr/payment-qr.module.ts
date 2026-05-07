import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentQRCode } from '../entities/payment-qr.entity';
import { User } from '../entities/user.entity';
import { PaymentQRController } from './payment-qr.controller';
import { PaymentQRService } from './payment-qr.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentQRCode, User])],
  controllers: [PaymentQRController],
  providers: [PaymentQRService],
  exports: [PaymentQRService],
})
export class PaymentQRModule {}
