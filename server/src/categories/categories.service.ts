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

import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private readonly CACHE_KEY = 'categories';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, parentId } = createCategoryDto;

    // Check if category name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name },
    });

    if (existingCategory) {
      throw new ConflictException('Tên danh mục đã tồn tại');
    }

    // Validate parent category exists if provided
    if (parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    const savedCategory = await this.categoryRepository.save(category);

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY);

    return savedCategory;
  }

  async findAll(): Promise<Category[]> {
    // Try to get from cache first
    const cached = await this.cacheManager.get<Category[]>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Get from database with hierarchical structure
    const categories = await this.categoryRepository.find({
      relations: ['children', 'parent'],
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    // Build tree structure
    const rootCategories = categories.filter((cat) => !cat.parentId);
    const result = this.buildCategoryTree(rootCategories, categories);

    // Cache the result
    await this.cacheManager.set(this.CACHE_KEY, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children', 'parent', 'products'],
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Check name uniqueness if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('Tên danh mục đã tồn tại');
      }
    }

    // Validate parent category if being updated
    if (updateCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }

      // Prevent circular reference
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Danh mục không thể là cha của chính nó');
      }
    }

    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.save(category);

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY);

    return updatedCategory;
  }

  async remove(id: number): Promise<Category> {
    const category = await this.findOne(id);

    // Check if category has children
    const childrenCount = await this.categoryRepository.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException('Không thể xóa danh mục có danh mục con');
    }

    // Check if category has products
    if (category.products && category.products.length > 0) {
      throw new ConflictException('Không thể xóa danh mục có sản phẩm');
    }

    await this.categoryRepository.remove(category);

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY);
    return category;
  }

  private buildCategoryTree(
    rootCategories: Category[],
    allCategories: Category[],
  ): Category[] {
    return rootCategories.map((root) => {
      const children = allCategories.filter((cat) => cat.parentId === root.id);
      if (children.length > 0) {
        root.children = this.buildCategoryTree(children, allCategories);
      }
      return root;
    });
  }
}
