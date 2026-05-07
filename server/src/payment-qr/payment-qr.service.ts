import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PaymentQRCode, QRCodeStatus } from '../entities/payment-qr.entity';
import { User } from '../entities/user.entity';
import {
  CreatePaymentQRDto,
  PaymentQRListResponseDto,
  PaymentQRResponseDto,
  UpdatePaymentQRDto,
} from './dto/payment-qr.dto';

@Injectable()
export class PaymentQRService {
  private readonly CACHE_KEY = 'payment_qr';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(PaymentQRCode)
    private paymentQRRepository: Repository<PaymentQRCode>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    createDto: CreatePaymentQRDto,
    adminId: number,
  ): Promise<PaymentQRResponseDto> {
    // if the first QR code, set it to active
    const existingQRCode = await this.paymentQRRepository.findOne({
      where: { status: QRCodeStatus.ACTIVE },
    });
    let status = QRCodeStatus.INACTIVE;
    if (!existingQRCode) {
      status = QRCodeStatus.ACTIVE;
    }
    const qrCode = this.paymentQRRepository.create({
      ...createDto,
      updatedById: adminId,
      status,
    });

    const savedQRCode = await this.paymentQRRepository.save(qrCode);

    // Invalidate cache
    await this.invalidateListCache();

    return this.findOne(savedQRCode.id);
  }

  async findAll(): Promise<PaymentQRListResponseDto> {
    const cacheKey = `${this.CACHE_KEY}:list`;

    // Try cache first
    const cached =
      await this.cacheManager.get<PaymentQRListResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const qrCodes = await this.paymentQRRepository.find({
      relations: ['updatedBy'],
      order: { updatedAt: 'DESC' },
    });

    const result: PaymentQRListResponseDto = {
      data: qrCodes.map(this.mapToResponseDto),
      total: qrCodes.length,
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findActive(): Promise<PaymentQRResponseDto | null> {
    const cacheKey = `${this.CACHE_KEY}:active`;

    // Try cache first
    const cached = await this.cacheManager.get<PaymentQRResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const activeQR = await this.paymentQRRepository.findOne({
      where: { status: QRCodeStatus.ACTIVE },
      relations: ['updatedBy'],
      order: { updatedAt: 'DESC' },
    });

    if (!activeQR) {
      return null;
    }

    const result = this.mapToResponseDto(activeQR);
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findOne(id: number): Promise<PaymentQRResponseDto> {
    const cacheKey = `${this.CACHE_KEY}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<PaymentQRResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const qrCode = await this.paymentQRRepository.findOne({
      where: { id },
      relations: ['updatedBy'],
    });

    if (!qrCode) {
      throw new NotFoundException('Không tìm thấy QR code thanh toán');
    }

    const result = this.mapToResponseDto(qrCode);
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async update(
    id: number,
    updateDto: UpdatePaymentQRDto,
    adminId: number,
  ): Promise<PaymentQRResponseDto> {
    const qrCode = await this.paymentQRRepository.findOne({
      where: { id },
    });

    if (!qrCode) {
      throw new NotFoundException('Không tìm thấy QR code thanh toán');
    }

    // Validate admin exists
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Người dùng admin không tồn tại');
    }

    Object.assign(qrCode, updateDto);
    qrCode.updatedById = adminId;

    await this.paymentQRRepository.save(qrCode);

    // Invalidate caches
    await this.invalidateCache(id);
    await this.invalidateListCache();
    await this.invalidateActiveCache();

    return this.findOne(id);
  }

  async setActive(id: number, adminId: number): Promise<PaymentQRResponseDto> {
    // First, deactivate all existing QR codes
    await this.paymentQRRepository.update(
      { status: QRCodeStatus.ACTIVE },
      { status: QRCodeStatus.INACTIVE },
    );

    // Then activate the selected one
    const qrCode = await this.paymentQRRepository.findOne({
      where: { id },
    });

    if (!qrCode) {
      throw new NotFoundException('Không tìm thấy QR code thanh toán');
    }

    qrCode.status = QRCodeStatus.ACTIVE;
    qrCode.updatedById = adminId;

    await this.paymentQRRepository.save(qrCode);

    // Invalidate caches
    await this.invalidateCache(id);
    await this.invalidateListCache();
    await this.invalidateActiveCache();

    return this.findOne(id);
  }

  async remove(id: number): Promise<PaymentQRCode> {
    // can only delete inactive QR codes, alway keeps one active QR code
    const qrCode = await this.paymentQRRepository.findOne({
      where: { id },
    });

    if (!qrCode) {
      throw new NotFoundException('Không tìm thấy QR code thanh toán');
    }
    if (qrCode.status === QRCodeStatus.ACTIVE) {
      throw new BadRequestException('Không thể xóa QR code hoạt động');
    }

    // check if there is any active QR code
    const activeQRCode = await this.paymentQRRepository.findOne({
      where: { status: QRCodeStatus.ACTIVE },
    });
    if (!activeQRCode) {
      throw new BadRequestException(
        'Không thể xóa QR code hoạt động cuối cùng',
      );
    }

    await this.paymentQRRepository.remove(qrCode);

    // Invalidate caches
    await this.invalidateCache(id);
    await this.invalidateListCache();
    await this.invalidateActiveCache();
    return qrCode;
  }

  private mapToResponseDto(qrCode: PaymentQRCode): PaymentQRResponseDto {
    return {
      id: qrCode.id,
      qrCodeUrl: qrCode.qrCodeUrl,
      bankName: qrCode.bankName,
      accountNumber: qrCode.accountNumber,
      accountName: qrCode.accountName,
      description: qrCode.description,
      status: qrCode.status,
      updatedBy: {
        id: qrCode.updatedBy.id,
        fullName: qrCode.updatedBy.fullName,
        email: qrCode.updatedBy.email,
      },
      createdAt: qrCode.createdAt,
      updatedAt: qrCode.updatedAt,
    };
  }

  private async invalidateCache(id: number): Promise<void> {
    const cacheKey = `${this.CACHE_KEY}:${id}`;
    await this.cacheManager.del(cacheKey);
  }

  private async invalidateListCache(): Promise<void> {
    const cacheKey = `${this.CACHE_KEY}:list`;
    await this.cacheManager.del(cacheKey);
  }

  private async invalidateActiveCache(): Promise<void> {
    const cacheKey = `${this.CACHE_KEY}:active`;
    await this.cacheManager.del(cacheKey);
  }
}
