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

import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('order_tracking_logs')
@Index(['orderId'])
@Index(['createdById'])
@Index(['createdAt'])
export class OrderTrackingLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ type: 'text' })
  message: string; // Nội dung log do admin nhập

  @Column({ name: 'created_by_id' })
  createdById: number; // Admin đã tạo log này

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Order, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;
}
