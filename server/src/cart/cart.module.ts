import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartItem } from '../entities/cart-item.entity';
import { Cart } from '../entities/cart.entity';
import { Order } from '../entities/order.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { User } from '../entities/user.entity';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, User, ProductVariant, Order]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
