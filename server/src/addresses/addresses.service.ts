import { Repository } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Address } from '../entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { SetDefaultAddressDto } from './dto/set-default-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  private readonly cityNames = {
    hcm: 'TP.HCM',
    hanoi: 'Hà Nội',
    danang: 'Đà Nẵng',
  };

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  /**
   * Tạo địa chỉ mới cho user
   */
  async create(
    userId: number,
    createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    if (createAddressDto.isDefault) {
      await this.clearDefaultAddresses(userId);
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
    });

    return await this.addressRepository.save(address);
  }

  /**
   * Lấy tất cả địa chỉ của user
   */
  async findAllByUser(userId: number): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Lấy địa chỉ theo ID (chỉ của user hiện tại)
   */
  async findOne(id: number, userId: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    return address;
  }

  /**
   * Lấy địa chỉ mặc định của user
   */
  async findDefault(userId: number): Promise<Address | null> {
    return this.addressRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  /**
   * Cập nhật địa chỉ
   */
  async update(
    id: number,
    userId: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    // Nếu cập nhật isDefault = true, clear các địa chỉ mặc định khác
    if (updateAddressDto.isDefault && !address.isDefault) {
      await this.clearDefaultAddresses(userId);
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  /**
   * Set địa chỉ mặc định
   */
  async setDefault(
    id: number,
    userId: number,
    setDefaultAddressDto: SetDefaultAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    if (setDefaultAddressDto.isDefault && !address.isDefault) {
      // Clear tất cả địa chỉ mặc định khác
      await this.clearDefaultAddresses(userId);
    }

    address.isDefault = setDefaultAddressDto.isDefault;
    return this.addressRepository.save(address);
  }

  /**
   * Xóa địa chỉ
   */
  async remove(id: number, userId: number): Promise<Address> {
    const address = await this.findOne(id, userId);

    // Không cho phép xóa địa chỉ mặc định duy nhất
    if (address.isDefault) {
      const totalAddresses = await this.addressRepository.count({
        where: { userId },
      });

      if (totalAddresses === 1) {
        throw new BadRequestException(
          'Không thể xóa địa chỉ mặc định duy nhất. Hãy thêm địa chỉ khác trước.',
        );
      }
      // change isDefault = true for the first other address
      const otherAddresses = await this.addressRepository.find({
        where: { userId, isDefault: false },
      });
      if (otherAddresses.length > 0) {
        await this.addressRepository.update(
          { id: otherAddresses[0].id },
          { isDefault: true },
        );
      }
    }

    await this.addressRepository.remove(address);
    return address;
  }

  /**
   * Clear tất cả địa chỉ mặc định của user
   */
  private async clearDefaultAddresses(userId: number): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
