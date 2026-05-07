import { PartialType } from '@nestjs/swagger';

import { CreateAddressDto } from './create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {
  // Tất cả các properties đã được kế thừa từ CreateAddressDto và trở thành optional
}
