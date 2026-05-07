import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PaymentQRCode } from '../entities/payment-qr.entity';
import { UserRole } from '../entities/user.entity';
import {
  CreatePaymentQRDto,
  PaymentQRListResponseDto,
  PaymentQRResponseDto,
  UpdatePaymentQRDto,
} from './dto/payment-qr.dto';
import { PaymentQRService } from './payment-qr.service';

@ApiTags('Payment QR Management')
@Controller('payment-qr')
export class PaymentQRController {
  constructor(private readonly paymentQRService: PaymentQRService) {}

  @Get('active')
  @ApiOperation({ summary: 'Lấy QR code thanh toán hoạt động' })
  @ApiResponse({
    status: 200,
    description: 'QR code thanh toán hoạt động đã được lấy thành công',
    type: PaymentQRResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy QR code thanh toán hoạt động',
  })
  findActive() {
    return this.paymentQRService.findActive();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mới QR code thanh toán [Chỉ admin]' })
  @ApiResponse({
    status: 201,
    description: 'QR code thanh toán đã được tạo thành công',
    type: PaymentQRResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Yêu cầu quyền admin' })
  create(@Body() createDto: CreatePaymentQRDto, @Request() req) {
    return this.paymentQRService.create(createDto, req.user.sub);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả QR code thanh toán [Chỉ admin]' })
  @ApiResponse({
    status: 200,
    description: 'QR code thanh toán đã được lấy thành công',
    type: PaymentQRListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Yêu cầu quyền admin' })
  findAll() {
    return this.paymentQRService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy QR code thanh toán theo ID [Chỉ admin]' })
  @ApiParam({ name: 'id', type: 'number', description: 'QR code ID' })
  @ApiResponse({
    status: 200,
    description: 'QR code thanh toán đã được lấy thành công',
    type: PaymentQRResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy QR code thanh toán',
  })
  @ApiResponse({ status: 403, description: 'Yêu cầu quyền admin' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentQRService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật QR code thanh toán [Chỉ admin]' })
  @ApiParam({ name: 'id', type: 'number', description: 'QR code ID' })
  @ApiResponse({
    status: 200,
    description: 'QR code thanh toán đã được cập nhật thành công',
    type: PaymentQRResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy QR code thanh toán',
  })
  @ApiResponse({ status: 403, description: 'Yêu cầu quyền admin' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentQRDto,
    @Request() req,
  ) {
    return this.paymentQRService.update(id, updateDto, req.user.sub);
  }

  @Patch(':id/set-active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Đặt QR code thanh toán làm hoạt động (vô hiệu hóa các QR code khác) [Chỉ admin]',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'QR code ID' })
  @ApiResponse({
    status: 200,
    description: 'QR code thanh toán đã được đặt làm hoạt động thành công',
    type: PaymentQRResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy QR code thanh toán',
  })
  @ApiResponse({ status: 403, description: 'Yêu cầu quyền admin' })
  setActive(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.paymentQRService.setActive(id, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa QR code thanh toán [Chỉ admin]' })
  @ApiParam({ name: 'id', type: 'number', description: 'QR code ID' })
  @ApiResponse({
    status: 200,
    description: 'QR code thanh toán đã được xóa thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy QR code thanh toán',
  })
  @ApiResponse({ status: 403, description: 'Yêu cầu quyền admin' })
  @ApiResponse({ status: 400, description: 'Không thể xóa QR code hoạt động' })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa QR code hoạt động cuối cùng',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<PaymentQRCode> {
    return await this.paymentQRService.remove(id);
  }
}
