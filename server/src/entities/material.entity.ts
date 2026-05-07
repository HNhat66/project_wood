import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CustomOrderItem } from './custom-order-item.entity';
import { CustomRequest } from './custom-request.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => ProductVariant, (variant) => variant.material)
  productVariants: ProductVariant[];

  // New relationships
  @OneToMany(() => CustomRequest, (customRequest) => customRequest.material)
  customRequests: CustomRequest[];

  @OneToMany(
    () => CustomOrderItem,
    (customOrderItem) => customOrderItem.material,
  )
  customOrderItems: CustomOrderItem[];
}
