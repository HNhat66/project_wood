import { Address } from 'src/entities/address.entity';
import {
  InventoryTransaction,
  ReferenceType,
  TransactionType,
} from 'src/entities/inventory-transaction.entity';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from '../common/dto/pagination.dto';
import { CustomOrderItem } from '../entities/custom-order-item.entity';
import {
  CustomRequest,
  CustomRequestStatus,
} from '../entities/custom-request.entity';
import { Customer } from '../entities/customer.entity';
import { Material } from '../entities/material.entity';
import {
  DeliveryType,
  Order,
  OrderStatus,
  SalesChannel,
} from '../entities/order.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Product } from '../entities/product.entity';
import { StandardOrderItem } from '../entities/standard-order-item.entity';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import {
  CreateOrderForOfflineDto,
  CreateOrderForOnlineDto,
  OrderResponseDto,
  UpdatePaymentDto,
  UploadPaymentProofDto,
} from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // USER ENDPOINTS (Online Orders)

  async createOnlineOrder(
    createDto: CreateOrderForOnlineDto,
    userId: number,
  ): Promise<OrderResponseDto> {
    const { notes, deliveryAddressId, deliveryType, customItems } = createDto;

    return await this.dataSource.transaction(async (manager) => {
      // Check if delivery address exists
      const deliveryAddress = await manager.findOne(Address, {
        where: { id: deliveryAddressId },
      });
      if (!deliveryAddress) {
        throw new NotFoundException(
          `Địa chỉ giao hàng ${deliveryAddressId} không tồn tại`,
        );
      }

      // If custom items is provided, verify custom request is quoted
      if (customItems && customItems.length > 0) {
        // For each custom item, verify custom request is quoted
        for (const customItem of customItems) {
          const customRequest = await manager.findOne(CustomRequest, {
            where: {
              id: customItem.customRequestId,
              status: CustomRequestStatus.QUOTED,
            },
          });
          if (!customRequest) {
            throw new NotFoundException(
              `Yêu cầu tùy chỉnh ${customItem.customRequestId} không tồn tại hoặc chưa được báo giá`,
            );
          }
        }
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Calculate total amount
      let totalAmount = 0;
      for (const customItem of customItems) {
        totalAmount += customItem.unitPrice * customItem.quantity;
      }

      const deliveryFee = deliveryType == DeliveryType.STANDARD ? 30000 : 50000;
      const finalAmount = totalAmount + deliveryFee;

      // Create order in AWAITING_PAYMENT_PROOF status
      const order = manager.create(Order, {
        userId,
        orderNumber,
        totalAmount,
        discountAmount: 0,
        remainingAmount: finalAmount, // Initially, remaining amount is the full amount
        finalAmount,
        orderStatus: OrderStatus.AWAITING_PAYMENT_PROOF, // Changed from PENDING
        channel: SalesChannel.ONLINE,
        depositAmount: 0, // Initially 0, will be set when payment proof is uploaded
        notes,
        deliveryAddressId,
        deliveryType:
          deliveryType == DeliveryType.STANDARD
            ? DeliveryType.STANDARD
            : DeliveryType.EXPRESS,
        deliveryAddress: deliveryAddress.address,
        deliveryName: deliveryAddress.fullName,
        deliveryPhone: deliveryAddress.phone,
      });

      const savedOrder = await this.orderRepository.save(order);

      // Create custom order items
      const customOrderItems: CustomOrderItem[] = [];
      for (const customItem of customItems) {
        const customOrderItem = manager.create(CustomOrderItem, {
          orderId: savedOrder.id,
          customRequestId: customItem.customRequestId,
          quantity: customItem.quantity,
          unitPrice: customItem.unitPrice,
          totalPrice: customItem.unitPrice * customItem.quantity,
          estimatedDays: customItem.estimatedDays,
          materialId: customItem.materialId,
          productId: customItem.productId,
          customWidth: customItem.customWidth,
          customHeight: customItem.customHeight,
          customDepth: customItem.customDepth,
          specialRequirements: customItem.specialRequirements,
        });
        customOrderItems.push(customOrderItem);
        await manager.save(customOrderItem);
      }

      return {
        ...savedOrder,
        items: customOrderItems.map((item) => ({
          id: item.id,
          type: 'custom' as const,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          productId: item.productId,
          customWidth: Number(item.customWidth),
          customHeight: Number(item.customHeight),
          customDepth: Number(item.customDepth),
          materialId: item.materialId,
          specialRequirements: item.specialRequirements,
          estimatedDays: item.estimatedDays,
        })),
      };
    });
  }

  async findAllByUser(
    userId: number,
    queryDto: PaginationDto & { status?: OrderStatus },
  ) {
    const { page = 1, limit = 10, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customOrderItems', 'customOrderItems')
      .leftJoinAndSelect('order.standardOrderItems', 'standardOrderItems')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.orderStatus = :status', { status });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((order) => ({
        ...order,
        totalItems:
          order.customOrderItems.length + order.standardOrderItems.length,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ADMIN ENDPOINTS

  async createOfflineOrder(
    createDto: CreateOrderForOfflineDto,
    createdById: number,
  ) {
    // Verify employee user exists
    const employee = await this.userRepository.findOne({
      where: { id: createdById, status: UserStatus.ACTIVE },
    });
    if (
      !employee ||
      ![UserRole.ADMIN, UserRole.EMPLOYEE].includes(employee.role)
    ) {
      throw new NotFoundException(
        'Người dùng nhân viên không tồn tại hoặc quyền hạn không đủ',
      );
    }

    // Validate that at least one type of item is provided
    if (
      (!createDto.standardItems || createDto.standardItems.length === 0) &&
      (!createDto.customItems || createDto.customItems.length === 0)
    ) {
      throw new BadRequestException(
        'Ít nhất một sản phẩm tiêu chuẩn hoặc tùy chỉnh phải được cung cấp',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      // Find or create customer based on phone number
      let customer = await manager.findOne(Customer, {
        where: { phone: createDto.customerPhone },
      });

      let customerId: number;
      if (customer) {
        // Update existing customer info if needed
        if (
          customer.fullName !== createDto.customerName ||
          customer.email !== createDto.customerEmail
        ) {
          await manager.update(Customer, customer.id, {
            fullName: createDto.customerName,
            email: createDto.customerEmail || customer.email,
          });
        }
        customerId = customer.id;
      } else {
        // Create new customer
        const customerCode = `MKH${createDto.customerPhone}`;
        const newCustomer = manager.create(Customer, {
          customerCode,
          fullName: createDto.customerName,
          phone: createDto.customerPhone,
          email: createDto.customerEmail,
          createdById: createdById,
        });
        const savedCustomer = await manager.save(newCustomer);
        customerId = savedCustomer.id;
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const order = manager.create(Order, {
        orderNumber,
        userId: undefined,
        customerId: customerId,
        channel: SalesChannel.OFFLINE,
        orderStatus: OrderStatus.PENDING,
        deliveryName: createDto.customerName,
        deliveryPhone: createDto.customerPhone,
        deliveryAddress: createDto.deliveryAddress,
        deliveryType: createDto.deliveryType,
        estimatedDeliveryDays: createDto.estimatedDeliveryDays,
        discountAmount: 0,
        depositAmount: createDto.depositAmount || 0,
        paymentProof: createDto.paymentProof,
        notes: createDto.notes,
        createdById,
        totalAmount: 0,
        finalAmount: 0,
        remainingAmount: 0,
      });
      const savedOrder = await manager.save(order);

      // Process items
      let totalAmount = 0;
      const inventoryTransactions: InventoryTransaction[] = [];
      const standardOrderItems: StandardOrderItem[] = [];
      const customOrderItems: CustomOrderItem[] = [];
      const stockUpdates: Array<{ id: number; newStock: number }> = [];

      // OPTIMIZATION 1: Batch load all product variants for standard items
      if (createDto.standardItems && createDto.standardItems.length > 0) {
        const variantIds = createDto.standardItems.map(
          (item) => item.productVariantId,
        );
        const productVariants = await manager.find(ProductVariant, {
          where: {
            id: In(variantIds),
            isAvailable: true,
          },
        });

        // Create a map for O(1) lookup
        const variantMap = new Map(productVariants.map((v) => [v.id, v]));

        // Validate all variants exist and have sufficient stock
        for (const standardItem of createDto.standardItems) {
          const productVariant = variantMap.get(standardItem.productVariantId);

          if (!productVariant) {
            throw new NotFoundException(
              `Biến thể sản phẩm ${standardItem.productVariantId} không tồn tại hoặc không khả dụng`,
            );
          }

          // Check stock availability
          if (productVariant.stockQuantity < standardItem.quantity) {
            throw new BadRequestException(
              `Không đủ hàng trong kho cho biến thể sản phẩm ${productVariant.sku}. Còn lại: ${productVariant.stockQuantity}, Yêu cầu: ${standardItem.quantity}`,
            );
          }

          const unitPrice = productVariant.price;
          const totalPrice = unitPrice * standardItem.quantity;
          totalAmount += totalPrice;

          // Prepare order item for batch insert
          const orderItem = manager.create(StandardOrderItem, {
            orderId: savedOrder.id,
            productVariantId: standardItem.productVariantId,
            quantity: standardItem.quantity,
            unitPrice,
            totalPrice,
          });
          standardOrderItems.push(orderItem);

          // Prepare inventory transaction for batch insert
          const inventoryTransaction = manager.create(InventoryTransaction, {
            productVariantId: standardItem.productVariantId,
            transactionType: TransactionType.OUT,
            quantity: standardItem.quantity,
            referenceType: ReferenceType.ORDER,
            referenceId: savedOrder.id,
            performedById: createdById,
            transactionDate: new Date(),
            reason: `Order ${savedOrder.orderNumber} - Standard item ${standardItem.productVariantId}`,
          });
          inventoryTransactions.push(inventoryTransaction);

          // Prepare stock update for batch operation
          stockUpdates.push({
            id: standardItem.productVariantId,
            newStock: productVariant.stockQuantity - standardItem.quantity,
          });
        }
      }

      // OPTIMIZATION 2: Batch load all products and materials for custom items
      if (createDto.customItems && createDto.customItems.length > 0) {
        const productIds = [
          ...new Set(createDto.customItems.map((item) => item.productId)),
        ];
        const materialIds = [
          ...new Set(createDto.customItems.map((item) => item.materialId)),
        ];

        const [products, materials] = await Promise.all([
          manager.find(Product, {
            where: { id: In(productIds), isActive: true },
          }),
          manager.find(Material, {
            where: { id: In(materialIds), isActive: true },
          }),
        ]);

        // Create maps for O(1) lookup
        const productMap = new Map(products.map((p) => [p.id, p]));
        const materialMap = new Map(materials.map((m) => [m.id, m]));

        // Validate and prepare custom order items
        for (const customItem of createDto.customItems) {
          const product = productMap.get(customItem.productId);
          if (!product) {
            throw new NotFoundException(
              `Sản phẩm ${customItem.productId} không tồn tại hoặc không hoạt động`,
            );
          }

          const material = materialMap.get(customItem.materialId);
          if (!material) {
            throw new NotFoundException(
              `Vật liệu ${customItem.materialId} không tồn tại hoặc không hoạt động`,
            );
          }

          const totalPrice = customItem.unitPrice * customItem.quantity;
          totalAmount += totalPrice;

          // Prepare custom order item for batch insert
          const orderItem = manager.create(CustomOrderItem, {
            orderId: savedOrder.id,
            productId: customItem.productId,
            customWidth: customItem.customWidth,
            customHeight: customItem.customHeight,
            customDepth: customItem.customDepth,
            materialId: customItem.materialId,
            quantity: customItem.quantity,
            unitPrice: customItem.unitPrice,
            totalPrice,
            specialRequirements: customItem.specialRequirements,
            estimatedDays: customItem.estimatedDays,
          });
          customOrderItems.push(orderItem);
        }
      }

      // OPTIMIZATION 3: Batch insert all order items
      const batchInsertPromises: Promise<any>[] = [];

      if (standardOrderItems.length > 0) {
        batchInsertPromises.push(
          manager.insert(StandardOrderItem, standardOrderItems),
        );
      }

      if (customOrderItems.length > 0) {
        batchInsertPromises.push(
          manager.insert(CustomOrderItem, customOrderItems),
        );
      }

      if (inventoryTransactions.length > 0) {
        batchInsertPromises.push(
          manager.insert(InventoryTransaction, inventoryTransactions),
        );
      }

      // Execute all batch inserts in parallel
      await Promise.all(batchInsertPromises);

      // OPTIMIZATION 4: Batch update stock quantities using raw SQL for better performance
      if (stockUpdates.length > 0) {
        const updateCases = stockUpdates
          .map((update) => `WHEN id = ${update.id} THEN ${update.newStock}`)
          .join(' ');

        const ids = stockUpdates.map((update) => update.id).join(',');

        await manager.query(`
          UPDATE product_variants 
          SET stock_quantity = CASE ${updateCases} END 
          WHERE id IN (${ids})
        `);
      }

      // Update order totals
      const finalAmount = totalAmount - order.discountAmount;
      const remainingAmount = finalAmount - order.depositAmount;
      const updatedOrder = await manager.save(Order, {
        ...savedOrder,
        totalAmount,
        finalAmount,
        remainingAmount,
      });

      return {
        ...updatedOrder,
      };
    });
  }

  async findAllForAdmin(
    queryDto: PaginationDto & {
      channel?: SalesChannel;
      status?: OrderStatus;
      userId?: number;
      customerId?: number;
      search?: string;
    },
  ) {
    const {
      page = 1,
      limit = 20,
      channel,
      status,
      userId,
      customerId,
      search,
    } = queryDto;
    const skip = (page - 1) * limit;
    // with join user ignore user.password
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.createdByUser', 'createdByUser')
      .leftJoinAndSelect('order.trackingLogs', 'trackingLogs')
      .leftJoinAndSelect('trackingLogs.createdBy', 'createdBy')
      .leftJoinAndSelect('order.standardOrderItems', 'standardOrderItems')
      .leftJoinAndSelect('order.customOrderItems', 'customOrderItems')
      .orderBy('order.createdAt', 'DESC');

    if (channel) {
      queryBuilder.andWhere('order.channel = :channel', { channel });
    }

    if (status) {
      queryBuilder.andWhere('order.orderStatus = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId });
    }

    if (customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId });
    }

    if (search) {
      // search by order number, user name, or customer name
      queryBuilder.andWhere('order.orderNumber LIKE :search', {
        search: `%${search}%`,
      });
      queryBuilder.orWhere('user.fullName LIKE :search', {
        search: `%${search}%`,
      });
      queryBuilder.orWhere('customer.fullName LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    return {
      data: data.map((item) => ({
        ...item,
        totalItems:
          item.standardOrderItems.length + item.customOrderItems.length,
        user: item?.user
          ? {
              id: item.user.id,
              fullName: item.user.fullName,
              email: item.user.email,
              phone: item.user.phone,
            }
          : null,
        trackingLogs: item?.trackingLogs
          ? item.trackingLogs.map((log) => ({
              id: log.id,
              message: log.message,
              createdAt: log.createdAt,
              createdBy: {
                id: log.createdBy.id,
                fullName: log.createdBy.fullName,
                role: log.createdBy.role.toString(),
              },
            }))
          : [],
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    orderNumber: string,
    userId?: number,
  ): Promise<OrderResponseDto> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.createdByUser', 'createdByUser')
      .leftJoinAndSelect('order.standardOrderItems', 'standardItems')
      .leftJoinAndSelect('standardItems.productVariant', 'productVariant')
      .leftJoinAndSelect('productVariant.product', 'standardProduct')
      .leftJoinAndSelect('productVariant.material', 'standardMaterial')
      .leftJoinAndSelect('productVariant.size', 'standardSize')
      .leftJoinAndSelect('order.customOrderItems', 'customItems')
      .leftJoinAndSelect('customItems.product', 'customProduct')
      .leftJoinAndSelect('customItems.material', 'customMaterial')
      .leftJoinAndSelect('customItems.customRequest', 'customRequest')
      .leftJoinAndSelect('order.trackingLogs', 'trackingLogs')
      .leftJoinAndSelect('trackingLogs.createdBy', 'trackingCreatedBy')
      .leftJoinAndSelect('order.cancelByUser', 'cancelByUser')
      .where('order.orderNumber = :orderNumber', { orderNumber });

    // If userId is provided, ensure user can only access their own orders
    if (userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId });
    }

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Format response
    const items = [
      ...order.standardOrderItems.map((item) => ({
        id: item.id,
        type: 'standard' as const,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        notes: item.notes,
        productVariantId: item.productVariantId,
        productVariant: {
          sku: item.productVariant.sku,
          product: { name: item.productVariant.product.name },
          material: { name: item.productVariant.material.name },
          size: { name: item.productVariant.size.name },
        },
      })),
      ...order.customOrderItems.map((item) => ({
        id: item.id,
        type: 'custom' as const,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        productId: item.productId,
        customWidth: Number(item.customWidth),
        customHeight: Number(item.customHeight),
        customDepth: Number(item.customDepth),
        materialId: item.materialId,
        specialRequirements: item.specialRequirements,
        estimatedDays: item.estimatedDays,
        product: { name: item.product.name },
        material: { name: item.material.name },
        customRequest: item.customRequest
          ? { id: item.customRequest.id }
          : null,
      })),
    ];

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerId: order.customerId,
      channel: order.channel,
      orderStatus: order.orderStatus,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      finalAmount: Number(order.finalAmount),
      depositAmount: Number(order.depositAmount),
      remainingAmount: Number(order.remainingAmount),
      deliveryName: order.deliveryName,
      deliveryPhone: order.deliveryPhone,
      deliveryAddress: order.deliveryAddress,
      deliveryType: order.deliveryType,
      estimatedDeliveryDays: order.estimatedDeliveryDays,
      reasonCancel: order.reasonCancel,
      cancelAt: order.cancelAt,
      cancelById: order.cancelById,
      paymentProof: order.paymentProof,
      notes: order.notes,
      createdById: order.createdById,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user
        ? {
            id: order.user.id,
            fullName: order.user.fullName,
            email: order.user.email,
          }
        : null,
      customer: order.customer
        ? {
            id: order.customer.id,
            fullName: order.customer.fullName,
            phone: order.customer.phone,
          }
        : null,
      createdByUser: order.createdByUser
        ? {
            id: order.createdByUser.id,
            fullName: order.createdByUser.fullName,
            role: order.createdByUser.role,
          }
        : null,
      cancelByUser: order.cancelByUser
        ? {
            id: order.cancelByUser.id,
            fullName: order.cancelByUser.fullName,
            role: order.cancelByUser.role,
          }
        : {
            id: null,
            fullName: null,
            role: null,
          },
      items,
      trackingLogs: order.trackingLogs
        ? order.trackingLogs
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((log) => ({
              id: log.id,
              message: log.message,
              createdAt: log.createdAt,
              createdBy: {
                id: log.createdBy.id,
                fullName: log.createdBy.fullName,
                role: log.createdBy.role,
              },
            }))
        : [],
    };
  }

  async cancelOrder(id: number, userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const order = await manager.findOne(Order, {
          where: { id, userId },
          relations: ['standardOrderItems'],
        });

        if (!order) {
          throw new NotFoundException('Đơn hàng không tồn tại');
        }

        if (order.orderStatus === OrderStatus.CANCELLED) {
          throw new BadRequestException('Đơn hàng đã bị hủy');
        }

        await this.restoreStockForCancelledOrder(manager, order, userId);

        await manager.update(Order, id, {
          orderStatus: OrderStatus.CANCELLED,
        });

        // Return the updated order data
        return {
          ...order,
          orderStatus: OrderStatus.CANCELLED,
        };
      } catch (error) {
        throw error;
      }
    });
  }

  async uploadPaymentProof(
    orderNumber: string,
    uploadDto: UploadPaymentProofDto,
    userId: number,
  ): Promise<OrderResponseDto> {
    // First find the order and check its status
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['standardOrderItems', 'standardOrderItems.productVariant'],
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Check if order is in AWAITING_PAYMENT_PROOF status
    if (order.orderStatus !== OrderStatus.AWAITING_PAYMENT_PROOF) {
      throw new BadRequestException(
        'Đơn hàng không ở trạng thái chờ thanh toán',
      );
    }

    // Validate deposit amount (should be 30-100% of total)
    const minDeposit = Number(order.totalAmount) * 0.3;
    const maxDeposit = Number(order.totalAmount);

    if (
      uploadDto.depositAmount < minDeposit ||
      uploadDto.depositAmount > maxDeposit
    ) {
      throw new BadRequestException(
        `Số tiền đặt cọc phải nằm trong khoảng ${minDeposit.toLocaleString()} và ${maxDeposit.toLocaleString()} VND`,
      );
    }

    // Check stock availability before starting transaction
    let hasInsufficientStock = false;
    let insufficientStockSku = '';

    for (const orderItem of order.standardOrderItems) {
      if (orderItem.productVariant.stockQuantity < orderItem.quantity) {
        hasInsufficientStock = true;
        insufficientStockSku = orderItem.productVariant.sku;
        break;
      }
    }

    // If stock is insufficient, update order status and throw error
    if (hasInsufficientStock) {
      await this.orderRepository.update(order.id, {
        orderStatus: OrderStatus.CANCELLED,
        reasonCancel: `Đơn hàng không đủ hàng trong kho, vui lòng liên hệ SĐT 0123456789 để được hỗ trợ.`,
        cancelAt: new Date(),
      });

      throw new BadRequestException(
        `Không đủ tồn kho cho sản phẩm ${insufficientStockSku}. Đơn hàng đã được hủy. Vui lòng liên hệ SĐT 0123456789 để được hỗ trợ.`,
      );
    }

    // If stock is available, proceed with the transaction
    return await this.dataSource.transaction(async (manager) => {
      // Update inventory - deduct stock
      const inventoryTransactions: InventoryTransaction[] = [];

      for (const orderItem of order.standardOrderItems) {
        // Update product variant stock
        const productVariant = orderItem.productVariant;
        productVariant.stockQuantity -= orderItem.quantity;
        await manager.save(productVariant);

        // Create inventory transaction
        inventoryTransactions.push(
          manager.create(InventoryTransaction, {
            productVariantId: orderItem.productVariantId,
            quantity: orderItem.quantity,
            transactionType: TransactionType.OUT,
            reason: `Đơn hàng ${order.orderNumber} - Thanh toán đã xác nhận`,
            notes: `Đơn hàng ${order.orderNumber} - Thanh toán đã xác nhận`,
            referenceType: ReferenceType.ORDER,
            referenceId: order.id,
            performedById: userId,
            transactionDate: new Date(),
          }),
        );
      }

      // Bulk insert inventory transactions
      if (inventoryTransactions.length > 0) {
        await manager.insert(InventoryTransaction, inventoryTransactions);
      }

      // Update order with payment proof and change status to PENDING
      const finalAmount = Number(order.finalAmount);
      await manager.update(Order, order.id, {
        depositAmount: uploadDto.depositAmount,
        remainingAmount: finalAmount - uploadDto.depositAmount,
        paymentProof: uploadDto.paymentProof,
        orderStatus: OrderStatus.PENDING,
        notes: uploadDto.notes
          ? order.notes
            ? `${order.notes}\n${uploadDto.notes}`
            : uploadDto.notes
          : order.notes,
      });

      // Return updated order using existing orderNumber
      return this.findOne(order.orderNumber, userId);
    });
  }

  /**
   * Optimized stock restoration for cancelled orders
   * Uses batch operations and proper transaction management
   */
  async restoreStockForCancelledOrder(
    manager: EntityManager,
    order: Order,
    performedById: number,
  ) {
    if (!order.standardOrderItems || order.standardOrderItems.length === 0) {
      return; // No standard items to restore
    }

    // Batch load all affected product variants
    const variantIds = order.standardOrderItems.map(
      (item) => item.productVariantId,
    );

    const productVariants = await manager.find(ProductVariant, {
      where: { id: In(variantIds) },
    });

    // Create lookup map for O(1) access
    const variantMap = new Map(productVariants.map((v) => [v.id, v]));

    const inventoryTransactions: InventoryTransaction[] = [];
    const stockUpdates: Array<{
      id: number;
      newStock: number;
      oldStock: number;
      quantity: number;
    }> = [];

    // Prepare batch operations
    for (const orderItem of order.standardOrderItems) {
      const productVariant = variantMap.get(orderItem.productVariantId);
      if (!productVariant) {
        continue; // Skip if variant not found
      }

      // Prepare inventory transaction
      inventoryTransactions.push(
        manager.create(InventoryTransaction, {
          productVariantId: productVariant.id,
          transactionType: TransactionType.IN,
          quantity: orderItem.quantity,
          transactionDate: new Date(),
          referenceType: ReferenceType.RETURN,
          referenceId: order.id,
          performedById,
          reason: `Order ${order.orderNumber} cancelled - Standard item ${productVariant.id}`,
        }),
      );

      // Prepare stock update
      const newStock = productVariant.stockQuantity + orderItem.quantity;
      stockUpdates.push({
        id: productVariant.id,
        newStock,
        oldStock: productVariant.stockQuantity,
        quantity: orderItem.quantity,
      });
    }

    // Execute batch operations in parallel
    const batchPromises: Promise<any>[] = [];

    if (inventoryTransactions.length > 0) {
      batchPromises.push(
        manager.insert(InventoryTransaction, inventoryTransactions),
      );
    }

    if (stockUpdates.length > 0) {
      // Use raw SQL for efficient batch stock updates
      const updateCases = stockUpdates
        .map((update) => `WHEN id = ${update.id} THEN ${update.newStock}`)
        .join(' ');

      const ids = stockUpdates.map((update) => update.id).join(',');

      const sqlQuery = `
        UPDATE product_variants 
        SET stock_quantity = CASE ${updateCases} END 
        WHERE id IN (${ids})
      `;

      batchPromises.push(manager.query(sqlQuery));
    }

    try {
      await Promise.all(batchPromises);
    } catch (error) {
      throw error;
    }
  }

  async updatePayment(id: number, updateDto: UpdatePaymentDto) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    const newDepositAmount =
      Number(order.depositAmount) + updateDto.paymentAmount;
    const remainingAmount = Number(order.finalAmount) - newDepositAmount;

    await this.orderRepository.update(id, {
      depositAmount: newDepositAmount,
      remainingAmount,
      paymentProof: updateDto.paymentProof || order.paymentProof,
      notes: updateDto.notes
        ? `${order.notes || ''}\n${updateDto.notes}`.trim()
        : order.notes,
    });

    return {
      ...order,
      depositAmount: newDepositAmount,
      remainingAmount,
      paymentProof: updateDto.paymentProof || order.paymentProof,
      notes: updateDto.notes
        ? `${order.notes || ''}\n${updateDto.notes}`.trim()
        : order.notes,
    };
  }

  // DEBUG METHODS (Remove in production)

  // UTILITY METHODS

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.orderRepository.count();
    return `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async fineOrderByCondition(condition: FindOptionsWhere<Order>) {
    return this.orderRepository.findOne({
      where: condition,
    });
  }
}
