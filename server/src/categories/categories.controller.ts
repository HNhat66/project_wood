import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { UserRole } from '../entities/user.entity';
import { CategoriesService } from './categories.service';
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo danh mục mới' })
  @ApiResponse({
    status: 201,
    description: 'Đã tạo danh mục',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
  @ApiResponse({ status: 404, description: 'Danh mục cha không tồn tại' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả danh mục với cấu trúc phân cấp' })
  @ApiResponse({
    status: 200,
    description: 'Đã lấy danh mục',
    type: [CategoryResponseDto],
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy danh mục bằng ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Đã lấy danh mục',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Đã cập nhật danh mục',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID danh mục' })
  @ApiResponse({ status: 200, description: 'Đã xóa danh mục' })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  @ApiResponse({ status: 409, description: 'Danh mục có con hoặc sản phẩm' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
