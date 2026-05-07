import { ApiProperty } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({ description: 'ID địa chỉ', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên gọi địa chỉ', example: 'Nhà riêng' })
  name: string;

  @ApiProperty({ description: 'Họ tên người nhận', example: 'Nguyễn Văn A' })
  fullName: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0912345678' })
  phone: string;

  @ApiProperty({ description: 'Địa chỉ chi tiết', example: '123 Nguyễn Văn A' })
  address: string;

  @ApiProperty({ description: 'Địa chỉ mặc định', example: true })
  isDefault: boolean;

  @ApiProperty({ description: 'Ngày tạo', example: '2023-12-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2023-12-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
