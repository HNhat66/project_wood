import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AddressesService } from './addresses.service';
import { AddressResponseDto } from './dto/address-response.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { SetDefaultAddressDto } from './dto/set-default-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo địa chỉ mới' })
  @ApiResponse({
    status: 201,
    description: 'Địa chỉ đã được tạo thành công',
    type: AddressResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async create(
    @Body() createAddressDto: CreateAddressDto,
    @Request() req,
  ): Promise<AddressResponseDto> {
    return this.addressesService.create(req.user.sub, createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách địa chỉ của user hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách địa chỉ',
    type: [AddressResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async findAll(@Request() req): Promise<AddressResponseDto[]> {
    return this.addressesService.findAllByUser(req.user.sub);
  }

  @Get('default')
  @ApiOperation({ summary: 'Lấy địa chỉ mặc định của user hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Địa chỉ mặc định',
    type: AddressResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy địa chỉ mặc định',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async findDefault(@Request() req): Promise<AddressResponseDto | null> {
    return this.addressesService.findDefault(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết địa chỉ theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết địa chỉ',
    type: AddressResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy địa chỉ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<AddressResponseDto> {
    return this.addressesService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  @ApiResponse({
    status: 200,
    description: 'Địa chỉ đã được cập nhật thành công',
    type: AddressResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy địa chỉ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req,
  ): Promise<AddressResponseDto> {
    return this.addressesService.update(id, req.user.sub, updateAddressDto);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Đặt/bỏ địa chỉ mặc định' })
  @ApiResponse({
    status: 200,
    description: 'Đã cập nhật địa chỉ mặc định',
    type: AddressResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy địa chỉ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async setDefault(
    @Param('id', ParseIntPipe) id: number,
    @Body() setDefaultAddressDto: SetDefaultAddressDto,
    @Request() req,
  ): Promise<AddressResponseDto> {
    return this.addressesService.setDefault(
      id,
      req.user.sub,
      setDefaultAddressDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  @ApiResponse({
    status: 204,
    description: 'Địa chỉ đã được xóa thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa địa chỉ mặc định duy nhất',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy địa chỉ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<AddressResponseDto> {
    return await this.addressesService.remove(id, req.user.sub);
  }
}
