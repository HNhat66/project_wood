import { Cache } from 'cache-manager';
import {
  InventoryTransaction,
  ReferenceType,
  TransactionType,
} from 'src/entities/inventory-transaction.entity';
import { ProductVariant } from 'src/entities/product-variant.entity';
import { DataSource, Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationResponseDto } from '../common/dto/pagination.dto';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import {
  BulkInventoryAdjustmentDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  private readonly CACHE_KEY = 'products';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private dataSource: DataSource,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    performedById: number,
  ): Promise<Product> {
    return await this.dataSource.transaction(async (manager) => {
      const { name, categoryId, variants } = createProductDto;

      // Check if product name already exists
      const existingProduct = await manager.findOne(Product, {
        where: { name },
      });

      if (existingProduct) {
        throw new ConflictException('Tên sản phẩm đã tồn tại');
      }

      // Validate category exists
      const category = await manager.findOne(Category, {
        where: { id: categoryId, isActive: true },
      });

      if (!category) {
        throw new NotFoundException(
          'Danh mục không tồn tại hoặc không hoạt động',
        );
      }

      const product = manager.create(Product, createProductDto);
      const savedProduct = await manager.save(product);
      const savedVariants = await manager.save(
        ProductVariant,
        variants.map((variant) => ({
          productId: savedProduct.id,
          sku: variant.sku,
          materialId: variant.materialId,
          sizeId: variant.sizeId,
          stockQuantity: variant.stockQuantity,
          price: variant.price,
          minStockLevel: variant.minStockLevel,
        })),
      );
      const inventoryTransactions = manager.create(
        InventoryTransaction,
        savedVariants.map((variant) => ({
          productVariantId: variant.id,
          transactionType: TransactionType.IN,
          performedById,
          referenceType: ReferenceType.ADJUSTMENT,
          referenceId: savedProduct.id,
          quantity: variant.stockQuantity,
          transactionDate: new Date(),
          notes: 'Điều chỉnh tồn kho ban đầu cho sản phẩm',
          reason: 'Điều chỉnh tồn kho ban đầu cho sản phẩm',
        })),
      );
      await manager.save(inventoryTransactions);

      await this.invalidateAllProductCache();

      return savedProduct;
    });
  }

  async findAll(
    queryDto: ProductQueryDto,
  ): Promise<PaginationResponseDto<Product>> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      active,
      withVariants,
      stock,
      sortBy,
      sortOrder,
    } = queryDto;
    await this.invalidateAllProductCache();
    // Build cache key with all parameters
    const cacheKey = this.buildCacheKey('list', {
      page,
      limit,
      search,
      category,
      active,
      withVariants,
      stock,
      sortBy,
      sortOrder,
    });

    // Try to get from cache first
    const cached =
      await this.cacheManager.get<PaginationResponseDto<Product>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .loadRelationCountAndMap('product.variantCount', 'product.variants');
    if (active !== undefined) {
      // Handle boolean values properly
      query.andWhere('product.isActive = :active', {
        active: active === 'true',
      });
    }
    // Apply filters
    if (search) {
      query.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      // get all categories that have parentId = category
      const categories = await this.categoryRepository.find({
        where: { parentId: category },
      });
      const categoryIds = categories.map((cat) => cat.id);

      // Include the parent category itself AND its children
      const allCategoryIds = [category, ...categoryIds];
      query.andWhere('product.categoryId IN (:...allCategoryIds)', {
        allCategoryIds,
      });
    }

    if (stock && ['in_stock', 'out_of_stock', 'low_stock'].includes(stock)) {
      query.leftJoinAndSelect('product.variants', 'variants');
      if (stock === 'in_stock') {
        query.andWhere('variants.stockQuantity > 0');
      } else if (stock === 'out_of_stock') {
        query.andWhere('variants.stockQuantity = 0');
      } else if (stock === 'low_stock') {
        query.andWhere('variants.stockQuantity < variants.minStockLevel');
      }
    } else if (withVariants) {
      query.leftJoinAndSelect('product.variants', 'variants');
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    // Order by name
    if (sortBy) {
      query.orderBy(`product.${sortBy}`, sortOrder === 'asc' ? 'ASC' : 'DESC');
    }

    // Get results
    const [products, total] = await query.getManyAndCount();

    const result = new PaginationResponseDto(products, total, page, limit);

    // Cache the result with shorter TTL to handle frequent updates
    await this.cacheManager.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  async findOne(id: number): Promise<Product> {
    const cacheKey = this.buildCacheKey('detail', { id });

    // Try cache first
    const cached = await this.cacheManager.get<Product>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'variants', 'variants.material', 'variants.size'],
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Cache single product
    await this.cacheManager.set(cacheKey, product, this.CACHE_TTL);

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        relations: [
          'category',
          'variants',
          'variants.material',
          'variants.size',
        ],
      });

      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      // Validate category if being updated
      if (updateProductDto.categoryId) {
        const category = await manager.findOne(Category, {
          where: { id: updateProductDto.categoryId, isActive: true },
        });

        if (!category) {
          throw new NotFoundException(
            'Danh mục không tồn tại hoặc không hoạt động',
          );
        }
      }

      // Update product basic info
      const { variants: newVariants, ...productData } = updateProductDto;
      Object.assign(product, productData);
      const updatedProduct = await manager.save(product);

      // Handle variants if provided
      if (newVariants && Array.isArray(newVariants)) {
        const existingVariants = product.variants || [];

        // Create a map of existing variants by material-size combination
        const existingVariantMap = new Map();
        existingVariants.forEach((variant) => {
          const key = `${variant.materialId}-${variant.sizeId}`;
          existingVariantMap.set(key, variant);
        });

        // Process new variants
        for (const variantData of newVariants) {
          const key = `${variantData.materialId}-${variantData.sizeId}`;
          const existingVariant = existingVariantMap.get(key);

          if (existingVariant) {
            // Update existing variant (only price)
            existingVariant.price = variantData.price;
            await manager.save(ProductVariant, existingVariant);
          } else {
            // Create new variant
            const newVariant = manager.create(ProductVariant, {
              productId: updatedProduct.id,
              materialId: variantData.materialId,
              sizeId: variantData.sizeId,
              price: variantData.price,
              stockQuantity: variantData.stockQuantity || 0,
              minStockLevel: variantData.minStockLevel || 0,
              sku:
                variantData.sku ||
                `${updatedProduct.name}-${variantData.materialId}-${variantData.sizeId}`,
            });
            await manager.save(ProductVariant, newVariant);
          }
        }
      }

      // Invalidate cache AFTER successful transaction
      await this.invalidateAllProductCache();

      return updatedProduct;
    });
  }

  async toggleStatus(id: number): Promise<Product> {
    return await this.dataSource.transaction(async (manager) => {
      // Use FOR UPDATE lock to prevent concurrent modifications
      const product = await manager
        .createQueryBuilder(Product, 'product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('variants.material', 'material')
        .leftJoinAndSelect('variants.size', 'size')
        .where('product.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      const oldStatus = product.isActive;
      product.isActive = !product.isActive;

      const updatedProduct = await manager.save(product);

      // Invalidate cache AFTER successful transaction but BEFORE transaction commits
      await this.invalidateAllProductCache();

      return updatedProduct;
    });
  }

  async bulkInventoryAdjustment(
    bulkAdjustmentDto: BulkInventoryAdjustmentDto,
    performedById: number,
  ): Promise<{
    success: boolean;
    updated: ProductVariant[];
    errors: string[];
  }> {
    const { productId, adjustments, globalReason, notes } = bulkAdjustmentDto;

    return await this.dataSource.transaction(async (manager) => {
      // Verify product exists
      const product = await manager.findOne(Product, {
        where: { id: productId },
        relations: ['variants'],
      });

      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      const updatedVariants: ProductVariant[] = [];
      const errors: string[] = [];

      // Process each adjustment
      for (const adjustment of adjustments) {
        try {
          // Find the variant
          const variant = await manager.findOne(ProductVariant, {
            where: { id: adjustment.productVariantId, productId },
          });

          if (!variant) {
            errors.push(
              `Biến thể sản phẩm ${adjustment.productVariantId} không tồn tại cho sản phẩm này`,
            );
            continue;
          }

          // Check if adjustment would result in negative stock
          const newStockQuantity = variant.stockQuantity + adjustment.quantity;
          if (newStockQuantity < 0) {
            errors.push(
              `Biến thể ${variant.sku}: Không thể điều chỉnh tồn kho bằng ${adjustment.quantity}. Sẽ dẫn đến số lượng âm (${newStockQuantity})`,
            );
            continue;
          }

          // Update stock quantity
          variant.stockQuantity = newStockQuantity;
          const savedVariant = await manager.save(ProductVariant, variant);
          updatedVariants.push(savedVariant);

          // Use individual reason if provided, otherwise use global reason
          const finalReason = adjustment.reason?.trim() || globalReason;

          // Create inventory transaction
          const inventoryTransaction = manager.create(InventoryTransaction, {
            productVariantId: variant.id,
            transactionType:
              adjustment.quantity > 0
                ? TransactionType.IN
                : TransactionType.OUT,
            quantity: Math.abs(adjustment.quantity),
            reason: finalReason,
            notes,
            referenceType: ReferenceType.ADJUSTMENT,
            referenceId: productId,
            performedById,
            transactionDate: new Date(),
          });
          await manager.save(InventoryTransaction, inventoryTransaction);
        } catch (error) {
          errors.push(
            `Variant ${adjustment.productVariantId}: ${error.message}`,
          );
        }
      }

      // Invalidate cache
      await this.invalidateAllProductCache();

      return {
        success: errors.length === 0,
        updated: updatedVariants,
        errors,
      };
    });
  }

  private buildCacheKey(type: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key] ?? ''}`)
      .join('|');

    return `${this.CACHE_KEY}:${type}:${sortedParams}`;
  }

  private async invalidateAllProductCache(): Promise<void> {
    try {
      // Get all cache keys (this depends on your cache implementation)
      // For Redis, you could use KEYS pattern
      const store = (this.cacheManager as any).store;

      if (store && typeof store.keys === 'function') {
        // Redis store
        const keys = await store.keys(`${this.CACHE_KEY}:*`);

        if (keys.length > 0) {
          await Promise.all(
            keys.map((key: string) => this.cacheManager.del(key)),
          );
        }
      } else {
        // Memory store fallback - manual pattern clearing
        const keysToDelete: string[] = [];

        // Generate possible cache keys
        for (let page = 1; page <= 50; page++) {
          for (let limit of [5, 10, 20, 50, 100]) {
            for (let active of [undefined, true, false]) {
              for (let category of [undefined, 1, 2, 3, 4, 5]) {
                for (let search of [undefined, '']) {
                  const params = { page, limit, search, category, active };
                  keysToDelete.push(this.buildCacheKey('list', params));
                }
              }
            }
          }
        }

        // Also invalidate detail cache keys
        for (let id = 1; id <= 1000; id++) {
          keysToDelete.push(this.buildCacheKey('detail', { id }));
        }

        await Promise.all(
          keysToDelete.map((key) => this.cacheManager.del(key)),
        );
      }
    } catch (error) {
      console.error('[CACHE] Lỗi khi xóa cache:', error);
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }
}
