import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InventoryTransaction } from '../entities/inventory-transaction.entity';
import { GetInventoryTransactionsDto } from './dto/inventory-transaction.dto';

@Injectable()
export class InventoryTransactionService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private readonly inventoryTransactionRepository: Repository<InventoryTransaction>,
  ) {}

  async findAll(query: GetInventoryTransactionsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      transactionType,
      productVariantId,
      referenceType,
      performedById,
    } = query;

    const queryBuilder = this.inventoryTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.productVariant', 'productVariant')
      .leftJoinAndSelect('productVariant.product', 'product')
      .leftJoinAndSelect('productVariant.material', 'material')
      .leftJoinAndSelect('productVariant.size', 'size')
      .leftJoinAndSelect('transaction.performedBy', 'performedBy');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR transaction.reason LIKE :search OR transaction.notes LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (transactionType) {
      queryBuilder.andWhere('transaction.transactionType = :transactionType', {
        transactionType,
      });
    }

    if (productVariantId) {
      queryBuilder.andWhere(
        'transaction.productVariantId = :productVariantId',
        {
          productVariantId,
        },
      );
    }

    if (referenceType) {
      queryBuilder.andWhere('transaction.referenceType = :referenceType', {
        referenceType,
      });
    }

    if (performedById) {
      queryBuilder.andWhere('transaction.performedById = :performedById', {
        performedById,
      });
    }

    // Order by transaction date descending
    queryBuilder.orderBy('transaction.transactionDate', 'DESC');

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      data: transactions.map((transaction) => ({
        ...transaction,
        performedBy: {
          id: transaction.performedBy.id,
          fullName: transaction.performedBy.fullName,
          email: transaction.performedBy.email,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }
}
