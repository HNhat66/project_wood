import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PaginationResponseDto } from '../common/dto/pagination.dto';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  CustomerDetailResponseDto,
  CustomerQueryDto,
  CustomerResponseDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  @ApiResponse({
    status: 201,
    description: 'Khách hàng đã được tạo thành công',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Khách hàng với số điện thoại đã tồn tại',
  })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả khách hàng với phân trang và lọc' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng trên mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên, số điện thoại, email',
  })
  @ApiResponse({
    status: 200,
    description: 'Khách hàng đã được lấy thành công',
    type: PaginationResponseDto<CustomerResponseDto>,
  })
  findAll(@Query() queryDto: CustomerQueryDto) {
    return this.customersService.findAll(queryDto);
  }

  @Get('check-by-phone/:phone')
  @ApiOperation({
    summary: 'Kiểm tra xem khách hàng có tồn tại theo số điện thoại không',
  })
  @ApiParam({
    name: 'phone',
    type: 'string',
    description: 'Số điện thoại khách hàng',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra khách hàng',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        customer: { $ref: '#/components/schemas/CustomerResponseDto' },
      },
    },
  })
  checkByPhone(@Param('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy khách hàng theo ID với lịch sử đặt hàng' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID khách hàng' })
  @ApiResponse({
    status: 200,
    description: 'Khách hàng đã được lấy thành công',
    type: CustomerDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Khách hàng không tồn tại' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật khách hàng' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID khách hàng' })
  @ApiResponse({
    status: 200,
    description: 'Khách hàng đã được cập nhật thành công',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Khách hàng không tồn tại' })
  @ApiResponse({
    status: 409,
    description: 'Khách hàng với số điện thoại đã tồn tại',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }
}
