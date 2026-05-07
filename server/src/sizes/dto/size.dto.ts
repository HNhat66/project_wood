import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSizeDto {
  @ApiProperty({
    description: 'Tên kích thước',
    example: 'Bàn ăn tiêu chuẩn',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Chiều dài (cm)',
    example: 150.5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  lengthCm: number;

  @ApiProperty({
    description: 'Chiều rộng (cm)',
    example: 80.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  widthCm: number;

  @ApiProperty({
    description: 'Chiều cao/Độ dày  (cm)',
    example: 75.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  heightCm: number;

  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động của kích thước',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}

export class UpdateSizeDto extends PartialType(CreateSizeDto) {}

export class SizeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lengthCm: number;

  @ApiProperty()
  widthCm: number;

  @ApiProperty()
  heightCm: number;

  @ApiProperty()
  isActive: boolean;
}
