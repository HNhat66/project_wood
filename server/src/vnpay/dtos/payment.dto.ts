import { IsNotEmpty, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentUrlDto {
  @ApiProperty({
    example: '1',
    description: 'Số tiền thanh toán',
    required: false,
  })
  @IsOptional()
  amount?: number;

  @ApiProperty({
    example: '1',
    description: 'Mã đơn hàng',
    required: true,
  })
  @IsNotEmpty()
  orderNumber: string;
}
