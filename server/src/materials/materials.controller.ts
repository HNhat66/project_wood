import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
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
  CreateMaterialDto,
  MaterialResponseDto,
  UpdateMaterialDto,
} from './dto/material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo vật liệu mới' })
  @ApiResponse({
    status: 201,
    description: 'Vật liệu đã được tạo thành công',
    type: MaterialResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Tên vật liệu đã tồn tại' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả vật liệu' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Lọc theo trạng thái hoạt động',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên vật liệu',
  })
  @ApiResponse({
    status: 200,
    description: 'Vật liệu đã được lấy thành công',
    type: [MaterialResponseDto],
  })
  findAll(
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
    @Query('search') search?: string,
  ) {
    return this.materialsService.findAll(active, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy vật liệu theo ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID vật liệu' })
  @ApiResponse({
    status: 200,
    description: 'Vật liệu đã được lấy thành công',
    type: MaterialResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vật liệu không tồn tại' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật vật liệu' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID vật liệu' })
  @ApiResponse({
    status: 200,
    description: 'Vật liệu đã được cập nhật thành công',
    type: MaterialResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vật liệu không tồn tại' })
  @ApiResponse({ status: 409, description: 'Tên vật liệu đã tồn tại' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa vật liệu' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID vật liệu' })
  @ApiResponse({ status: 200, description: 'Vật liệu đã được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Vật liệu không tồn tại' })
  @ApiResponse({ status: 409, description: 'Vật liệu có sản phẩm liên quan' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.remove(id);
  }
}
