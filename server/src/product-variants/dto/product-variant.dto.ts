import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiProperty({
    description: 'Material ID',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  materialId: number;

  @ApiProperty({
    description: 'Size ID',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  sizeId: number;

  @ApiProperty({
    description: 'SKU (Stock Keeping Unit)',
    example: 'BAN-AN-SOI-150X80',
  })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Selling price in VND',
    example: 7500000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Initial stock quantity',
    example: 10,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity?: number = 0;

  @ApiPropertyOptional({
    description: 'Minimum stock level for alerts',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number = 5;
}

export class UpdateProductVariantDto extends PartialType(
  CreateProductVariantDto,
) {
  @ApiPropertyOptional({
    description: 'Product variant availability',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class ProductVariantQueryDto {
  @ApiPropertyOptional({
    description: 'Search in SKU',
    example: 'BAN-AN',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by product ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter by material ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  materialId?: number;

  @ApiPropertyOptional({
    description: 'Filter by size ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sizeId?: number;

  @ApiPropertyOptional({
    description: 'Filter by low stock (below min level)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  @IsBoolean()
  lowStock?: boolean;
}

export class ProductVariantResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  materialId: number;

  @ApiProperty()
  sizeId: number;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stockQuantity: number;

  @ApiProperty()
  minStockLevel: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  size?: {
    id: number;
    name: string;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
}

export class StockAdjustmentDto {
  @ApiProperty({
    description:
      'Adjustment quantity (positive for increase, negative for decrease)',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'Reason for adjustment',
    example: 'Nhập hàng mới',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Kiểm tra chất lượng OK',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
