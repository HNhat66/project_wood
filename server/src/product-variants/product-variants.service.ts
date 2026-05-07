import { Cache } from 'cache-manager';
import { DataSource, Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  InventoryTransaction,
  ReferenceType,
  TransactionType,
} from '../entities/inventory-transaction.entity';
import { Material } from '../entities/material.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Product } from '../entities/product.entity';
import { Size } from '../entities/size.entity';
import {
  ProductVariantQueryDto,
  StockAdjustmentDto,
} from './dto/product-variant.dto';

@Injectable()
export class ProductVariantsService {
  private readonly CACHE_KEY = 'product-variants';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
    @InjectRepository(InventoryTransaction)
    private inventoryTransactionRepository: Repository<InventoryTransaction>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private dataSource: DataSource,
  ) {}

  async findAll(queryDto: ProductVariantQueryDto): Promise<ProductVariant[]> {
    const { search, productId, materialId, sizeId, lowStock } = queryDto;

    // Build cache key
    const cacheKey = `${this.CACHE_KEY}:list:${search || ''}:${productId || ''}:${materialId || ''}:${sizeId || ''}:${lowStock ?? ''}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<ProductVariant[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query
    const query = this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.material', 'material')
      .leftJoinAndSelect('variant.size', 'size');

    // Apply filters
    if (search) {
      query.andWhere('variant.sku LIKE :search', { search: `%${search}%` });
    }

    if (productId) {
      query.andWhere('variant.productId = :productId', { productId });
    }

    if (materialId) {
      query.andWhere('variant.materialId = :materialId', { materialId });
    }

    if (sizeId) {
      query.andWhere('variant.sizeId = :sizeId', { sizeId });
    }

    if (lowStock === true) {
      query.andWhere('variant.stockQuantity <= variant.minStockLevel');
    }

    // Order by SKU
    query.orderBy('variant.sku', 'ASC');

    // Get results
    const variants = await query.getMany();

    const result = variants;

    // Cache the result
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: number): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findOne({
      where: { id },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  async adjustStock(
    id: number,
    stockAdjustmentDto: StockAdjustmentDto,
    userId: number,
  ): Promise<ProductVariant> {
    const { quantity, reason, notes } = stockAdjustmentDto;
    const variant = await this.findOne(id);

    // Check if adjustment would result in negative stock
    const newStockQuantity = variant.stockQuantity + quantity;
    if (newStockQuantity < 0) {
      throw new BadRequestException(
        `Cannot adjust stock: would result in negative quantity (${newStockQuantity})`,
      );
    }

    // Start transaction
    return await this.dataSource.transaction(async (manager) => {
      // Update stock quantity
      variant.stockQuantity = newStockQuantity;
      const updatedVariant = await manager.save(ProductVariant, variant);

      // Create inventory transaction
      const inventoryTransaction = manager.create(InventoryTransaction, {
        productVariantId: id,
        transactionType:
          quantity > 0 ? TransactionType.IN : TransactionType.OUT,
        quantity: Math.abs(quantity),
        reason,
        notes,
        referenceType: ReferenceType.ADJUSTMENT,
        performedById: userId,
        transactionDate: new Date(),
      });
      await manager.save(InventoryTransaction, inventoryTransaction);

      return updatedVariant;
    });
  }

  async toggleAvailability(id: number): Promise<ProductVariant> {
    const variant = await this.findOne(id);
    variant.isAvailable = !variant.isAvailable;

    const updatedVariant = await this.productVariantRepository.save(variant);

    // Invalidate cache
    await this.invalidateCache();

    return updatedVariant;
  }

  async remove(id: number): Promise<void> {
    const variant = await this.findOne(id);

    // Check if variant has order items
    if (variant.standardOrderItems && variant.standardOrderItems.length > 0) {
      throw new ConflictException(
        'Cannot delete product variant with order history',
      );
    }

    await this.productVariantRepository.remove(variant);

    // Invalidate cache
    await this.invalidateCache();
  }

  async getLowStockVariants(threshold?: number): Promise<ProductVariant[]> {
    const query = this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('variant.material', 'material')
      .leftJoinAndSelect('variant.size', 'size')
      .where('variant.isAvailable = true')
      .andWhere('product.isActive = true');

    if (threshold) {
      query.andWhere('variant.stockQuantity <= :threshold', { threshold });
    } else {
      query.andWhere('variant.stockQuantity <= variant.minStockLevel');
    }

    query.orderBy('variant.stockQuantity', 'ASC');

    return await query.getMany();
  }

  async getInventoryHistory(
    id: number,
    limit: number = 50,
  ): Promise<InventoryTransaction[]> {
    return await this.inventoryTransactionRepository.find({
      where: { productVariantId: id },
      relations: ['performedBy'],
      order: { transactionDate: 'DESC' },
      take: limit,
    });
  }

  private async validateRelatedEntities(
    productId: number,
    materialId: number,
    sizeId: number,
  ): Promise<void> {
    // Validate product exists and is active
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Validate material exists and is active
    const material = await this.materialRepository.findOne({
      where: { id: materialId, isActive: true },
    });

    if (!material) {
      throw new NotFoundException('Material not found or inactive');
    }

    // Validate size exists and is active
    const size = await this.sizeRepository.findOne({
      where: { id: sizeId, isActive: true },
    });

    if (!size) {
      throw new NotFoundException('Size not found or inactive');
    }
  }

  private async invalidateCache(): Promise<void> {
    // Clear all product variant-related cache keys
    const keys = [this.CACHE_KEY];

    // Clear specific cache patterns (simplified approach)
    for (let page = 1; page <= 10; page++) {
      for (let limit of [10, 20, 50]) {
        keys.push(`${this.CACHE_KEY}:list:${page}:${limit}:::::::`);
        keys.push(`${this.CACHE_KEY}:list:${page}:${limit}:::::true:`);
        keys.push(`${this.CACHE_KEY}:list:${page}:${limit}:::::false:`);
        keys.push(`${this.CACHE_KEY}:list:${page}:${limit}::::::true`);
        keys.push(`${this.CACHE_KEY}:list:${page}:${limit}::::::false`);
      }
    }

    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }
}
