import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CustomOrderItem } from './custom-order-item.entity';
import { Customer } from './customer.entity';
import { OrderTrackingLog } from './order-tracking-logs.entity';
import { StandardOrderItem } from './standard-order-item.entity';
import { User } from './user.entity';
import { VnpayLog } from '../vnpay/entities/vnpay-log.entity';

export enum OrderStatus {
  AWAITING_PAYMENT_PROOF = 'awaiting_payment_proof',
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  DELIVERY = 'delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DeliveryType {
  STANDARD = 'standard',
  EXPRESS = 'express',
}

export enum SalesChannel {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Entity('orders')
@Index(['customerId'])
@Index(['userId'])
@Index(['createdById'])
@Index(['channel'])
@Index(['orderStatus'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  // Khách hàng - có thể là online user hoặc in-store customer
  @Column({ name: 'customer_id', nullable: true })
  customerId: number; // Khách hàng tại chỗ

  @Column({ name: 'user_id', nullable: true })
  userId: number; // Khách hàng online

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalAmount: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({
    name: 'final_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  finalAmount: number;

  // Thông tin thanh toán mới
  @Column({
    name: 'deposit_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  depositAmount: number; // Số tiền thanh toán trước

  @Column({
    name: 'remaining_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  remainingAmount: number; // Số tiền còn lại

  @Column({ name: 'payment_proof', type: 'text', nullable: true })
  paymentProof: string; // Link ảnh bằng chứng chuyển tiền

  @Column({ name: 'reason_cancel', type: 'text', nullable: true })
  reasonCancel: string; // Lý do hủy đơn
  @Column({ name: 'cancel_by_id', nullable: true })
  cancelById: number; // Người hủy đơn
  // if cancelById is null, alway present by system

  @Column({ name: 'cancel_at', nullable: true })
  cancelAt: Date; // Thời gian hủy đơn

  @Column({
    name: 'order_status',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  // Kênh bán hàng
  @Column({
    type: 'enum',
    enum: SalesChannel,
  })
  channel: SalesChannel;

  // Thông tin liên hệ và giao hàng
  @Column({ name: 'delivery_name' })
  deliveryName: string;

  @Column({ name: 'delivery_phone', length: 15 })
  deliveryPhone: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  // example 2-3 days for standard delivery, 1-2 days for express delivery
  @Column({ name: 'estimated_delivery_days', type: 'varchar', nullable: true })
  estimatedDeliveryDays: string;

  @Column({
    name: 'delivery_type',
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.STANDARD,
  })
  deliveryType: DeliveryType;
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: number; // employee/Admin tạo đơn hoặc system cho online

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User, (user) => user.onlineOrders, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.createdOrders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'created_by_id' })
  createdByUser: User;

  @ManyToOne(() => User, (user) => user.onlineOrders, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'cancel_by_id' })
  cancelByUser: User;

  // New polymorphic order items
  @OneToMany(
    () => StandardOrderItem,
    (standardOrderItem) => standardOrderItem.order,
    {
      cascade: true,
    },
  )
  standardOrderItems: StandardOrderItem[];

  @OneToMany(
    () => CustomOrderItem,
    (customOrderItem) => customOrderItem.order,
    {
      cascade: true,
    },
  )
  customOrderItems: CustomOrderItem[];

  @OneToMany(() => OrderTrackingLog, (trackingLog) => trackingLog.order, {
    cascade: true,
  })
  trackingLogs: OrderTrackingLog[];

  @OneToMany(() => VnpayLog, (vnpayLog) => vnpayLog.order, {
    cascade: true,
  })
  vnpayLogs: VnpayLog[];
}
