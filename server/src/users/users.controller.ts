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

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import {
  CreateEmployeeDto,
  ResetPasswordDto,
  UpdateEmployeeDto,
  UpdateUserStatusDto,
  UserListResponseDto,
  UserQueryDto,
} from './dto/admin-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users Management')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('employees')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo tài khoản nhân viên (Chỉ admin)' })
  @ApiResponse({
    status: 201,
    description: 'Nhân viên đã được tạo thành công',
  })
  @ApiResponse({
    status: 409,
    description: 'Email, số điện thoại hoặc mã nhân viên đã tồn tại',
  })
  createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.usersService.createEmployee(createEmployeeDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy danh sách người dùng với phân trang và lọc' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng trên mỗi trang',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm',
  })
  @ApiQuery({
    name: 'roleFilter',
    required: false,
    type: String,
    description: 'Lọc theo vai trò',
  })
  @ApiQuery({
    name: 'statusFilter',
    required: false,
    type: String,
    description: 'Lọc theo trạng thái',
  })
  @ApiResponse({
    status: 200,
    description: 'Người dùng đã được lấy thành công',
    type: UserListResponseDto,
  })
  getUsers(@Query() query: UserQueryDto): Promise<UserListResponseDto> {
    return this.usersService.getUsers(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy thống kê người dùng (Chỉ admin)' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê người dùng đã được lấy thành công',
  })
  getDashboardStats() {
    return this.usersService.getDashboardStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy người dùng theo ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Người dùng đã được lấy thành công',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin nhân viên (Chỉ admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Nhân viên đã được cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  @ApiResponse({
    status: 409,
    description: 'Số điện thoại hoặc mã nhân viên đã tồn tại',
  })
  updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.usersService.updateEmployee(id, updateEmployeeDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật trạng thái người dùng (Chỉ admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái người dùng đã được cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatus(id, updateStatusDto);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset mật khẩu người dùng (Chỉ admin)' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Mật khẩu đã được reset thành công',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  @ApiResponse({
    status: 400,
    description: 'Không thể reset mật khẩu cho tài khoản khách hàng',
  })
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto);
  }
}
