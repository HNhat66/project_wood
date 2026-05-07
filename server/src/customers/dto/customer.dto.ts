import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { CustomerType } from '../../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn An',
  })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({
    description:
      'Số điện thoại khách hàng (sẽ được sử dụng để tạo mã khách hàng)',
    example: '0901234567',
  })
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    description: 'Email khách hàng',
    example: 'nguyenvanan@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Địa chỉ khách hàng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Giới tính khách hàng',
    enum: ['male', 'female', 'other'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @ApiProperty({
    description: 'Loại khách hàng',
    enum: CustomerType,
    default: CustomerType.RETAIL,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiProperty({
    description: 'Ghi chú thêm',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Tạo bởi nhân viên',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  createdById?: number;
}

export class UpdateCustomerDto {
  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn An',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    example: '0901234567',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @ApiProperty({
    description: 'Email khách hàng',
    example: 'nguyenvanan@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Địa chỉ khách hàng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CustomerQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên, số điện thoại, email',
    example: 'Nguyễn',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo loại khách hàng',
    enum: CustomerType,
    example: CustomerType.RETAIL,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường',
    example: 'totalSpent',
    enum: ['totalSpent', 'createdAt', 'fullName'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class CustomerResponseDto {
  @ApiProperty({ description: 'ID khách hàng' })
  id: number;

  @ApiProperty({ description: 'Mã khách hàng tự động (MKH + số điện thoại)' })
  customerCode: string;

  @ApiProperty({ description: 'Tên khách hàng' })
  fullName: string;

  @ApiProperty({ description: 'Số điện thoại khách hàng' })
  phone: string;

  @ApiProperty({ description: 'Email khách hàng', required: false })
  email?: string;

  @ApiProperty({ description: 'Địa chỉ khách hàng', required: false })
  address?: string;

  @ApiProperty({ description: 'Ghi chú thêm', required: false })
  notes?: string;

  @ApiProperty({ description: 'Tạo bởi nhân viên' })
  createdBy: {
    id: number;
    fullName: string;
    email: string;
  };

  @ApiProperty({ description: 'Tạo lúc' })
  createdAt: Date;

  @ApiProperty({ description: 'Cập nhật lúc' })
  updatedAt: Date;

  @ApiProperty({ description: 'Ngày đặt hàng cuối cùng', required: false })
  lastOrderDate?: Date;

  @ApiProperty({ description: 'Tổng đơn hàng', required: false })
  totalOrders?: number;

  @ApiProperty({ description: 'Tổng tiền', required: false })
  totalSpent?: number;
}

export class CustomerListResponseDto {
  @ApiProperty({
    description: 'Danh sách khách hàng',
    type: [CustomerResponseDto],
  })
  data: CustomerResponseDto[];

  @ApiProperty({ description: 'Tổng số' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Số lượng trên mỗi trang' })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
}

export class CustomerDetailResponseDto extends CustomerResponseDto {
  @ApiProperty()
  orders?: {
    id: number;
    orderNumber: string;
    orderDate: Date;
    finalAmount: number;
    orderStatus: string;
  }[];

  @ApiProperty()
  customOrders?: {
    id: number;
    estimatedPrice: number;
    status: string;
    createdAt: Date;
  }[];
}
