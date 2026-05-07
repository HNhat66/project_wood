import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

export enum QRCodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('payment_qr_codes')
@Index(['status'])
@Index(['updatedById'])
export class PaymentQRCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'qr_code_url', type: 'text' })
  qrCodeUrl: string; // URL hoặc base64 của QR code

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ name: 'account_number' })
  accountNumber: string;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: QRCodeStatus,
    default: QRCodeStatus.ACTIVE,
  })
  status: QRCodeStatus;

  @Column({ name: 'updated_by_id' })
  updatedById: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.createdOrders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User;
}
