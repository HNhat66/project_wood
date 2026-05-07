import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID phiên bản sản phẩm',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  productVariantId: number;

  @ApiProperty({
    description: 'Số lượng cần thêm',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class RemoveFromCartDto {
  @ApiProperty({
    description: 'ID bản sản phẩm cần xóa',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  productVariantId: number;
}

export class UpdateCartVariantDto {
  @ApiProperty({
    description: 'ID bản sản phẩm cần cập nhật',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  productVariantId: number;

  @ApiProperty({
    description: 'Số lượng mới',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

// New grouped cart format DTOs
export class CartVariantDto {
  @ApiProperty({ description: 'ID vật liệu' })
  materialId: number;

  @ApiProperty({ description: 'Tên vật liệu' })
  materialName: string;

  @ApiProperty({ description: 'ID kích thước' })
  sizeId: number;

  @ApiProperty({ description: 'Tên kích thước' })
  sizeName: string;

  @ApiProperty({ description: 'Giá của phiên bản này' })
  price: string;

  @ApiProperty({ description: 'Số lượng trong giỏ hàng' })
  quantity: number;

  @ApiProperty({ description: 'ID phiên bản sản phẩm để tham khảo' })
  productVariantId: number;

  @ApiProperty({ description: 'SKU để tham khảo' })
  sku: string;

  @ApiProperty({ description: 'Số lượng tồn kho có sẵn' })
  stockQuantity: number;
}

export class CartProductDto {
  @ApiProperty({ description: 'Chi tiết sản phẩm' })
  product: {
    id: number;
    name: string;
    category: string;
    thumbnailUrl?: string;
  };

  @ApiProperty({
    description: 'Các phiên bản sản phẩm trong giỏ hàng',
    type: [CartVariantDto],
  })
  variants: CartVariantDto[];
}

export class GroupedCartResponseDto {
  @ApiProperty({ description: 'ID người dùng' })
  userId: number;

  @ApiProperty({
    description: 'Các sản phẩm trong giỏ hàng',
    type: [CartProductDto],
  })
  cartItems: CartProductDto[];

  @ApiProperty({ description: 'Tổng số lượng (tổng của tất cả số lượng)' })
  totalItems: number;

  @ApiProperty({ description: 'Tổng giá trị giỏ hàng' })
  totalAmount: number;

  @ApiProperty({ description: 'Giỏ hàng được tạo vào' })
  createdAt: Date;

  @ApiProperty({ description: 'Giỏ hàng được cập nhật vào' })
  updatedAt: Date;
}

export class CheckoutFromCartDto {
  @ApiProperty({
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
}
