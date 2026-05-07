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
import { CreateSizeDto, SizeResponseDto, UpdateSizeDto } from './dto/size.dto';
import { SizesService } from './sizes.service';

@ApiTags('Sizes')
@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo kích thước mới' })
  @ApiResponse({
    status: 201,
    description: 'Kích thước đã được tạo thành công',
    type: SizeResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Tên kích thước đã tồn tại' })
  create(@Body() createSizeDto: CreateSizeDto) {
    return this.sizesService.create(createSizeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả kích thước' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Lọc theo trạng thái hoạt động',
  })
  @ApiResponse({
    status: 200,
    description: 'Kích thước đã được lấy thành công',
    type: [SizeResponseDto],
  })
  findAll(
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ) {
    return this.sizesService.findAll(active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy kích thước theo ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID kích thước' })
  @ApiResponse({
    status: 200,
    description: 'Kích thước đã được lấy thành công',
    type: SizeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Kích thước không tồn tại' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sizesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật kích thước' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID kích thước' })
  @ApiResponse({
    status: 200,
    description: 'Kích thước đã được cập nhật thành công',
    type: SizeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Kích thước không tồn tại' })
  @ApiResponse({ status: 409, description: 'Tên kích thước đã tồn tại' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSizeDto: UpdateSizeDto,
  ) {
    return this.sizesService.update(id, updateSizeDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa kích thước' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID kích thước' })
  @ApiResponse({
    status: 200,
    description: 'Kích thước đã được xóa thành công',
  })
  @ApiResponse({ status: 404, description: 'Kích thước không tồn tại' })
  @ApiResponse({
    status: 409,
    description: 'Kích thước có liên kết với biến thể sản phẩm',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sizesService.remove(id);
  }
}
