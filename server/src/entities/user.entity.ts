import * as bcrypt from 'bcrypt';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Address } from './address.entity';
import { CustomRequest } from './custom-request.entity';
import { Order } from './order.entity';
import { RefreshToken } from './refresh-token.entity';

export enum UserRole {
  USER = 'user', // Khách hàng online
  EMPLOYEE = 'employee', // Nhân viên
  ADMIN = 'admin', // Quản lý
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
@Index(['role', 'status'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ length: 15, unique: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  // Thông tin bổ sung cho khách hàng online
  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  // Thông tin cho employee/admin
  @Column({ name: 'employee_code', nullable: true, unique: true })
  employeeCode: string;

  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate: Date;

  @Column({ name: 'reason_for_status_change', type: 'text', nullable: true })
  reasonForStatusChange: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  // Order relationships
  @OneToMany(() => Order, (order) => order.user)
  onlineOrders: Order[];

  @OneToMany(() => Order, (order) => order.createdByUser)
  createdOrders: Order[];

  // Custom request relationships
  @OneToMany(() => CustomRequest, (customRequest) => customRequest.user)
  customRequests: CustomRequest[];

  @OneToMany(() => CustomRequest, (customRequest) => customRequest.quotedBy)
  quotedCustomRequests: CustomRequest[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}
