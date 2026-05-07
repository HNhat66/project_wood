import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomRequest } from '../entities/custom-request.entity';
import { Material } from '../entities/material.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import {
  AdminCustomRequestsController,
  CustomRequestsController,
} from './custom-requests.controller';
import { CustomRequestsService } from './custom-requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomRequest, Product, Material, User])],
  controllers: [CustomRequestsController, AdminCustomRequestsController],
  providers: [CustomRequestsService],
  exports: [CustomRequestsService],
})
export class CustomRequestsModule {}
