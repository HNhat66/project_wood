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

import { Order } from './order.entity';
import { User } from './user.entity';

export enum CustomerType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

@Entity('customers')
@Index(['email'])
@Index(['createdById'])
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_code', unique: true })
  customerCode: string; // MKH + số điện thoại

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ length: 15, unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    name: 'total_spent',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalSpent: number;

  @Column({ name: 'created_by_id' })
  createdById: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.createdOrders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
