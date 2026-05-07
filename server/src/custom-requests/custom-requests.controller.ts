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
  Query,
  Request,
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

import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomRequestStatus } from '../entities/custom-request.entity';
import { UserRole } from '../entities/user.entity';
import { CustomRequestsService } from './custom-requests.service';
import {
  CreateCustomRequestDto,
  CustomRequestListResponseDto,
  CustomRequestQueryDto,
  CustomRequestResponseDto,
  ProvideQuotationDto,
  UpdateCustomRequestDto,
} from './dto/custom-request.dto';

@ApiTags('Custom Requests')
@Controller('custom-requests')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CustomRequestsController {
  constructor(private readonly customRequestsService: CustomRequestsService) {}

  // USER ENDPOINTS

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Thêm yêu cầu tùy chỉnh' })
  @ApiResponse({
    status: 201,
    description: 'Yêu cầu tùy chỉnh đã được tạo thành công',
    type: CustomRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({
    status: 403,
    description: 'Chỉ người dùng thường có thể thêm yêu cầu tùy chỉnh',
  })
  @ApiResponse({
    status: 404,
    description: 'Sản phẩm hoặc vật liệu không tồn tại',
  })
  create(@Body() createDto: CreateCustomRequestDto, @Request() req) {
    return this.customRequestsService.create(createDto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy yêu cầu tùy chỉnh của người dùng với phân trang và lọc',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CustomRequestStatus,
    description: 'Lọc theo trạng thái',
  })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu tùy chỉnh đã được lấy thành công',
    type: CustomRequestListResponseDto,
  })
  findAll(@Query() queryDto: CustomRequestQueryDto, @Request() req) {
    return this.customRequestsService.findAllByUser(req.user.sub, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy yêu cầu tùy chỉnh bằng ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID yêu cầu tùy chỉnh' })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu tùy chỉnh đã được lấy thành công',
    type: CustomRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Yêu cầu tùy chỉnh không tồn tại' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.customRequestsService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật yêu cầu tùy chỉnh (chỉ đơn hàng chờ xử lý)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID yêu cầu tùy chỉnh' })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu tùy chỉnh đã được cập nhật thành công',
    type: CustomRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Chỉ có thể cập nhật đơn hàng chờ xử lý',
  })
  @ApiResponse({ status: 404, description: 'Yêu cầu tùy chỉnh không tồn tại' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCustomRequestDto,
    @Request() req,
  ) {
    return this.customRequestsService.update(id, updateDto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy yêu cầu tùy chỉnh (chỉ đơn hàng chờ xử lý)' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID yêu cầu tùy chỉnh' })
  @ApiResponse({
    status: 204,
    description: 'Yêu cầu tùy chỉnh đã được hủy thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Chỉ có thể hủy đơn hàng chờ xử lý',
  })
  @ApiResponse({ status: 404, description: 'Yêu cầu tùy chỉnh không tồn tại' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return await this.customRequestsService.remove(id, req.user.sub);
  }
}

@ApiTags('Admin - Custom Requests')
@Controller('admin/custom-requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdminCustomRequestsController {
  constructor(private readonly customRequestsService: CustomRequestsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary:
      'Lất tất cả yêu cầu tùy chỉnh với phân trang và lọc [Admin/nhân viên]',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng trên mỗi trang (mặc định: 20)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CustomRequestStatus,
    description: 'Lọc theo trạng thái',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Lọc theo ID người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Tất cả yêu cầu tùy chỉnh đã được lấy thành công',
    type: CustomRequestListResponseDto,
  })
  findAll(@Query() queryDto: CustomRequestQueryDto) {
    return this.customRequestsService.findAllForAdmin(queryDto);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy đơn hàng chờ xử lý [Admin/nhân viên]' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng trên mỗi trang (mặc định: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng chờ xử lý đã được lấy thành công',
    type: CustomRequestListResponseDto,
  })
  getPendingRequests(@Query() paginationDto: PaginationDto) {
    return this.customRequestsService.getPendingRequests(paginationDto);
  }

  @Get('quoted')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary:
      'Lấy đơn hàng đã được báo giá và chờ phản hồi từ khách hàng [Admin/nhân viên]',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng trên mỗi trang (mặc định: 20)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Đơn hàng đã được báo giá và chờ phản hồi từ khách hàng đã được lấy thành công',
    type: CustomRequestListResponseDto,
  })
  getQuotedRequests(@Query() paginationDto: PaginationDto) {
    return this.customRequestsService.getQuotedRequests(paginationDto);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy thống kê yêu cầu tùy chỉnh [Admin chỉ]' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê yêu cầu tùy chỉnh đã được lấy thành công',
  })
  getStats() {
    return this.customRequestsService.getRequestStats();
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy yêu cầu tùy chỉnh theo ID người dùng [Admin/nhân viên]',
  })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID người dùng' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng trên mỗi trang (mặc định: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu tùy chỉnh của người dùng đã được lấy thành công',
    type: CustomRequestListResponseDto,
  })
  getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.customRequestsService.getRequestsByUser(userId, paginationDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy yêu cầu tùy chỉnh theo ID [Admin/nhân viên]' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID yêu cầu tùy chỉnh' })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu tùy chỉnh đã được lấy thành công',
    type: CustomRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Yêu cầu tùy chỉnh không tồn tại' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customRequestsService.findOne(id); // No userId filter for admin
  }

  @Patch(':id/quote')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Cung cấp báo giá cho yêu cầu tùy chỉnh [Admin chỉ]',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID yêu cầu tùy chỉnh' })
  @ApiResponse({
    status: 200,
    description: 'Báo giá đã được cung cấp thành công',
    type: CustomRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Chỉ có thể báo giá đơn hàng chờ xử lý',
  })
  @ApiResponse({ status: 403, description: 'Cần quyền admin' })
  @ApiResponse({ status: 404, description: 'Yêu cầu tùy chỉnh không tồn tại' })
  provideQuotation(
    @Param('id', ParseIntPipe) id: number,
    @Body() quotationDto: ProvideQuotationDto,
    @Request() req,
  ) {
    return this.customRequestsService.provideQuotation(
      id,
      quotationDto,
      req.user.sub,
    );
  }
}
