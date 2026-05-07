import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Customer } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import {
  CreateCustomerDto,
  CustomerListResponseDto,
  CustomerResponseDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  private readonly CACHE_KEY = 'customers';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const { phone, email, dateOfBirth, ...customerData } = createDto;

    // Validate employee exists
    const employee = await this.userRepository.findOne({
      where: { id: createDto.createdById },
    });
    if (!employee) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    // Check if phone number already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { phone },
    });
    if (existingCustomer) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Email đã tồn tại');
      }
    }

    // Generate customer code: MKH + phone number
    const customerCode = this.generateCustomerCode(phone);

    // Validate phone number format (Vietnamese phone numbers)
    if (!this.validateVietnamesePhone(phone)) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }

    const customer = this.customerRepository.create({
      ...customerData,
      phone,
      email,
      customerCode,
      createdById: createDto.createdById,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Invalidate cache
    await this.invalidateListCache();

    return this.findOne(savedCustomer.id);
  }

  async findAll(queryDto: any): Promise<CustomerListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;
    const cacheKey = `${this.CACHE_KEY}:list:${page}:${limit}:${search || 'all'}:${type || 'all'}:${sortBy}:${sortOrder}`;

    // Try cache first
    const cached =
      await this.cacheManager.get<CustomerListResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.createdBy', 'createdBy')
      .leftJoinAndSelect('customer.orders', 'orders');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(customer.fullName LIKE :search OR customer.phone LIKE :search OR customer.email LIKE :search OR customer.customerCode LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Customer type filter
    if (type) {
      queryBuilder.andWhere('customer.customerType = :type', { type });
    }

    // Sorting
    switch (sortBy) {
      case 'totalSpent':
        // Sort by calculated total spent from orders
        queryBuilder
          .addSelect(
            'COALESCE(SUM(orders.finalAmount), 0)',
            'calculatedTotalSpent',
          )
          .groupBy('customer.id')
          .addGroupBy('createdBy.id')
          .orderBy('calculatedTotalSpent', sortOrder);
        break;
      case 'totalOrders':
        // Sort by number of orders
        queryBuilder
          .addSelect('COUNT(orders.id)', 'orderCount')
          .groupBy('customer.id')
          .addGroupBy('createdBy.id')
          .orderBy('orderCount', sortOrder);
        break;
      case 'fullName':
        queryBuilder.orderBy('customer.fullName', sortOrder);
        break;
      case 'lastOrderDate':
        queryBuilder
          .addSelect('MAX(orders.createdAt)', 'lastOrder')
          .groupBy('customer.id')
          .addGroupBy('createdBy.id')
          .orderBy('lastOrder', sortOrder);
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('customer.createdAt', sortOrder);
        break;
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const result: CustomerListResponseDto = {
      data: data.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findOne(id: number): Promise<CustomerResponseDto> {
    const cacheKey = `${this.CACHE_KEY}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<CustomerResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!customer) {
      throw new NotFoundException('Khách hàng không tồn tại');
    }

    const result = this.mapToResponseDto(customer);
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findByCustomerCode(customerCode: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { customerCode },
      relations: ['createdBy'],
    });

    if (!customer) {
      throw new NotFoundException('Khách hàng không tồn tại');
    }

    return this.mapToResponseDto(customer);
  }

  async findByPhone(
    phone: string,
  ): Promise<{ exists: boolean; customer?: CustomerResponseDto }> {
    const customer = await this.customerRepository.findOne({
      where: { phone },
      relations: ['createdBy'],
    });

    if (!customer) {
      return { exists: false };
    }

    return {
      exists: true,
      customer: this.mapToResponseDto(customer),
    };
  }

  async update(
    id: number,
    updateDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Khách hàng không tồn tại');
    }

    const { phone, email, ...updateData } = updateDto;

    // Check phone number uniqueness if changed
    if (phone && phone !== customer.phone) {
      if (!this.validateVietnamesePhone(phone)) {
        throw new BadRequestException('Số điện thoại không hợp lệ');
      }

      const existingPhone = await this.customerRepository.findOne({
        where: { phone },
      });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã tồn tại');
      }

      // Generate new customer code if phone changed
      updateData['customerCode'] = this.generateCustomerCode(phone);
      updateData['phone'] = phone;
    }

    // Check email uniqueness if changed
    if (email && email !== customer.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Email đã tồn tại');
      }
      updateData['email'] = email;
    }

    Object.assign(customer, updateData);
    await this.customerRepository.save(customer);

    // Invalidate caches
    await this.invalidateCache(id);
    await this.invalidateListCache();

    return this.findOne(id);
  }

  private generateCustomerCode(phone: string): string {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Generate customer code: MKH + phone number
    return `MKH${cleanPhone}`;
  }

  private validateVietnamesePhone(phone: string): boolean {
    // Vietnamese phone number patterns
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private mapToResponseDto(customer: Customer): CustomerResponseDto {
    // Calculate totalSpent from orders
    const totalSpent =
      customer.orders?.reduce(
        (sum, order) => sum + Number(order.finalAmount || 0),
        0,
      ) || 0;

    return {
      id: customer.id,
      customerCode: customer.customerCode,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
      createdBy: customer.createdBy
        ? {
            id: customer.createdBy.id,
            fullName: customer.createdBy.fullName,
            email: customer.createdBy.email,
          }
        : null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      totalSpent: totalSpent,
      totalOrders: customer.orders?.length || 0,
      lastOrderDate:
        customer.orders?.length > 0
          ? new Date(
              Math.max(
                ...customer.orders.map((order) =>
                  new Date(order.createdAt).getTime(),
                ),
              ),
            )
          : null,
    } as CustomerResponseDto;
  }

  private async invalidateCache(id: number): Promise<void> {
    const cacheKey = `${this.CACHE_KEY}:${id}`;
    await this.cacheManager.del(cacheKey);
  }

  private async invalidateListCache(): Promise<void> {
    // Clear common cache patterns
    const commonKeys = [
      `${this.CACHE_KEY}:list:1:10:all:all`,
      `${this.CACHE_KEY}:list:1:20:all:all`,
      `${this.CACHE_KEY}:list:1:10:all:retail`,
      `${this.CACHE_KEY}:list:1:10:all:wholesale`,
    ];

    for (const key of commonKeys) {
      await this.cacheManager.del(key);
    }
  }
}
