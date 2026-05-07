import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { OrderStatus, SalesChannel } from '../entities/order.entity';
import { UserRole } from '../entities/user.entity';
import {
  CreateOrderForOfflineDto,
  CreateOrderForOnlineDto,
  OrderResponseDto,
  UpdatePaymentDto,
  UploadPaymentProofDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // USER ENDPOINTS

  @Post()
  @ApiOperation({
    summary: 'Tạo đơn hàng mới (sản phẩm tiêu chuẩn và tùy chỉnh)',
  })
  @ApiResponse({
    status: 201,
    description: 'Đơn hàng đã được tạo thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu nhập không hợp lệ hoặc không đủ hàng',
  })
  @ApiResponse({
    status: 404,
    description: 'Biến thể sản phẩm, sản phẩm, hoặc vật liệu không tồn tại',
  })
  create(@Body() createDto: CreateOrderForOnlineDto, @Request() req) {
    return this.ordersService.createOnlineOrder(createDto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy đơn hàng của người dùng với phân trang và lọc',
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
    description: 'Số lượng trên mỗi trang (mặc định: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Lọc theo trạng thái',
  })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng của người dùng đã được lấy thành công',
  })
  findAll(
    @Query() queryDto: PaginationDto & { status?: OrderStatus },
    @Request() req,
  ) {
    return this.ordersService.findAllByUser(req.user.sub, queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Lấy đơn hàng theo ID (người dùng chỉ có thể truy cập đơn hàng của mình)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng đã được lấy thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  findOne(@Param('orderNumber') orderNumber: string, @Request() req) {
    return this.ordersService.findOne(orderNumber, req.user.sub);
  }
  @Patch(':id/cancel')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Hủy đơn hàng [Người dùng]' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng đã được hủy thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  cancelOrder(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.sub);
  }

  @Patch(':orderNumber/payment-proof')
  @ApiOperation({ summary: 'Upload bằng chứng thanh toán cho đơn hàng' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Bằng chứng thanh toán đã được upload thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Đơn hàng không ở trạng thái chờ thanh toán hoặc không đủ hàng',
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  uploadPaymentProof(
    @Param('orderNumber') orderNumber: string,
    @Body() uploadDto: UploadPaymentProofDto,
    @Request() req,
  ) {
    return this.ordersService.uploadPaymentProof(
      orderNumber,
      uploadDto,
      req.user.sub,
    );
  }
}

@ApiTags('Admin - Orders')
@Controller('admin/orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy tất cả đơn hàng với lọc nâng cao [Admin/employee]',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Tìm kiếm theo số đơn hàng, tên người dùng, hoặc tên khách hàng',
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
    name: 'channel',
    required: false,
    enum: SalesChannel,
    description: 'Lọc theo kênh bán hàng',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Lọc theo trạng thái',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Lọc theo ID người dùng trực tuyến',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: Number,
    description: 'Lọc theo ID khách hàng trực tiếp',
  })
  @ApiResponse({
    status: 200,
    description: 'Tất cả đơn hàng đã được lấy thành công',
  })
  findAll(
    @Query()
    queryDto: PaginationDto & {
      channel?: SalesChannel;
      status?: OrderStatus;
      userId?: number;
      customerId?: number;
      search?: string;
    },
  ) {
    return this.ordersService.findAllForAdmin(queryDto);
  }

  @Post('offline')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary:
      'Tạo đơn hàng trực tiếp cho khách hàng trong cửa hàng [Admin/employee]',
  })
  @ApiResponse({
    status: 201,
    description: 'Đơn hàng trực tiếp đã được tạo thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu nhập không hợp lệ hoặc ID khách hàng bắt buộc',
  })
  @ApiResponse({
    status: 404,
    description:
      'Khách hàng, biến thể sản phẩm, sản phẩm, hoặc vật liệu không tồn tại',
  })
  async createOfflineOrder(
    @Body() createDto: CreateOrderForOfflineDto,
    @Request() req,
  ) {
    return await this.ordersService.createOfflineOrder(createDto, req.user.sub);
  }

  @Get('online')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy đơn hàng trực tuyến chỉ [Admin/employee]' })
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
    enum: OrderStatus,
    description: 'Lọc theo trạng thái',
  })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng trực tuyến đã được lấy thành công',
  })
  getOnlineOrders(@Query() queryDto: PaginationDto & { status?: OrderStatus }) {
    return this.ordersService.findAllForAdmin({
      ...queryDto,
      channel: SalesChannel.ONLINE,
    });
  }

  @Get('offline')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy đơn hàng trực tiếp chỉ [Admin/employee]' })
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
    enum: OrderStatus,
    description: 'Lọc theo trạng thái',
  })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng trực tiếp đã được lấy thành công',
  })
  getOfflineOrders(
    @Query() queryDto: PaginationDto & { status?: OrderStatus },
  ) {
    return this.ordersService.findAllForAdmin({
      ...queryDto,
      channel: SalesChannel.OFFLINE,
    });
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy đơn hàng chờ cần quan tâm [Admin/employee]' })
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
    description: 'Đơn hàng chờ đã được lấy thành công',
  })
  getPendingOrders(@Query() queryDto: PaginationDto) {
    return this.ordersService.findAllForAdmin({
      ...queryDto,
      status: OrderStatus.PENDING,
    });
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy đơn hàng theo ID người dùng [Admin/employee]' })
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
    description: 'Đơn hàng của người dùng đã được lấy thành công',
  })
  getOrdersByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() queryDto: PaginationDto,
  ) {
    return this.ordersService.findAllForAdmin({
      ...queryDto,
      userId,
    });
  }

  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy đơn hàng theo ID khách hàng [Admin/employee]' })
  @ApiParam({
    name: 'customerId',
    type: 'number',
    description: 'ID khách hàng',
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
    description: 'Đơn hàng của khách hàng đã được lấy thành công',
  })
  getOrdersByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query() queryDto: PaginationDto,
  ) {
    return this.ordersService.findAllForAdmin({
      ...queryDto,
      customerId,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy đơn hàng theo ID với chi tiết đầy đủ [Admin/employee]',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng đã được lấy thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  findOne(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findOne(orderNumber); // No user filter for admin
  }

  @Patch(':id/payment')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Update order payment information [Admin/employee]',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin thanh toán đã được cập nhật thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  updatePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
  ) {
    return this.ordersService.updatePayment(id, updateDto);
  }
}

@ApiTags('Guest - Orders')
@Controller('guest/orders')
export class GuestOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Lấy đơn hàng theo số đơn hàng' })
  @ApiParam({ name: 'orderNumber', type: 'string', description: 'Số đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Đơn hàng đã được lấy thành công',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  findOne(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findOne(orderNumber);
  }
}
