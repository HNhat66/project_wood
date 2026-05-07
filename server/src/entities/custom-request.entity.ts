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
import { Material } from './material.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

export enum CustomRequestStatus {
  PENDING = 'pending', // Submitted by user, awaiting admin review
  QUOTED = 'quoted', // Admin provided quotation, awaiting user decision
}

@Entity('custom_requests')
@Index(['userId'])
@Index(['productId'])
@Index(['materialId'])
@Index(['status'])
@Index(['createdAt'])
export class CustomRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number; // Only online users can submit custom requests

  @Column({ name: 'product_id' })
  productId: number; // Base product template

  // Custom dimensions in millimeters
  @Column({
    name: 'custom_width',
    type: 'decimal',
    precision: 8,
    scale: 2,
  })
  customWidth: number;

  @Column({
    name: 'custom_height',
    type: 'decimal',
    precision: 8,
    scale: 2,
  })
  customHeight: number;

  @Column({
    name: 'custom_depth',
    type: 'decimal',
    precision: 8,
    scale: 2,
  })
  customDepth: number;

  @Column({ name: 'material_id' })
  materialId: number; // Preferred material

  @Column({ type: 'text', nullable: true })
  specialRequirements: string; // Additional notes from user

  @Column({
    type: 'enum',
    enum: CustomRequestStatus,
    default: CustomRequestStatus.PENDING,
  })
  status: CustomRequestStatus;

  // Quotation details (filled when status = 'quoted')
  @Column({
    name: 'quoted_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  quotedPrice: number;

  @Column({
    name: 'estimated_days',
    type: 'int',
    nullable: true,
  })
  estimatedDays: number; // Production time estimate

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string; // Internal notes from admin

  @Column({ name: 'quoted_by_id', nullable: true })
  quotedById: number; // Admin who provided the quote

  @Column({ name: 'quoted_at', type: 'datetime', nullable: true })
  quotedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.customRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product, (product) => product.customRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Material, (material) => material.customRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => User, (user) => user.quotedCustomRequests, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'quoted_by_id' })
  quotedBy: User;

  // One-to-many relationship with custom order items if user decides to purchase
  @OneToMany(
    () => CustomOrderItem,
    (customOrderItem) => customOrderItem.customRequest,
  )
  customOrderItems: CustomOrderItem[];
}
