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

import { Material } from '../entities/material.entity';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';

@Injectable()
export class MaterialsService {
  private readonly CACHE_KEY = 'materials';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    const { name } = createMaterialDto;

    // Check if material name already exists
    const existingMaterial = await this.materialRepository.findOne({
      where: { name },
    });

    if (existingMaterial) {
      throw new ConflictException('Tên vật liệu đã tồn tại');
    }

    const material = this.materialRepository.create(createMaterialDto);
    const savedMaterial = await this.materialRepository.save(material);

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY);

    return savedMaterial;
  }

  async findAll(active?: boolean, search?: string): Promise<Material[]> {
    // Cache key includes active filter
    const cacheKey =
      active !== undefined
        ? `${this.CACHE_KEY}:active:${active}`
        : this.CACHE_KEY;

    // Try to get from cache first
    const cached = await this.cacheManager.get<Material[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query
    const query = this.materialRepository.createQueryBuilder('material');

    if (active !== undefined) {
      query.where('material.isActive = :active', { active });
    }

    if (search) {
      query.andWhere('material.name LIKE :search', { search: `%${search}%` });
    }

    query.orderBy('material.name', 'ASC');

    const materials = await query.getMany();

    // Cache the result
    await this.cacheManager.set(cacheKey, materials, this.CACHE_TTL);

    return materials;
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['productVariants'],
    });

    if (!material) {
      throw new NotFoundException('Vật liệu không tồn tại');
    }

    return material;
  }

  async update(
    id: number,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<Material> {
    const material = await this.findOne(id);

    // Check name uniqueness if name is being updated
    if (updateMaterialDto.name && updateMaterialDto.name !== material.name) {
      const existingMaterial = await this.materialRepository.findOne({
        where: { name: updateMaterialDto.name },
      });

      if (existingMaterial) {
        throw new ConflictException('Tên vật liệu đã tồn tại');
      }
    }

    Object.assign(material, updateMaterialDto);
    const updatedMaterial = await this.materialRepository.save(material);

    // Invalidate all material caches
    await this.cacheManager.del(this.CACHE_KEY);
    await this.cacheManager.del(`${this.CACHE_KEY}:active:true`);
    await this.cacheManager.del(`${this.CACHE_KEY}:active:false`);

    return updatedMaterial;
  }

  async remove(id: number): Promise<Material> {
    const material = await this.findOne(id);

    // Check if material has product variants
    if (material.productVariants && material.productVariants.length > 0) {
      throw new ConflictException(
        'Không thể xóa vật liệu có sản phẩm liên quan',
      );
    }

    await this.materialRepository.remove(material);

    // Invalidate all material caches
    await this.cacheManager.del(this.CACHE_KEY);
    await this.cacheManager.del(`${this.CACHE_KEY}:active:true`);
    await this.cacheManager.del(`${this.CACHE_KEY}:active:false`);
    return material;
  }
}
