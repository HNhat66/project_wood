import { IsBoolean, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class SetDefaultAddressDto {
  @ApiProperty({
    description: 'Đặt làm địa chỉ mặc định',
    example: true,
  })
  @IsNotEmpty({ message: 'isDefault không được để trống' })
  @IsBoolean({ message: 'isDefault phải là boolean' })
  isDefault: boolean;
}
