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
import { ProductVariant } from './product-variant.entity';

@Entity('standard_order_items')
@Index(['orderId'])
@Index(['productVariantId'])
export class StandardOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'product_variant_id' })
  productVariantId: number;

  @Column()
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  unitPrice: number; // Price at time of order (may differ from current variant price)

  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.standardOrderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductVariant, (variant) => variant.standardOrderItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariant;
}
