import * as bcrypt from 'bcrypt';
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

import { User, UserRole, UserStatus } from '../entities/user.entity';
import {
  CreateEmployeeDto,
  ResetPasswordDto,
  UpdateEmployeeDto,
  UpdateUserStatusDto,
  UserListResponseDto,
  UserQueryDto,
} from './dto/admin-user.dto';

@Injectable()
export class UsersService {
  private readonly CACHE_KEY = 'users';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<User> {
    const { email, phone, employeeCode } = createEmployeeDto;

    // Check if email already exists
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Check if phone already exists
    const existingUserByPhone = await this.userRepository.findOne({
      where: { phone },
    });

    if (existingUserByPhone) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    // Check if employee code already exists (if provided)
    if (employeeCode) {
      const existingUserByEmployeeCode = await this.userRepository.findOne({
        where: { employeeCode },
      });

      if (existingUserByEmployeeCode) {
        throw new ConflictException('Mã nhân viên đã tồn tại');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...createEmployeeDto,
      passwordHash: hashedPassword,
      hireDate: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    // Invalidate cache
    await this.invalidateUsersCache();

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async getUsers(query: UserQueryDto): Promise<UserListResponseDto> {
    const { page = 1, limit = 10, search, roleFilter, statusFilter } = query;

    // Build cache key
    const cacheKey = `${this.CACHE_KEY}:list:${JSON.stringify(query)}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<UserListResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.fullName LIKE :search OR user.email LIKE :search OR user.phone LIKE :search OR user.employeeCode LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply role filter
    if (roleFilter && roleFilter !== 'all') {
      queryBuilder.andWhere('user.role = :role', { role: roleFilter });
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      queryBuilder.andWhere('user.status = :status', { status: statusFilter });
    }

    // Add pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by created date
    queryBuilder.orderBy('user.createdAt', 'DESC');

    // Execute query
    const [users, total] = await queryBuilder.getManyAndCount();

    // Remove password hash from results
    const sanitizedUsers = users.map((user) => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    const result: UserListResponseDto = {
      data: sanitizedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async getUserById(id: number, compact: boolean = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: compact ? [] : ['addresses', 'onlineOrders', 'customRequests'],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Remove password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async updateEmployee(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { phone, employeeCode } = updateEmployeeDto;

    // Check phone uniqueness if being updated
    if (phone && phone !== user.phone) {
      const existingUserByPhone = await this.userRepository.findOne({
        where: { phone },
      });

      if (existingUserByPhone) {
        throw new ConflictException('Số điện thoại đã tồn tại');
      }
    }

    // Check employee code uniqueness if being updated
    if (employeeCode && employeeCode !== user.employeeCode) {
      const existingUserByEmployeeCode = await this.userRepository.findOne({
        where: { employeeCode },
      });

      if (existingUserByEmployeeCode) {
        throw new ConflictException('Mã nhân viên đã tồn tại');
      }
    }

    // Update user
    Object.assign(user, updateEmployeeDto);
    const updatedUser = await this.userRepository.save(user);

    // Invalidate cache
    await this.invalidateUsersCache();

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async updateUserStatus(
    id: number,
    updateStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    if (user.status === updateStatusDto.status) {
      throw new BadRequestException('Trạng thái hiện tại đã là trạng thái đó');
    }

    // Update status
    user.status = updateStatusDto.status;
    // if status is active, set reason for status change to null
    if (updateStatusDto.status === UserStatus.ACTIVE) {
      user.reasonForStatusChange = null;
    }
    // just update reason for status change if status is inactive
    if (
      updateStatusDto.reason &&
      updateStatusDto.status === UserStatus.INACTIVE
    ) {
      user.reasonForStatusChange = updateStatusDto.reason;
    }
    const updatedUser = await this.userRepository.save(user);

    // Invalidate cache
    await this.invalidateUsersCache();

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  async resetPassword(
    id: number,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { newPassword, confirmPassword } = resetPasswordDto;
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Only allow password reset for employee and admin users
    if (user.role === UserRole.USER) {
      throw new BadRequestException(
        'Không thể reset mật khẩu cho tài khoản khách hàng',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.passwordHash = hashedPassword;
    await this.userRepository.save(user);

    // Log the password reset

    return { message: 'Mật khẩu đã được reset thành công' };
  }

  async getDashboardStats(): Promise<any> {
    const cacheKey = `${this.CACHE_KEY}:stats`;

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [totalUsers, activeUsers, adminUsers, employeeUsers, customerUsers] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
        this.userRepository.count({ where: { role: UserRole.ADMIN } }),
        this.userRepository.count({ where: { role: UserRole.EMPLOYEE } }),
        this.userRepository.count({ where: { role: UserRole.USER } }),
      ]);

    const stats = {
      totalUsers,
      activeUsers,
      adminUsers,
      employeeUsers,
      customerUsers,
      inactiveUsers: totalUsers - activeUsers,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, stats, this.CACHE_TTL);

    return stats;
  }

  private async invalidateUsersCache(): Promise<void> {
    // Simple cache invalidation - delete specific patterns
    await this.cacheManager.del(this.CACHE_KEY);
    await this.cacheManager.del(`${this.CACHE_KEY}:stats`);
    // Note: For more complex cache invalidation, consider using Redis directly
  }
}
