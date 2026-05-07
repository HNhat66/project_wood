import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { CustomRequestStatus } from '../../entities/custom-request.entity';

export class CreateCustomRequestDto {
  @ApiProperty({
    description: 'ID mẫu sản phẩm cơ sở',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({
    description: 'Chiều rộng tùy chỉnh (cm)',
    example: 120.5,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customWidth: number;

  @ApiProperty({
    description: 'Chiều cao tùy chỉnh (cm)',
    example: 80.0,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customHeight: number;

  @ApiProperty({
    description: 'Chiều sâu tùy chỉnh (cm)',
    example: 40.0,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customDepth: number;

  @ApiProperty({
    description: 'ID vật liệu ưu tiên',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  materialId: number;

  @ApiPropertyOptional({
    description: 'Yêu cầu đặc biệt hoặc ghi chú từ khách hàng',
    example: 'Cần góc bo tròn và hoàn thiện đặc biệt',
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}

export class UpdateCustomRequestDto {
  @ApiPropertyOptional({
    description: 'Chiều rộng tùy chỉnh (cm)',
    example: 120.5,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customWidth?: number;

  @ApiPropertyOptional({
    description: 'Chiều cao tùy chỉnh (cm)',
    example: 80.0,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customHeight?: number;

  @ApiPropertyOptional({
    description: 'Chiều sâu tùy chỉnh (cm)',
    example: 40.0,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000)
  customDepth?: number;

  @ApiPropertyOptional({
    description: 'ID vật liệu ưu tiên',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  materialId?: number;

  @ApiPropertyOptional({
    description: 'Yêu cầu đặc biệt hoặc ghi chú từ khách hàng',
    example: 'Cần góc bo tròn và hoàn thiện đặc biệt',
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}

export class ProvideQuotationDto {
  @ApiProperty({
    description: 'Tổng giá được báo giá',
    example: 1500000,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quotedPrice: number;

  @ApiPropertyOptional({
    description: 'Ngày sản xuất dự kiến',
    example: 14,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDays?: number;

  @ApiPropertyOptional({
    description: 'Ghi chú quản lý cho tham khảo nội bộ',
    example: 'Khách hàng yêu cầu loại gỗ cao cấp',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class CustomRequestQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái',
    enum: CustomRequestStatus,
  })
  @IsOptional()
  @IsEnum(CustomRequestStatus)
  status?: CustomRequestStatus;

  @ApiPropertyOptional({
    description: 'Lọc theo ID người dùng (chỉ admin)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId?: number;
}

export class CustomRequestResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  userId: number;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 1200.5 })
  customWidth: number;

  @ApiProperty({ example: 800.0 })
  customHeight: number;

  @ApiProperty({ example: 400.0 })
  customDepth: number;

  @ApiProperty({ example: 2 })
  materialId: number;

  @ApiPropertyOptional({ example: 'Cần góc bo tròn' })
  specialRequirements?: string;

  @ApiProperty({ enum: CustomRequestStatus })
  status: CustomRequestStatus;

  @ApiPropertyOptional({ example: 1500000 })
  quotedPrice?: number;

  @ApiPropertyOptional({ example: 14 })
  estimatedDays?: number;

  @ApiPropertyOptional({ example: 'Khách hàng yêu cầu loại gỗ cao cấp' })
  adminNotes?: string;

  @ApiPropertyOptional({ example: 10 })
  quotedById?: number;

  @ApiPropertyOptional()
  quotedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional()
  user?: any;

  @ApiPropertyOptional()
  product?: any;

  @ApiPropertyOptional()
  material?: any;

  @ApiPropertyOptional()
  quotedBy?: any;
}

export class CustomRequestListResponseDto {
  @ApiProperty({ type: [CustomRequestResponseDto] })
  data: CustomRequestResponseDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
