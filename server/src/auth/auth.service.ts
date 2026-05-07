import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { RefreshToken } from '../entities/refresh-token.entity';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { LoginDto, LoginResponseDto, RegisterDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  deviceName?: string;
  platform?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      phone,
      address,
      agreedToTerms,
    } = registerDto;

    // Check if user already exists
    // find by phone or email
    const existingUser = await this.userRepository.findOne({
      where: [{ phone }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Số điện thoại hoặc email đã tồn tại');
    }

    if (password !== confirmPassword) {
      throw new UnauthorizedException(
        'Mật khẩu và xác nhận mật khẩu không khớp',
      );
    }

    if (!agreedToTerms) {
      throw new UnauthorizedException('Bạn phải đồng ý với điều khoản sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      phone,
      address,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);
    const userResponse = Array.isArray(savedUser) ? savedUser[0] : savedUser;
    return {
      id: userResponse.id,
      email: userResponse.email,
      fullName: userResponse.fullName,
      role: userResponse.role,
    } as User;
  }

  async login(
    loginDto: LoginDto,
    deviceInfo?: DeviceInfo,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: LoginResponseDto;
  }> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );
    }

    const tokens = await this.generateTokens(user, deviceInfo);
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        employeeCode: user.employeeCode,
        createdAt: user.createdAt,
      },
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, status: UserStatus.ACTIVE },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async refreshToken(
    refreshTokenValue: string,
    deviceInfo?: DeviceInfo,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenValue, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Token làm mới không hợp lệ');
    }

    if (refreshToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.update(refreshToken.id, {
        isRevoked: true,
      });
      throw new UnauthorizedException('Token làm mới đã hết hạn');
    }

    if (refreshToken.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản người dùng không hoạt động');
    }

    // Update last used
    await this.refreshTokenRepository.update(refreshToken.id, {
      lastUsedAt: new Date(),
    });

    // Generate new tokens
    return await this.generateTokens(refreshToken.user, deviceInfo);
  }

  async logout(refreshTokenValue: string): Promise<{ message: string }> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenValue, isRevoked: false },
    });

    if (refreshToken) {
      await this.refreshTokenRepository.update(refreshToken.id, {
        isRevoked: true,
      });
    }

    return { message: 'Đăng xuất thành công' };
  }

  async logoutAllDevices(userId: number): Promise<{ message: string }> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    return { message: 'Đăng xuất từ tất cả thiết bị thành công' };
  }

  async getActiveSessions(userId: number): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
      order: { lastUsedAt: 'DESC' },
    });
  }

  async revokeSession(
    userId: number,
    tokenId: number,
  ): Promise<{ message: string }> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { id: tokenId, userId, isRevoked: false },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Phiên không tồn tại');
    }

    await this.refreshTokenRepository.update(tokenId, { isRevoked: true });

    return { message: 'Phiên đã bị hủy' };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (
      user &&
      user.status === UserStatus.ACTIVE &&
      (await user.validatePassword(password))
    ) {
      return user;
    }

    // if user

    return null;
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'fullName',
        'phone',
        'role',
        'status',
        'address',
        'dateOfBirth',
        'gender',
        'employeeCode',
        'createdAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản người dùng không tồn tại');
    }

    return user;
  }

  async updateProfile(userId: number, updateData: any): Promise<User> {
    const user = await this.findById(userId);

    Object.assign(user, updateData);
    await this.userRepository.save(user);

    return this.getProfile(userId);
  }

  async changePassword(
    userId: number,
    changePasswordData: any,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);

    const isCurrentPasswordValid = await user.validatePassword(
      changePasswordData.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    user.passwordHash = await bcrypt.hash(changePasswordData.newPassword, 12);
    await this.userRepository.save(user);

    return { message: 'Mật khẩu đã được thay đổi' };
  }

  private async generateTokens(
    user: User,
    deviceInfo?: DeviceInfo,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshTokenValue = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Clean up old tokens (keep only last 5 per user)
    await this.cleanupOldTokens(user.id);

    // Save refresh token
    const refreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshTokenValue,
      deviceInfo,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
    };
  }

  private async cleanupOldTokens(userId: number): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (tokens.length >= 5) {
      const tokensToRevoke = tokens.slice(4); // Keep only 5 most recent
      const tokenIds = tokensToRevoke.map((token) => token.id);

      if (tokenIds.length > 0) {
        await this.refreshTokenRepository.update(tokenIds, { isRevoked: true });
      }
    }
  }

  async ensureDemoUser(params: {
    email?: string;
    password?: string;
    phone?: string;
    fullName?: string;
  }): Promise<void> {
    const email = params.email || process.env.DEMO_EMAIL;
    const password = params.password || process.env.DEMO_PASSWORD;
    const phone = params.phone || process.env.DEMO_PHONE;
    const fullName = params.fullName || 'Demo Admin';

    if (!email || !password || !phone) {
      return; // Missing required envs -> skip seeding silently
    }

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user = this.userRepository.create({
        email,
        passwordHash: hashedPassword,
        fullName,
        phone,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      await this.userRepository.save(user);
      return;
    }

    let changed = false;
    if (user.role !== UserRole.ADMIN) {
      user.role = UserRole.ADMIN;
      changed = true;
    }
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 12);
      changed = true;
    }
    if (!user.phone && phone) {
      user.phone = phone;
      changed = true;
    }
    if (!user.fullName && fullName) {
      user.fullName = fullName;
      changed = true;
    }
    if (user.status !== UserStatus.ACTIVE) {
      user.status = UserStatus.ACTIVE;
      changed = true;
    }
    if (changed) {
      await this.userRepository.save(user);
    }
  }
}
