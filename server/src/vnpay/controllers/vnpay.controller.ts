import { Request } from 'express';

import { Controller, Get, Query, Req } from '@nestjs/common';

import { CreatePaymentUrlDto } from '../dtos/payment.dto';
import { VnpayService } from '../services/vnpay.service';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Get('create-payment-url')
  createPaymentUrl(@Query() query: CreatePaymentUrlDto, @Req() req: Request) {
    const ip =
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown';

    return this.vnpayService.createVNPayLink({
      ip: ip,
      orderNumber: query.orderNumber,
      amount: Number(query.amount) || 0,
    });
  }

  @Get('ipn')
  handleIpn(@Query() query: any) {
    return this.vnpayService.handleCheckIpn(query);
  }
}
