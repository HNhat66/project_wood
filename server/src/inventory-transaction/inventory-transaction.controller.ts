import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { GetInventoryTransactionsDto } from './dto/inventory-transaction.dto';
import { InventoryTransactionService } from './inventory-transaction.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('inventory-transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryTransactionController {
  constructor(
    private readonly inventoryTransactionService: InventoryTransactionService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll(@Query() query: GetInventoryTransactionsDto) {
    return this.inventoryTransactionService.findAll(query);
  }
}
