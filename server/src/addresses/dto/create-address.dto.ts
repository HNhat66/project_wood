import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Tên gọi địa chỉ',
    example: 'Nhà riêng',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Tên địa chỉ không được để trống' })
  @IsString({ message: 'Tên địa chỉ phải là chuỗi' })
  @Length(1, 100, { message: 'Tên địa chỉ phải từ 1-100 ký tự' })
  name: string;

  @ApiProperty({
    description: 'Họ tên người nhận',
    example: 'Nguyễn Văn A',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @Length(1, 255, { message: 'Họ tên phải từ 1-255 ký tự' })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại người nhận',
    example: '0912345678',
    maxLength: 15,
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Length(10, 15, { message: 'Số điện thoại phải từ 10-15 ký tự' })
  phone: string;

  @ApiProperty({
    description: 'Địa chỉ chi tiết (số nhà, tên đường)',
    example: '123 Nguyễn Văn A',
  })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address: string;

  @ApiProperty({
    description: 'Đặt làm địa chỉ mặc định',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault phải là boolean' })
  isDefault?: boolean;
}
