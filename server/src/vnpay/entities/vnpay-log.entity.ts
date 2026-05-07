import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Order } from 'src/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum OrderTypeEnum {
  ORDER = 'order',
  CUSTOM_ORDER = 'custom_order',
}

export enum VnpayTransactionStatusEnum {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('vnpay_payment_logs')
export class VnpayLog {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  @ApiProperty({ example: '1' })
  id: string;

  @Column({ name: 'order_id', type: 'int' })
  orderId: number; // Mã đơn hàng nội bộ (app của bạn)

  @Column({ name: 'order_code', type: 'varchar', length: 100 })
  orderNumber: string; // Mã đơn hàng nội bộ (app của bạn)

  @Column({ name: 'vnp_txn_ref', type: 'varchar', length: 100 })
  vnpTxnRef: string; // Mã giao dịch gửi tới VNPAY (vnp_TxnRef)

  @Column({
    name: 'vnp_transaction_no',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  vnpTransactionNo?: string; // Mã giao dịch VNPAY trả về (vnp_TransactionNo)

  @Column({ type: 'bigint' })
  amount: string; // Số tiền thanh toán (đơn vị: VNĐ)

  @Column({
    name: 'response_code',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  responseCode?: string; // Mã phản hồi (vnp_ResponseCode)

  @Column({
    name: 'transaction_status',
    type: 'enum',
    enum: VnpayTransactionStatusEnum,
    default: VnpayTransactionStatusEnum.PENDING,
  })
  transactionStatus?: string; // Trạng thái thanh toán (vnp_TransactionStatus)

  @Column({ name: 'vnp_secure_hash', type: 'text', nullable: true })
  vnpSecureHash?: string; // Hash VNPAY gửi về để kiểm tra

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress?: string; // IP client

  @CreateDateColumn({ name: 'request_time', type: 'datetime' })
  requestTime: Date; // Lúc gửi đi

  @Column({ name: 'response_time', type: 'datetime', nullable: true })
  responseTime?: Date; // Lúc nhận phản hồi

  @Column({ type: 'tinyint', default: 0 })
  success: boolean; // Giao dịch thành công không? (1: thành công, 0: lỗi)

  @Column({ name: 'raw_response', type: 'text', nullable: true })
  rawResponse?: string; // JSON hoặc query string chứa toàn bộ response

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Order, (order) => order.vnpayLogs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
