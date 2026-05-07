import { Cache } from 'cache-manager';
import { Address } from 'src/entities/address.entity';
import { DataSource, Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CartItem } from '../entities/cart-item.entity';
import { Cart } from '../entities/cart.entity';
import {
  DeliveryType,
  Order,
  OrderStatus,
  SalesChannel,
} from '../entities/order.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { StandardOrderItem } from '../entities/standard-order-item.entity';
import { User } from '../entities/user.entity';
import {
  AddToCartDto,
  CartProductDto,
  CartVariantDto,
  CheckoutFromCartDto,
  GroupedCartResponseDto,
  RemoveFromCartDto,
  UpdateCartVariantDto,
} from './dto/cart.dto';

@Injectable()
export class CartService {
  private readonly CACHE_KEY = 'cart';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private dataSource: DataSource,
  ) {}

  /**
   * Get cart by user in grouped format (primary method)
   */
  async getCartByUser(userId: number): Promise<GroupedCartResponseDto> {
    const cacheKey = `${this.CACHE_KEY}:grouped:user:${userId}`;

    // Try cache first
    const cached =
      await this.cacheManager.get<GroupedCartResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: [
        'cartItems',
        'cartItems.productVariant',
        'cartItems.productVariant.product',
        'cartItems.productVariant.product.category',
        'cartItems.productVariant.material',
        'cartItems.productVariant.size',
      ],
      order: {
        cartItems: { createdAt: 'DESC' },
      },
    });

    if (!cart) {
      // Return empty cart structure
      const emptyCart: GroupedCartResponseDto = {
        userId,
        cartItems: [],
        totalItems: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Cache empty cart for short time
      await this.cacheManager.set(cacheKey, emptyCart, 300); // 5 minutes
      return emptyCart;
    }

    // Group cart items by product
    const productMap = new Map<number, CartProductDto>();
    let totalItems = 0;
    let totalAmount = 0;

    for (const item of cart.cartItems) {
      const product = item.productVariant.product;
      const productId = product.id;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product: {
            id: product.id,
            name: product.name,
            category: product.category?.name || 'Chưa phân loại',
            thumbnailUrl: product.thumbnailUrl,
          },
          variants: [],
        });
      }

      const cartProduct = productMap.get(productId)!;

      const variant: CartVariantDto = {
        materialId: item.productVariant.material.id,
        materialName: item.productVariant.material.name,
        sizeId: item.productVariant.size.id,
        sizeName: item.productVariant.size.name,
        price: item.productVariant.price.toString(),
        quantity: item.quantity,
        productVariantId: item.productVariant.id,
        sku: item.productVariant.sku,
        stockQuantity: item.productVariant.stockQuantity,
      };

      cartProduct.variants.push(variant);
      totalItems += item.quantity;
      totalAmount += Number(item.productVariant.price) * item.quantity;
    }

    const cartResponse: GroupedCartResponseDto = {
      userId: cart.userId,
      cartItems: Array.from(productMap.values()),
      totalItems,
      totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, cartResponse, this.CACHE_TTL);

    return cartResponse;
  }

  /**
   * Add product variant to cart
   */
  async addToCart(
    addToCartDto: AddToCartDto,
    userId: number,
  ): Promise<GroupedCartResponseDto> {
    const { productVariantId, quantity } = addToCartDto;

    // Validate product variant exists and is available
    const productVariant = await this.productVariantRepository.findOne({
      where: { id: productVariantId, isAvailable: true },
      relations: ['product', 'material', 'size'],
    });
    if (!productVariant) {
      throw new NotFoundException(
        'Phiên bản sản phẩm không tồn tại hoặc không khả dụng',
      );
    }

    // Check stock availability
    if (productVariant.stockQuantity < quantity) {
      throw new BadRequestException(
        `Không đủ tồn kho. Có sẵn: ${productVariant.stockQuantity}, Yêu cầu: ${quantity}`,
      );
    }

    // Get or create cart for user
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['cartItems'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
    }

    // Check if item already exists in cart
    let cartItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productVariantId },
    });
    if (cartItem) {
      // Update existing item
      const newQuantity = cartItem.quantity + quantity;

      // Check total stock availability
      if (productVariant.stockQuantity < newQuantity) {
        throw new BadRequestException(
          `Không đủ tồn kho. Có sẵn: ${productVariant.stockQuantity}, Tổng yêu cầu: ${newQuantity}`,
        );
      }

      cartItem.quantity = newQuantity;
      cartItem.totalPrice = cartItem.unitPrice * newQuantity;
    } else {
      // Create new cart item
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productVariantId,
        quantity,
        unitPrice: productVariant.price,
        totalPrice: productVariant.price * quantity,
      });
    }

    await this.cartItemRepository.save(cartItem);

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return this.getCartByUser(userId);
  }

  /**
   * Update cart item quantity by product variant ID
   */
  async updateCartItem(
    updateCartVariantDto: UpdateCartVariantDto,
    userId: number,
  ): Promise<GroupedCartResponseDto> {
    const { productVariantId, quantity } = updateCartVariantDto;

    // Get user's cart
    const cart = await this.cartRepository.findOne({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Giỏ hàng không tồn tại');
    }

    // Find cart item by product variant ID
    const cartItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productVariantId },
      relations: ['productVariant'],
    });

    if (!cartItem) {
      throw new NotFoundException(
        'Phiên bản sản phẩm không tồn tại trong giỏ hàng',
      );
    }

    // Check stock availability
    if (cartItem.productVariant.stockQuantity < quantity) {
      throw new BadRequestException(
        `Không đủ tồn kho. Có sẵn: ${cartItem.productVariant.stockQuantity}, Yêu cầu: ${quantity}`,
      );
    }

    cartItem.quantity = quantity;
    cartItem.totalPrice = cartItem.unitPrice * quantity;

    await this.cartItemRepository.save(cartItem);

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return this.getCartByUser(userId);
  }

  /**
   * Remove product variant from cart
   */
  async removeFromCart(
    removeFromCartDto: RemoveFromCartDto,
    userId: number,
  ): Promise<GroupedCartResponseDto> {
    const { productVariantId } = removeFromCartDto;

    // Get user's cart
    const cart = await this.cartRepository.findOne({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Giỏ hàng không tồn tại');
    }

    // Find and remove cart item
    const cartItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productVariantId },
    });

    if (!cartItem) {
      throw new NotFoundException(
        'Phiên bản sản phẩm không tồn tại trong giỏ hàng',
      );
    }

    await this.cartItemRepository.remove(cartItem);

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return this.getCartByUser(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['cartItems'],
    });

    if (!cart) {
      return; // No cart to clear
    }

    // Remove all cart items
    if (cart.cartItems.length > 0) {
      await this.cartItemRepository.remove(cart.cartItems);
    }

    // Invalidate cache
    await this.invalidateCartCache(userId);
  }

  /**
   * Legacy method - Remove cart item by cart item ID (for backward compatibility)
   */
  async removeCartItemById(
    cartItemId: number,
    userId: number,
  ): Promise<GroupedCartResponseDto> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException('Sản phẩm trong giỏ hàng không tồn tại');
    }

    // Check if cart belongs to user
    if (cartItem.cart.userId !== userId) {
      throw new BadRequestException(
        'Không thể xóa sản phẩm của người dùng khác',
      );
    }

    await this.cartItemRepository.remove(cartItem);

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return this.getCartByUser(userId);
  }
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const day = new Date().getDate();
    const count = await this.orderRepository.count();
    return `ORD-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }

  async checkoutFromCart(
    checkoutDto: CheckoutFromCartDto,
    userId: number,
  ): Promise<Order> {
    const { notes, deliveryAddressId, deliveryType } = checkoutDto;

    return await this.dataSource.transaction(async (manager) => {
      // Get user's cart with items
      const cart = await manager.findOne(Cart, {
        where: { userId },
        relations: [
          'cartItems',
          'cartItems.productVariant',
          'cartItems.productVariant.product',
        ],
      });

      if (!cart || cart.cartItems.length === 0) {
        throw new BadRequestException('Giỏ hàng trống');
      }

      // Validate delivery address belongs to user
      const deliveryAddress = await manager.findOne(Address, {
        where: { id: deliveryAddressId, userId },
      });

      if (!deliveryAddress) {
        throw new NotFoundException(
          'Địa chỉ giao hàng không tồn tại hoặc không thuộc về người dùng',
        );
      }

      // Calculate total amount and validate availability (but don't check stock yet)
      let totalAmount = 0;
      for (const item of cart.cartItems) {
        if (!item.productVariant.isAvailable) {
          throw new BadRequestException(
            `Phiên bản sản phẩm ${item.productVariant.sku} không khả dụng`,
          );
        }

        totalAmount += Number(item.productVariant.price) * item.quantity;
      }

      const finalAmount =
        totalAmount + (deliveryType == DeliveryType.STANDARD ? 30000 : 50000);

      // Create order with AWAITING_PAYMENT_PROOF status
      const order = manager.create(Order, {
        userId,
        orderNumber: await this.generateOrderNumber(),
        totalAmount,
        discountAmount: 0,
        remainingAmount: finalAmount, // Full amount remaining since no deposit yet
        finalAmount: finalAmount,
        orderStatus: OrderStatus.AWAITING_PAYMENT_PROOF, // Changed from PENDING
        salesChannel: SalesChannel.ONLINE,
        depositAmount: 0, // No deposit provided yet
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

      const savedOrder = await manager.save(order);

      // Create order items but DON'T update inventory yet (will be done after payment upload)
      for (const cartItem of cart.cartItems) {
        // Create order item
        const orderItem = manager.create(StandardOrderItem, {
          orderId: savedOrder.id,
          productVariantId: cartItem.productVariantId,
          quantity: cartItem.quantity,
          unitPrice: cartItem.productVariant.price,
          totalPrice: Number(cartItem.productVariant.price) * cartItem.quantity,
        });

        await manager.save(orderItem);
      }

      // Note: Inventory is NOT updated here - will be done when payment proof is uploaded
      // Clear cart
      await manager.remove(cart.cartItems);

      // Invalidate cache
      await this.invalidateCartCache(userId);

      return savedOrder;
    });
  }

  private async invalidateCartCache(userId: number): Promise<void> {
    const cacheKey = `${this.CACHE_KEY}:grouped:user:${userId}`;
    const legacyCacheKey = `${this.CACHE_KEY}:user:${userId}`;

    await Promise.all([
      this.cacheManager.del(cacheKey),
      this.cacheManager.del(legacyCacheKey),
    ]);
  }
}
