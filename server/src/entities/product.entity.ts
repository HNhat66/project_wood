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

import { Category } from './category.entity';
import { CustomOrderItem } from './custom-order-item.entity';
import { CustomRequest } from './custom-request.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
@Index(['name'])
@Index(['categoryId'])
@Index(['isActive'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string;

  @Column({
    name: 'base_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  basePrice: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  // New relationships
  @OneToMany(() => CustomRequest, (customRequest) => customRequest.product)
  customRequests: CustomRequest[];

  @OneToMany(
    () => CustomOrderItem,
    (customOrderItem) => customOrderItem.product,
  )
  customOrderItems: CustomOrderItem[];
}
