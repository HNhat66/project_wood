import { InventoryTransaction } from 'src/entities/inventory-transaction.entity';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomOrderItem } from '../entities/custom-order-item.entity';
import { CustomRequest } from '../entities/custom-request.entity';
import { Customer } from '../entities/customer.entity';
import { Material } from '../entities/material.entity';
import { Order } from '../entities/order.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Product } from '../entities/product.entity';
import { StandardOrderItem } from '../entities/standard-order-item.entity';
import { User } from '../entities/user.entity';
import {
  AdminOrdersController,
  GuestOrdersController,
  OrdersController,
} from './orders.controller';
import { OrdersService } from './orders.service';
import { VnpayModule } from 'src/vnpay/vnpay.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      StandardOrderItem,
      CustomOrderItem,
      ProductVariant,
      Product,
      Material,
      CustomRequest,
      User,
      Customer,
      InventoryTransaction,
    ]),
  ],
  controllers: [OrdersController, AdminOrdersController, GuestOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
