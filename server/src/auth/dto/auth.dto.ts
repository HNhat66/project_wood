import {
  IsBoolean,
  IsDateString,
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

export class LoginDto {
  @ApiProperty({
    description: 'Email người dùng',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu người dùng',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Số điện thoại người dùng',
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Email người dùng',
    example: 'customer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu người dùng (ít nhất 6 ký tự)',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Xác nhận mật khẩu người dùng',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({
    description: 'Tên người dùng',
    example: 'Nguyễn Văn An',
  })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại người dùng',
    example: '0901234567',
  })
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    description: 'Địa chỉ người dùng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Đồng ý với điều khoản sử dụng',
    example: true,
  })
  @IsBoolean()
  agreedToTerms: boolean;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Tên người dùng',
    example: 'Nguyễn Văn An',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @ApiProperty({
    description: 'Số điện thoại người dùng',
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @ApiProperty({
    description: 'Địa chỉ người dùng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Ngày sinh người dùng',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Giới tính người dùng',
    enum: ['male', 'female', 'other'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'oldpassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới (ít nhất 6 ký tự)',
    example: 'newpassword123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token làm mới',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token: string;
}

export class DeviceSessionDto {
  @ApiProperty({ description: 'ID phiên' })
  id: number;

  @ApiProperty({ description: 'Thông tin thiết bị', required: false })
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    deviceName?: string;
    platform?: string;
  };

  @ApiProperty({ description: 'Lần sử dụng cuối cùng', required: false })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;
}

export class SessionsResponseDto {
  @ApiProperty({
    description: 'Các phiên đang hoạt động',
    type: [DeviceSessionDto],
  })
  sessions: DeviceSessionDto[];
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'ID người dùng' })
  id: number;

  @ApiProperty({ description: 'Email người dùng' })
  email: string;

  @ApiProperty({ description: 'Tên người dùng' })
  fullName: string;

  @ApiProperty({ description: 'Số điện thoại người dùng', required: false })
  phone?: string;

  @ApiProperty({ description: 'Vai trò người dùng', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Trạng thái người dùng', enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ description: 'Địa chỉ người dùng', required: false })
  address?: string;

  @ApiProperty({ description: 'Ngày sinh người dùng', required: false })
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Giới tính người dùng', required: false })
  gender?: string;

  @ApiProperty({
    description: 'Mã nhân viên (cho nhân viên/admin)',
    required: false,
  })
  employeeCode?: string;

  @ApiProperty({
    description: 'Ngày thuê (cho nhân viên/admin)',
    required: false,
  })
  hireDate?: Date;

  @ApiProperty({ description: 'Tài khoản được tạo vào' })
  createdAt: Date;

  @ApiProperty({ description: 'Tài khoản được cập nhật vào' })
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'ID người dùng' })
  id: number;

  @ApiProperty({ description: 'Email người dùng' })
  email: string;

  @ApiProperty({ description: 'Tên người dùng' })
  fullName: string;

  @ApiProperty({ description: 'Số điện thoại người dùng' })
  phone: string;

  @ApiProperty({ description: 'Vai trò người dùng' })
  role: UserRole;

  @ApiProperty({ description: 'Trạng thái người dùng' })
  status: UserStatus;

  @ApiProperty({ description: 'Địa chỉ người dùng' })
  address: string;

  @ApiProperty({ description: 'Ngày sinh người dùng' })
  dateOfBirth: Date;

  @ApiProperty({ description: 'Giới tính người dùng' })
  gender: string;

  @ApiProperty({ description: 'Mã nhân viên (cho nhân viên/admin)' })
  employeeCode: string;

  @ApiProperty({ description: 'Tài khoản được tạo vào' })
  createdAt: Date;
}
export class AuthResponseDto {
  @ApiProperty({ description: 'Access token' })
  access_token: string;

  @ApiProperty({ description: 'Thông tin người dùng' })
  user: LoginResponseDto;
}
