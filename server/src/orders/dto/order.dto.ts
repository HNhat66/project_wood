import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  DeliveryType,
  OrderStatus,
  SalesChannel,
} from '../../entities/order.entity';

export class CreateStandardOrderItemDto {
  @ApiProperty({
    description: 'ID biến thể sản phẩm',
    example: 15,
  })
  @IsInt()
  @IsPositive()
  productVariantId: number;

  @ApiProperty({
    description: 'Số lượng',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateCustomOrderItemDto {
  @ApiProperty({
    description: 'ID mẫu sản phẩm',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({
    description: 'Chiều rộng tùy chỉnh (cm)',
    example: 1200.5,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customWidth: number;

  @ApiProperty({
    description: 'Chiều cao tùy chỉnh (cm)',
    example: 800.0,
    minimum: 100,
    maximum: 1000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customHeight: number;

  @ApiProperty({
    description: 'Chiều sâu tùy chỉnh (cm)',
    example: 400.0,
    minimum: 100,
    maximum: 1000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customDepth: number;

  @ApiProperty({
    description: 'ID vật liệu',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  materialId: number;

  @ApiProperty({
    description: 'Số lượng',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Giá đơn vị cho mục tùy chỉnh này',
    example: 1500000,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Yêu cầu đặc biệt',
    example: 'Need rounded corners and special finish',
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiPropertyOptional({
    description: 'Ngày sản xuất dự kiến (ngày) / admin set',
    example: 14,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDays?: number;
}

export class CreateCustomOrderItemForOnlineDto extends CreateCustomOrderItemDto {
  @ApiProperty({
    description: 'ID yêu cầu tùy chỉnh',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  customRequestId: number;
}

export class CreateOrderForOfflineDto {
  // Customer information (can be new or existing)
  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyen Van A',
  })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({
    description:
      'Số điện thoại khách hàng (dùng để kiểm tra khách hàng tồn tại)',
    example: '0901234567',
  })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiPropertyOptional({
    description: 'Email khách hàng',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiProperty({
    description: 'Địa chỉ giao hàng',
    example: '123 Main St, District 1, Ho Chi Minh City',
  })
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({
    description: 'Loại giao hàng',
    enum: DeliveryType,
    example: DeliveryType.STANDARD,
  })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiPropertyOptional({
    description: 'Mô tả thời gian giao hàng dự kiến',
    example: '2-3 business days',
  })
  @IsOptional()
  @IsString()
  estimatedDeliveryDays?: string;

  // Order items (at least one type must be provided)
  @ApiPropertyOptional({
    description: 'Mục sản phẩm tiêu chuẩn',
    type: [CreateStandardOrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStandardOrderItemDto)
  standardItems?: CreateStandardOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Mục sản phẩm tùy chỉnh',
    type: [CreateCustomOrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomOrderItemDto)
  customItems?: CreateCustomOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Số tiền đặt cọc đã trả trước',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({
    description: 'URL/tham chiếu chứng từ thanh toán',
    example: 'https://storage.example.com/payment-proof-123.jpg',
  })
  @IsOptional()
  @IsString()
  paymentProof?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú đơn hàng',
    example: 'Customer requested expedited delivery',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
// with online user get cart item for standard

export class CreateOrderForOnlineDto {
  @ApiPropertyOptional({
    description: 'Ghi chú đơn hàng',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'ID địa chỉ giao hàng',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  deliveryAddressId: number;

  @ApiProperty({
    description: 'Loại giao hàng',
    example: 'standard',
    enum: ['standard', 'express'],
    default: 'standard',
  })
  @IsString()
  deliveryType: string;

  @ApiProperty({
    description: 'Mục sản phẩm tùy chỉnh',
    example: {
      productId: 1,
      customRequestId: 1,
      customWidth: 100,
      customHeight: 100,
      customDepth: 100,
      materialId: 1,
      quantity: 1,
      specialRequirements: 'Need rounded corners and special finish',
      unitPrice: 1000000,
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomOrderItemForOnlineDto)
  customItems: CreateCustomOrderItemForOnlineDto[];
}
export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Trạng thái đơn hàng mới',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({
    description: 'Ghi chú thay đổi trạng thái',
    example: 'Items ready for delivery',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentDto {
  @ApiProperty({
    description: 'Số tiền thanh toán thêm',
    example: 500000,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paymentAmount: number;

  @ApiPropertyOptional({
    description: 'URL/tham chiếu chứng từ thanh toán',
    example: 'https://storage.example.com/payment-proof-456.jpg',
  })
  @IsOptional()
  @IsString()
  paymentProof?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú thanh toán',
    example: 'Final payment completed via bank transfer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UploadPaymentProofDto {
  @ApiProperty({
    description: 'URL chứng từ thanh toán',
    example: 'https://storage.example.com/payment-proof.jpg',
  })
  @IsNotEmpty()
  @IsString()
  paymentProof: string;

  @ApiProperty({
    description: 'Số tiền đặt cọc (30-100% tổng giá trị đơn hàng)',
    example: 500000,
    minimum: 1,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  depositAmount: number;

  @ApiPropertyOptional({
    description: 'Ghi chú thanh toán',
    example: 'Payment made via bank transfer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'standard' })
  type: 'standard' | 'custom';

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 750000 })
  unitPrice: number;

  @ApiProperty({ example: 1500000 })
  totalPrice: number;

  @ApiPropertyOptional({ example: 'Ghi chú khách hàng' })
  notes?: string;

  // Standard item specific
  @ApiPropertyOptional({ example: 15 })
  productVariantId?: number;

  @ApiPropertyOptional()
  productVariant?: any;

  // Custom item specific
  @ApiPropertyOptional({ example: 1 })
  productId?: number;

  @ApiPropertyOptional({ example: 5 })
  customRequestId?: number;

  @ApiPropertyOptional({ example: 1200.5 })
  customWidth?: number;

  @ApiPropertyOptional({ example: 800.0 })
  customHeight?: number;

  @ApiPropertyOptional({ example: 400.0 })
  customDepth?: number;

  @ApiPropertyOptional({ example: 2 })
  materialId?: number;

  @ApiPropertyOptional({ example: 'Yêu cầu đặc biệt' })
  specialRequirements?: string;

  @ApiPropertyOptional({ example: 14 })
  estimatedDays?: number;

  @ApiPropertyOptional()
  product?: any;

  @ApiPropertyOptional()
  material?: any;

  @ApiPropertyOptional()
  customRequest?: any;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ORD-2024-001' })
  orderNumber: string;

  @ApiPropertyOptional({ example: 5 })
  userId?: number;

  @ApiPropertyOptional({ example: 10 })
  customerId?: number;

  @ApiProperty({ enum: SalesChannel })
  channel: SalesChannel;

  @ApiProperty({ enum: OrderStatus })
  orderStatus: OrderStatus;

  @ApiProperty({ example: 2000000 })
  totalAmount: number;

  @ApiProperty({ example: 100000 })
  discountAmount: number;

  @ApiProperty({ example: 1900000 })
  finalAmount: number;

  @ApiProperty({ example: 500000 })
  depositAmount: number;

  @ApiProperty({ example: 1400000 })
  remainingAmount: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  deliveryName: string;

  @ApiProperty({ example: '0901234567' })
  deliveryPhone: string;

  @ApiProperty({ example: '123 Main St, District 1, HCMC' })
  deliveryAddress: string;

  @ApiProperty({ enum: DeliveryType })
  deliveryType: DeliveryType;

  @ApiPropertyOptional({ example: '2-3 business days' })
  estimatedDeliveryDays?: string;

  @ApiPropertyOptional({ example: 'payment-proof.jpg' })
  paymentProof?: string;

  @ApiPropertyOptional({ example: 'Rush order' })
  notes?: string;

  @ApiPropertyOptional({ example: 15 })
  createdById?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional()
  user?: any;

  @ApiPropertyOptional()
  customer?: any;

  @ApiPropertyOptional()
  createdByUser?: any;

  @ApiPropertyOptional()
  cancelByUser?: any;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional()
  trackingLogs?: Array<{
    id: number;
    message: string;
    createdAt: Date;
    createdBy: {
      id: number;
      fullName: string;
      role: string;
    };
  }>;

  @ApiPropertyOptional({ example: 'Lý do hủy đơn hàng' })
  reasonCancel?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  cancelAt?: Date;

  @ApiPropertyOptional({ example: 1 })
  cancelById?: number;
}
