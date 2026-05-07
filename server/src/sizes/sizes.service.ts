import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Size } from '../entities/size.entity';
import { CreateSizeDto, UpdateSizeDto } from './dto/size.dto';

@Injectable()
export class SizesService {
  private readonly CACHE_KEY = 'sizes';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createSizeDto: CreateSizeDto): Promise<Size> {
    const { name } = createSizeDto;

    // Check if size name already exists
    const existingSize = await this.sizeRepository.findOne({
      where: { name },
    });

    if (existingSize) {
      throw new ConflictException('Tên kích thước đã tồn tại');
    }

    const size = this.sizeRepository.create(createSizeDto);
    const savedSize = await this.sizeRepository.save(size);

    // Invalidate cache
    await this.invalidateCache();

    return savedSize;
  }

  async findAll(active?: boolean): Promise<Size[]> {
    // Build cache key with filters
    let cacheKey = this.CACHE_KEY;
    if (active !== undefined) {
      cacheKey += `:active:${active}`;
    }

    // Try to get from cache first
    const cached = await this.cacheManager.get<Size[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query
    const query = this.sizeRepository.createQueryBuilder('size');

    if (active !== undefined) {
      query.andWhere('size.isActive = :active', { active });
    }

    query.orderBy('size.name', 'ASC');

    const sizes = await query.getMany();

    // Cache the result
    await this.cacheManager.set(cacheKey, sizes, this.CACHE_TTL);

    return sizes;
  }

  async findOne(id: number): Promise<Size> {
    const size = await this.sizeRepository.findOne({
      where: { id },
      relations: ['productVariants'],
    });

    if (!size) {
      throw new NotFoundException('Kích thước không tồn tại');
    }

    return size;
  }

  async update(id: number, updateSizeDto: UpdateSizeDto): Promise<Size> {
    const size = await this.findOne(id);

    // Check name uniqueness if name is being updated
    if (updateSizeDto.name && updateSizeDto.name !== size.name) {
      const existingSize = await this.sizeRepository.findOne({
        where: { name: updateSizeDto.name },
      });

      if (existingSize) {
        throw new ConflictException('Tên kích thước đã tồn tại');
      }
    }

    Object.assign(size, updateSizeDto);
    const updatedSize = await this.sizeRepository.save(size);

    // Invalidate cache
    await this.invalidateCache();

    return updatedSize;
  }

  async remove(id: number): Promise<Size> {
    const size = await this.findOne(id);

    // Check if size has product variants
    if (size.productVariants && size.productVariants.length > 0) {
      throw new ConflictException(
        'Không thể xóa kích thước có liên kết với biến thể sản phẩm',
      );
    }

    await this.sizeRepository.remove(size);

    // Invalidate cache
    await this.invalidateCache();

    return size;
  }

  private async invalidateCache(): Promise<void> {
    // Clear all size-related cache keys
    const keys = [
      this.CACHE_KEY,
      `${this.CACHE_KEY}:active:true`,
      `${this.CACHE_KEY}:active:false`,
    ];

    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }
}
