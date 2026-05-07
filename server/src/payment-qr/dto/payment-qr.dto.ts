import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { QRCodeStatus } from '../../entities/payment-qr.entity';

export class CreatePaymentQRDto {
  @ApiProperty({
    description: 'URL của QR code',
    example: 'https://example.com/qr-code.png',
  })
  @IsString()
  qrCodeUrl: string;

  @ApiProperty({
    description: 'Tên ngân hàng',
    example: 'Vietcombank',
  })
  @IsString()
  bankName: string;

  @ApiProperty({
    description: 'Số tài khoản ngân hàng',
    example: '1234567890',
  })
  @IsString()
  accountNumber: string;

  @ApiProperty({
    description: 'Tên chủ tài khoản',
    example: 'NGUYEN VAN A',
  })
  @IsString()
  accountName: string;

  @ApiProperty({
    description: 'Mô tả hoặc ghi chú về QR code này',
    example: 'QR thanh toán chính cho đơn hàng online',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePaymentQRDto {
  @ApiProperty({
    description: 'URL của QR code',
    example: 'https://example.com/qr-code.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  qrCodeUrl?: string;

  @ApiProperty({
    description: 'Tên ngân hàng',
    example: 'Vietcombank',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    description: 'Số tài khoản ngân hàng',
    example: '1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({
    description: 'Tên chủ tài khoản',
    example: 'NGUYEN VAN A',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({
    description: 'Mô tả hoặc ghi chú về QR code này',
    example: 'QR thanh toán chính cho đơn hàng online',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Trạng thái QR code',
    enum: QRCodeStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(QRCodeStatus)
  status?: QRCodeStatus;
}

export class PaymentQRResponseDto {
  @ApiProperty({ description: 'QR code ID' })
  id: number;

  @ApiProperty({ description: 'URL của QR code' })
  qrCodeUrl: string;

  @ApiProperty({ description: 'Tên ngân hàng' })
  bankName: string;

  @ApiProperty({ description: 'Số tài khoản ngân hàng' })
  accountNumber: string;

  @ApiProperty({ description: 'Tên chủ tài khoản' })
  accountName: string;

  @ApiProperty({
    description: 'Mô tả hoặc ghi chú về QR code này',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Trạng thái QR code', enum: QRCodeStatus })
  status: QRCodeStatus;

  @ApiProperty({ description: 'Cập nhật bởi admin' })
  updatedBy: {
    id: number;
    fullName: string;
    email: string;
  };

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt: Date;
}

export class PaymentQRListResponseDto {
  @ApiProperty({
    description: 'Danh sách QR codes',
    type: [PaymentQRResponseDto],
  })
  data: PaymentQRResponseDto[];

  @ApiProperty({ description: 'Tổng số lượng' })
  total: number;
}
