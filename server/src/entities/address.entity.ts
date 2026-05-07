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

import { User } from './user.entity';

@Entity('addresses')
@Index(['userId'])
@Index(['isDefault'])
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ length: 100 })
  name: string; // Tên gọi địa chỉ: "Nhà riêng", "Văn phòng", v.v.

  @Column({ name: 'full_name', length: 255 })
  fullName: string; // Họ tên người nhận

  @Column({ length: 15 })
  phone: string; // Số điện thoại người nhận

  @Column({ type: 'text' })
  address: string; // Địa chỉ chi tiết: số nhà, tên đường

  @Column({ name: 'is_default', default: false })
  isDefault: boolean; // Địa chỉ mặc định

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
