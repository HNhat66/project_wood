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

import { CartItem } from './cart-item.entity';
import { InventoryTransaction } from './inventory-transaction.entity';
import { Material } from './material.entity';
import { Product } from './product.entity';
import { Size } from './size.entity';
import { StandardOrderItem } from './standard-order-item.entity';

@Entity('product_variants')
@Index(['productId'])
@Index(['materialId'])
@Index(['sizeId'])
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'size_id' })
  sizeId: number;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  price: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'min_stock_level', default: 5 })
  minStockLevel: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Material, (material) => material.productVariants, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => Size, (size) => size.productVariants, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @OneToMany(() => CartItem, (cartItem) => cartItem.productVariant)
  cartItems: CartItem[];

  @OneToMany(
    () => InventoryTransaction,
    (transaction) => transaction.productVariant,
  )
  inventoryTransactions: InventoryTransaction[];

  // New relationship
  @OneToMany(
    () => StandardOrderItem,
    (standardOrderItem) => standardOrderItem.productVariant,
  )
  standardOrderItems: StandardOrderItem[];
}
