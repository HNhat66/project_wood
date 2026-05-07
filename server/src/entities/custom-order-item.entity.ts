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

import { CustomRequest } from './custom-request.entity';
import { Material } from './material.entity';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity('custom_order_items')
@Index(['orderId'])
@Index(['productId'])
@Index(['materialId'])
export class CustomOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'product_id' })
  productId: number; // Base product template

  @Column({ name: 'custom_request_id', nullable: true })
  customRequestId: number; // Reference to original custom request (if from online)

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
  materialId: number;

  @Column()
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  unitPrice: number; // From quotation or admin-set price

  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalPrice: number;

  @Column({ type: 'text', nullable: true })
  specialRequirements: string;

  @Column({
    name: 'estimated_days',
    type: 'int',
    nullable: true,
  })
  estimatedDays: number; // Production time

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.customOrderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.customOrderItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Material, (material) => material.customOrderItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(
    () => CustomRequest,
    (customRequest) => customRequest.customOrderItems,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'custom_request_id' })
  customRequest: CustomRequest;
}
