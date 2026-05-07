import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateProductVariantDto } from '../../product-variants/dto/product-variant.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Bàn ăn gỗ sồi',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả sản phẩm',
    example: 'Bàn ăn được làm từ gỗ sồi cao cấp, thiết kế hiện đại',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID danh mục',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @ApiPropertyOptional({
    description: 'URL ảnh thumbnail sản phẩm',
    example: 'https://example.com/product-image.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Giá cơ bản (VND)',
    example: 5000000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Biến thể',
    example: [
      {
        materialId: 1,
        sizeId: 1,
        sku: 'BAN-AN-SOI-150X80',
        price: 5000000,
        stockQuantity: 10,
        minStockLevel: 5,
      },
    ],
  })
  @IsArray()
  @Type(() => CreateProductVariantDto)
  @ValidateNested({ each: true })
  variants: CreateProductVariantDto[];
}

export class UpdateProductDto extends CreateProductDto {
  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động của sản phẩm',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm trong tên và mô tả sản phẩm',
    example: 'bàn ăn',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID danh mục',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  category?: number;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái hoạt động',
    example: false,
  })
  @IsOptional()
  active?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Lấy sản phẩm đầy đủ với biến thể',
    example: true,
    default: false,
  })
  @IsOptional()
  withVariants?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Lọc theo số lượng hàng trong kho',
    example: 'in_stock',
  })
  @IsOptional()
  stock?: 'in_stock' | 'out_of_stock' | 'low_stock';

  @ApiPropertyOptional({
    description: 'Sắp xếp theo',
    example: 'name',
  })
  @IsOptional()
  sortBy?: 'name' | 'basePrice' | 'createdAt';

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    example: 'asc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class ProductSortDto {
  @ApiPropertyOptional({
    description: 'Sắp xếp theo',
    example: 'name',
  })
  @IsOptional()
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
}

export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  categoryId: number;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  minQuantity: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  category?: {
    id: number;
    name: string;
  };

  @ApiProperty()
  variantCount?: number;
}

export class ProductDetailResponseDto extends ProductResponseDto {
  @ApiProperty()
  variants?: {
    id: number;
    sku: string;
    price: number;
    stockQuantity: number;
    material: {
      id: number;
      name: string;
    };
    size: {
      id: number;
      name: string;
      lengthCm: number;
      widthCm: number;
      heightCm: number;
    };
  }[];
}

export class BulkInventoryAdjustmentItemDto {
  @ApiProperty({
    description: 'ID biến thể sản phẩm',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  productVariantId: number;

  @ApiProperty({
    description: 'Số lượng điều chỉnh (dương để tăng, âm để giảm)',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    description:
      'Lý do cụ thể cho việc điều chỉnh biến thể (tùy chọn, sẽ sử dụng lý do chung nếu không cung cấp)',
    example: 'Nhập thêm do bán chạy',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkInventoryAdjustmentDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  productId: number;

  @ApiProperty({
    description: 'Mảng các điều chỉnh tồn kho',
    type: [BulkInventoryAdjustmentItemDto],
  })
  @ValidateNested({ each: true })
  @Type(() => BulkInventoryAdjustmentItemDto)
  @IsArray()
  @ArrayNotEmpty()
  adjustments: BulkInventoryAdjustmentItemDto[];

  @ApiProperty({
    description:
      'Lý do chung cho việc điều chỉnh tồn kho (sử dụng khi không cung cấp lý do cụ thể cho từng biến thể)',
    example: 'Kiểm kê định kỳ tháng 12',
  })
  @IsNotEmpty()
  @IsString()
  globalReason: string;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm',
    example: 'Kiểm tra chất lượng OK',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
