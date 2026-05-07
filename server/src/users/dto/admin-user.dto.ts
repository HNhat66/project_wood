import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { UserRole, UserStatus } from '../../entities/user.entity';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Email nhân viên',
    example: 'employee@company.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Tên nhân viên',
    example: 'Nguyễn Văn An',
  })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại nhân viên',
    example: '0901234567',
  })
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    description: 'Vai trò nhân viên',
    enum: UserRole,
    example: UserRole.EMPLOYEE,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Mã nhân viên',
    example: 'EMP001',
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiProperty({
    description: 'Mật khẩu ban đầu (ít nhất 6 ký tự)',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Trạng thái người dùng',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    description: 'Lý do thay đổi trạng thái',
    example: 'Vi phạm chính sách công ty',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Mật khẩu mới (ít nhất 6 ký tự)',
    example: 'newpassword123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({
    description: 'Mật khẩu xác nhận (ít nhất 6 ký tự)',
    example: 'newpassword123',
  })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}

export class UpdateEmployeeDto {
  @ApiProperty({
    description: 'Tên nhân viên',
    example: 'Nguyễn Văn An',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @ApiProperty({
    description: 'Số điện thoại nhân viên',
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @ApiProperty({
    description: 'Vai trò nhân viên',
    enum: UserRole,
    example: UserRole.EMPLOYEE,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Mã nhân viên',
    example: 'EMP001',
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;
}

export class UserQueryDto {
  @ApiProperty({ description: 'Số trang', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng trên mỗi trang',
    required: false,
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: 'Tìm kiếm', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Lọc theo vai trò',
    enum: [...Object.values(UserRole), 'all'],
    required: false,
    default: 'all',
  })
  @IsOptional()
  roleFilter?: string = 'all';

  @ApiProperty({
    description: 'Lọc theo trạng thái',
    enum: [...Object.values(UserStatus), 'all'],
    required: false,
    default: 'all',
  })
  @IsOptional()
  statusFilter?: string = 'all';
}

export class UserListResponseDto {
  @ApiProperty({ description: 'Danh sách người dùng' })
  data: any[];

  @ApiProperty({ description: 'Tổng số lượng người dùng' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;

  @ApiProperty({ description: 'Số lượng trên mỗi trang' })
  limit: number;
}
