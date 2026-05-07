import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  CheckoutFromCartDto,
  GroupedCartResponseDto,
  RemoveFromCartDto,
  UpdateCartVariantDto,
} from './dto/cart.dto';

@ApiTags('Cart (Online Users)')
@Controller('cart')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.USER)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng [Người dùng online]' })
  @ApiResponse({
    status: 201,
    description: 'Đã thêm sản phẩm vào giỏ hàng',
    type: GroupedCartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Phiên bản sản phẩm không tồn tại' })
  @ApiResponse({ status: 400, description: 'Không đủ tồn kho' })
  addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
    return this.cartService.addToCart(addToCartDto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy giỏ hàng của tôi (định dạng nhóm) [Người dùng online]',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã lấy giỏ hàng',
    type: GroupedCartResponseDto,
  })
  getMyCart(@Request() req) {
    return this.cartService.getCartByUser(req.user.sub);
  }

  @Get('my-cart')
  @ApiOperation({
    summary: 'Lấy giỏ hàng của tôi (định dạng cũ) [Người dùng online]',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã lấy giỏ hàng',
    type: GroupedCartResponseDto,
  })
  getMyCartLegacy(@Request() req) {
    return this.cartService.getCartByUser(req.user.sub);
  }

  @Patch('update')
  @ApiOperation({
    summary:
      'Cập nhật số lượng sản phẩm trong giỏ hàng bằng ID phiên bản sản phẩm [Người dùng online]',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã cập nhật số lượng sản phẩm trong giỏ hàng',
    type: GroupedCartResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Phiên bản sản phẩm không tồn tại trong giỏ hàng',
  })
  @ApiResponse({ status: 400, description: 'Không đủ tồn kho' })
  updateCartItem(
    @Body() updateCartVariantDto: UpdateCartVariantDto,
    @Request() req,
  ) {
    return this.cartService.updateCartItem(updateCartVariantDto, req.user.sub);
  }

  @Delete('remove')
  @ApiOperation({
    summary: 'Xóa phiên bản sản phẩm khỏi giỏ hàng [Người dùng online]',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa sản phẩm khỏi giỏ hàng',
    type: GroupedCartResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Phiên bản sản phẩm không tồn tại trong giỏ hàng',
  })
  removeFromCart(@Body() removeFromCartDto: RemoveFromCartDto, @Request() req) {
    return this.cartService.removeFromCart(removeFromCartDto, req.user.sub);
  }

  @Delete('clear')
  @ApiOperation({
    summary: 'Xóa tất cả sản phẩm khỏi giỏ hàng [Người dùng online]',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng',
  })
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.sub);
  }

  @Post('checkout')
  @ApiOperation({
    summary:
      'Thanh toán giỏ hàng và tạo đơn hàng trực tuyến [Người dùng online]',
  })
  @ApiResponse({
    status: 201,
    description: 'Đã tạo đơn hàng từ giỏ hàng',
  })
  @ApiResponse({
    status: 400,
    description:
      'Giỏ hàng trống, không đủ tồn kho, hoặc số tiền đặt cọc không hợp lệ',
  })
  checkoutFromCart(@Body() checkoutDto: CheckoutFromCartDto, @Request() req) {
    console.log('checkoutDto', checkoutDto);
    return this.cartService.checkoutFromCart(checkoutDto, req.user.sub);
  }

  @Delete('items/:cartItemId')
  @ApiOperation({
    summary:
      'Xóa sản phẩm khỏi giỏ hàng bằng ID sản phẩm trong giỏ hàng (định dạng cũ) [Người dùng online]',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa sản phẩm khỏi giỏ hàng',
    type: GroupedCartResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sản phẩm trong giỏ hàng không tồn tại',
  })
  @ApiResponse({ status: 400, description: 'Không có quyền xóa sản phẩm này' })
  removeCartItemById(
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
    @Request() req,
  ) {
    return this.cartService.removeCartItemById(cartItemId, req.user.sub);
  }
}
