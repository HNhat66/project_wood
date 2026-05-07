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
import { PaginationResponseDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import {
  BulkInventoryAdjustmentDto,
  CreateProductDto,
  ProductDetailResponseDto,
  ProductQueryDto,
  ProductResponseDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo sản phẩm mới' })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm đã được tạo thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Tên sản phẩm đã tồn tại' })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: any,
  ) {
    return await this.productsService.create(createProductDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả sản phẩm với phân trang và lọc' })
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
    description: 'Tìm kiếm trong tên và mô tả',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: Number,
    description: 'Lọc theo ID danh mục',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Lọc theo trạng thái hoạt động',
  })
  @ApiQuery({
    name: 'withVariants',
    required: false,
    type: Boolean,
    description: 'Lọc theo có biến thể',
  })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được lấy thành công',
    type: PaginationResponseDto<ProductResponseDto>,
  })
  async findAll(@Query() queryDto: ProductQueryDto) {
    return await this.productsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy sản phẩm theo ID với chi tiết' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được lấy thành công',
    type: ProductDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Sản phẩm đã được cập nhật thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  @ApiResponse({ status: 409, description: 'Tên sản phẩm đã tồn tại' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/toggle-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chuyển đổi trạng thái hoạt động của sản phẩm' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID sản phẩm' })
  @ApiResponse({
    status: 200,
    description:
      'Trạng thái hoạt động của sản phẩm đã được chuyển đổi thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.toggleStatus(id);
  }

  @Post('bulk-inventory-adjustment')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Điều chỉnh tồn kho sản phẩm' })
  @ApiResponse({
    status: 201,
    description: 'Điều chỉnh tồn kho sản phẩm đã hoàn tất',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        updated: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductVariant' },
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sản phẩm không tồn tại' })
  @ApiResponse({ status: 400, description: 'Dữ liệu điều chỉnh không hợp lệ' })
  async bulkInventoryAdjustment(
    @Body() bulkAdjustmentDto: BulkInventoryAdjustmentDto,
    @Request() req: any,
  ) {
    return await this.productsService.bulkInventoryAdjustment(
      bulkAdjustmentDto,
      req.user.sub,
    );
  }
}
