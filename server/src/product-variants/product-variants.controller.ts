import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  ProductVariantQueryDto,
  ProductVariantResponseDto,
  StockAdjustmentDto,
} from './dto/product-variant.dto';
import { ProductVariantsService } from './product-variants.service';

@ApiTags('Product Variants')
@Controller('product-variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all product variants with pagination and filters',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in SKU',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: Number,
    description: 'Filter by product ID',
  })
  @ApiQuery({
    name: 'materialId',
    required: false,
    type: Number,
    description: 'Filter by material ID',
  })
  @ApiQuery({
    name: 'sizeId',
    required: false,
    type: Number,
    description: 'Filter by size ID',
  })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    type: Boolean,
    description: 'Filter by low stock variants',
  })
  @ApiResponse({
    status: 200,
    description: 'Product variants retrieved successfully',
    type: PaginationResponseDto<ProductVariantResponseDto>,
  })
  findAll(@Query() queryDto: ProductVariantQueryDto) {
    return this.productVariantsService.findAll(queryDto);
  }

  @Get('low-stock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get low stock variants' })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    description: 'Custom stock threshold (defaults to min stock level)',
  })
  @ApiResponse({
    status: 200,
    description: 'Low stock variants retrieved successfully',
    type: [ProductVariantResponseDto],
  })
  getLowStockVariants(@Query('threshold') threshold?: number) {
    return this.productVariantsService.getLowStockVariants(threshold);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product variant by ID with full details' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Product variant retrieved successfully',
    type: ProductVariantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product variant not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productVariantsService.findOne(id);
  }

  @Get(':id/inventory-history')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inventory transaction history for a variant' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product variant ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to retrieve',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product variant not found' })
  getInventoryHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.productVariantsService.getInventoryHistory(id, limit);
  }

  @Patch(':id/adjust-stock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust stock quantity for a product variant' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully',
    type: ProductVariantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product variant not found' })
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() stockAdjustmentDto: StockAdjustmentDto,
    @Request() req,
  ) {
    return this.productVariantsService.adjustStock(
      id,
      stockAdjustmentDto,
      req.user.sub,
    );
  }

  @Patch(':id/toggle-availability')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle variant availability' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Variant availability toggled successfully',
    type: ProductVariantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product variant not found' })
  toggleAvailability(@Param('id', ParseIntPipe) id: number) {
    return this.productVariantsService.toggleAvailability(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product variant' })
  @ApiParam({ name: 'id', type: 'number', description: 'Product variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Product variant deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Product variant not found' })
  @ApiResponse({ status: 409, description: 'Product variant has order items' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productVariantsService.remove(id);
  }
}
