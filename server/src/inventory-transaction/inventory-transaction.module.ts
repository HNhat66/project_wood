import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryTransaction } from '../entities/inventory-transaction.entity';
import { InventoryTransactionController } from './inventory-transaction.controller';
import { InventoryTransactionService } from './inventory-transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction])],
  controllers: [InventoryTransactionController],
  providers: [InventoryTransactionService],
  exports: [InventoryTransactionService],
})
export class InventoryTransactionModule {}
