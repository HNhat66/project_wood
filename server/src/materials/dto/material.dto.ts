import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Tên vật liệu',
    example: 'Gỗ Sồi',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả vật liệu',
    example: 'Gỗ sồi cao cấp nhập khẩu',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động của vật liệu',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {
  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động của vật liệu',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MaterialResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
