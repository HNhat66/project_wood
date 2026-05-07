import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AddressesModule } from './addresses/addresses.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerModule } from './common/logger/logger.module';
import { getDatabaseConfig } from './config/database.config';
import { getRedisConfig } from './config/redis.config';
import { CustomRequestsModule } from './custom-requests/custom-requests.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryTransactionModule } from './inventory-transaction/inventory-transaction.module';
import { MaterialsModule } from './materials/materials.module';
import { OrderTrackingLogsModule } from './order-tracking-logs/order-tracking-logs.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentQRModule } from './payment-qr/payment-qr.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { ProductsModule } from './products/products.module';
import { SizesModule } from './sizes/sizes.module';
import { UsersModule } from './users/user.module';
import { VnpayModule } from './vnpay/vnpay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getRedisConfig,
      inject: [ConfigService],
      isGlobal: true,
    }),
    LoggerModule,
    AuthModule,
    AddressesModule,
    CategoriesModule,
    MaterialsModule,
    SizesModule,
    ProductsModule,
    ProductVariantsModule,
    CustomersModule,
    CartModule,
    OrdersModule,
    OrderTrackingLogsModule,
    CustomRequestsModule,
    PaymentQRModule,
    DashboardModule,
    InventoryTransactionModule,
    UsersModule,
    VnpayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
