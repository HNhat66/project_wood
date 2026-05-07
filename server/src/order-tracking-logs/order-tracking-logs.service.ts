import { OrdersService } from 'src/orders/orders.service';
import { DataSource, Repository } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { OrderTrackingLog } from '../entities/order-tracking-logs.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { User, UserRole } from '../entities/user.entity';
import {
  CreateTrackingLogDto,
  TrackingLogResponseDto,
  UpdateOrderStatusWithLogDto,
} from './dto/tracking-log.dto';

@Injectable()
export class OrderTrackingLogsService {
  constructor(
    @InjectRepository(OrderTrackingLog)
    private readonly trackingLogRepository: Repository<OrderTrackingLog>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly ordersService: OrdersService,
    private readonly dataSource: DataSource,
  ) {}

  async createTrackingLog(
    createDto: CreateTrackingLogDto,
    createdById: number,
  ): Promise<TrackingLogResponseDto> {
    // Verify admin user exists
    const admin = await this.userRepository.findOne({
      where: { id: createdById },
    });
    if (!admin || ![UserRole.ADMIN, UserRole.EMPLOYEE].includes(admin.role)) {
      throw new NotFoundException(
        'Admin user không tồn tại hoặc quyền không đủ',
      );
    }

    // Verify order exists
    const order = await this.orderRepository.findOne({
      where: { id: createDto.orderId },
    });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Create tracking log
    const trackingLog = this.trackingLogRepository.create({
      orderId: createDto.orderId,
      message: createDto.message,
      createdById,
    });

    const savedLog = await this.trackingLogRepository.save(trackingLog);

    return {
      ...savedLog,
      createdBy: {
        id: admin.id,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  async updateOrderStatusWithLog(
    orderId: number,
    updateDto: UpdateOrderStatusWithLogDto,
    updatedById: number,
  ): Promise<{ order: Order; trackingLog?: TrackingLogResponseDto }> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        // Verify admin user exists
        const admin = await manager.findOne(User, {
          where: { id: updatedById },
        });
        if (
          !admin ||
          ![UserRole.ADMIN, UserRole.EMPLOYEE].includes(admin.role)
        ) {
          throw new NotFoundException(
            'Admin user không tồn tại hoặc quyền không đủ',
          );
        }

        // Verify order exists with relations for stock restoration
        const order = await manager.findOne(Order, {
          where: { id: orderId },
          relations: ['standardOrderItems'],
        });
        if (!order) {
          throw new NotFoundException('Đơn hàng không tồn tại');
        }

        // Validate status transition
        const newStatus = updateDto.newStatus as OrderStatus;
        this.validateStatusTransition(order.orderStatus, newStatus);

        // Validate that cancelled orders must have a reason/message
        if (
          newStatus === OrderStatus.CANCELLED &&
          (!updateDto.message || !updateDto.message.trim())
        ) {
          throw new BadRequestException('Lý do hủy đơn hàng là bắt buộc');
        }

        // Restore stock if order is being cancelled
        if (
          newStatus === OrderStatus.CANCELLED &&
          [OrderStatus.PENDING, OrderStatus.APPROVED].includes(
            order.orderStatus,
          )
        ) {
          await this.ordersService.restoreStockForCancelledOrder(
            manager,
            order,
            updatedById,
          );
        }

        // Update order status
        await manager.update(Order, orderId, {
          orderStatus: newStatus,
          ...(newStatus === OrderStatus.CANCELLED && {
            reasonCancel: updateDto.message || 'Không có lý do hủy',
          }),
        });

        const updatedOrder = await manager.findOne(Order, {
          where: { id: orderId },
        });

        let trackingLog: TrackingLogResponseDto | undefined;

        // Create tracking log if message is provided
        if (updateDto.message) {
          const logData = manager.create(OrderTrackingLog, {
            orderId,
            message: updateDto.message,
            createdById: updatedById,
          });

          const savedLog = await manager.save(logData);
          trackingLog = {
            ...savedLog,
            createdBy: {
              id: admin.id,
              fullName: admin.fullName,
              role: admin.role,
            },
          };
        }

        return {
          order: updatedOrder!,
          trackingLog,
        };
      } catch (error) {
        throw error;
      }
    });
  }

  async getTrackingLogsByOrderId(
    orderId: number,
  ): Promise<TrackingLogResponseDto[]> {
    const trackingLogs = await this.trackingLogRepository.find({
      where: { orderId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });

    return trackingLogs.map((log) => ({
      id: log.id,
      orderId: log.orderId,
      message: log.message,
      createdById: log.createdById,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      createdBy: {
        id: log.createdBy.id,
        fullName: log.createdBy.fullName,
        role: log.createdBy.role,
      },
    }));
  }

  async getTrackingLogsByOrderNumber(
    orderNumber: string,
  ): Promise<TrackingLogResponseDto[]> {
    // Find order by order number
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    return this.getTrackingLogsByOrderId(order.id);
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.AWAITING_PAYMENT_PROOF]: [OrderStatus.PENDING],
      [OrderStatus.PENDING]: [OrderStatus.APPROVED, OrderStatus.CANCELLED],
      [OrderStatus.APPROVED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.DELIVERY, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Chuyển trạng thái không hợp lệ từ ${currentStatus} sang ${newStatus}`,
      );
    }
  }
}
