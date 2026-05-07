import { Repository } from 'typeorm';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CustomRequest,
  CustomRequestStatus,
} from '../entities/custom-request.entity';
import { Material } from '../entities/material.entity';
import { Product } from '../entities/product.entity';
import { User, UserRole } from '../entities/user.entity';
import {
  CreateCustomRequestDto,
  CustomRequestQueryDto,
  ProvideQuotationDto,
  UpdateCustomRequestDto,
} from './dto/custom-request.dto';

@Injectable()
export class CustomRequestsService {
  constructor(
    @InjectRepository(CustomRequest)
    private readonly customRequestRepository: Repository<CustomRequest>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // USER ENDPOINTS

  async create(createDto: CreateCustomRequestDto, userId: number) {
    // Verify product exists and is active
    const product = await this.productRepository.findOne({
      where: { id: createDto.productId, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Verify material exists and is active
    const material = await this.materialRepository.findOne({
      where: { id: createDto.materialId, isActive: true },
    });
    if (!material) {
      throw new NotFoundException('Vật liệu không tồn tại');
    }

    const customRequest = this.customRequestRepository.create({
      ...createDto,
      userId,
      status: CustomRequestStatus.PENDING,
    });

    const savedRequest = await this.customRequestRepository.save(customRequest);

    return this.findOne(savedRequest.id);
  }

  async findAllByUser(userId: number, queryDto: CustomRequestQueryDto) {
    const { page = 1, limit = 10, status } = queryDto;
    const skip = (page - 1) * limit;
    // join and get specific fields in quotedBy like id, name, phone, email
    const queryBuilder = this.customRequestRepository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.product', 'product')
      .leftJoinAndSelect('cr.material', 'material')
      .leftJoinAndSelect('cr.quotedBy', 'quotedBy')
      .select([
        'cr',
        'quotedBy.id',
        'quotedBy.fullName',
        'quotedBy.phone',
        'quotedBy.email',
        'product',
        'material',
      ])
      .where('cr.userId = :userId', { userId })
      .orderBy('cr.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('cr.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, userId?: number) {
    const queryBuilder = this.customRequestRepository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.user', 'user')
      .leftJoinAndSelect('cr.product', 'product')
      .leftJoinAndSelect('cr.material', 'material')
      .leftJoinAndSelect('cr.quotedBy', 'quotedBy')
      .where('cr.id = :id', { id });

    // If userId is provided, ensure user can only access their own requests
    if (userId) {
      queryBuilder.andWhere('cr.userId = :userId', { userId });
    }

    const customRequest = await queryBuilder.getOne();

    if (!customRequest) {
      throw new NotFoundException('Yêu cầu tùy chỉnh không tồn tại');
    }

    return customRequest;
  }

  async update(id: number, updateDto: UpdateCustomRequestDto, userId: number) {
    const customRequest = await this.findOne(id, userId);

    if (customRequest.status !== CustomRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể cập nhật yêu cầu chờ xử lý');
    }

    // If material is being changed, verify it exists and is active
    if (updateDto.materialId) {
      const material = await this.materialRepository.findOne({
        where: { id: updateDto.materialId, isActive: true },
      });
      if (!material) {
        throw new NotFoundException('Vật liệu không tồn tại');
      }
    }

    await this.customRequestRepository.update(id, {
      ...updateDto,
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const customRequest = await this.findOne(id, userId);

    if (customRequest.status !== CustomRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy yêu cầu chờ xử lý');
    }

    await this.customRequestRepository.remove(customRequest);
    return customRequest;
  }

  // ADMIN ENDPOINTS

  async findAllForAdmin(queryDto: CustomRequestQueryDto) {
    const { page = 1, limit = 20, status, userId } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customRequestRepository
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.user', 'user')
      .leftJoinAndSelect('cr.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('cr.material', 'material')
      .leftJoinAndSelect('cr.quotedBy', 'quotedBy')
      .orderBy('cr.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('cr.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('cr.userId = :userId', { userId });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((item) => ({
        ...item,
        user: {
          id: item.user.id,
          fullName: item.user.fullName,
          phone: item.user.phone,
          email: item.user.email,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPendingRequests(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    return this.findAllForAdmin({
      page,
      limit,
      status: CustomRequestStatus.PENDING,
    });
  }

  async getQuotedRequests(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    return this.findAllForAdmin({
      page,
      limit,
      status: CustomRequestStatus.QUOTED,
    });
  }

  async provideQuotation(
    id: number,
    quotationDto: ProvideQuotationDto,
    quotedById: number,
  ) {
    const customRequest = await this.findOne(id);

    if (customRequest.status !== CustomRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể báo giá đơn hàng chờ xử lý');
    }

    // Verify the user providing quotation exists and has proper role
    const quotedBy = await this.userRepository.findOne({
      where: { id: quotedById },
    });
    if (
      !quotedBy ||
      ![UserRole.ADMIN, UserRole.EMPLOYEE].includes(quotedBy.role)
    ) {
      throw new ForbiddenException(
        'Chỉ admin hoặc nhân viên mới có thể cung cấp báo giá',
      );
    }

    await this.customRequestRepository.update(id, {
      ...quotationDto,
      status: CustomRequestStatus.QUOTED,
      quotedById,
      quotedAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  async getRequestsByUser(userId: number, paginationDto: PaginationDto) {
    return this.findAllForAdmin({
      ...paginationDto,
      userId,
    });
  }

  // UTILITY METHODS

  async getRequestStats() {
    const stats = await this.customRequestRepository
      .createQueryBuilder('cr')
      .select([
        'cr.status',
        'COUNT(*) as count',
        'AVG(cr.quotedPrice) as avgPrice',
      ])
      .groupBy('cr.status')
      .getRawMany();

    return stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: parseInt(stat.count),
        avgPrice: stat.avgPrice ? parseFloat(stat.avgPrice) : null,
      };
      return acc;
    }, {});
  }
}
