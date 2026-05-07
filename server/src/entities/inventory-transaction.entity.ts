import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ProductVariant } from './product-variant.entity';
import { User } from './user.entity';

export enum TransactionType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

export enum ReferenceType {
  ORDER = 'order',

  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
}
// use just for standard items
@Entity('inventory_transactions')
@Index(['productVariantId'])
@Index(['transactionType'])
@Index(['transactionDate'])
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_variant_id' })
  productVariantId: number;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column()
  quantity: number;

  @Column({ length: 200 })
  reason: string;

  @Column({
    name: 'reference_type',
    type: 'enum',
    enum: ReferenceType,
    nullable: true,
  })
  referenceType: ReferenceType;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: number;

  @Column({ name: 'performed_by' })
  performedById: number;

  @Column({ name: 'transaction_date', type: 'datetime' })
  transactionDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => ProductVariant, (variant) => variant.inventoryTransactions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariant;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'performed_by' })
  performedBy: User;
}
