import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ProductVariant } from './product-variant.entity';

@Entity('sizes')
@Index(['name'])
export class Size {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'length_cm', type: 'decimal', precision: 8, scale: 2 })
  lengthCm: number;

  @Column({ name: 'width_cm', type: 'decimal', precision: 8, scale: 2 })
  widthCm: number;

  @Column({ name: 'height_cm', type: 'decimal', precision: 8, scale: 2 })
  heightCm: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => ProductVariant, (variant) => variant.size)
  productVariants: ProductVariant[];
}
