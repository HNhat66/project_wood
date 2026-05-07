import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { ConfigService } from '@nestjs/config';

import { Address } from './entities/address.entity';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { Category } from './entities/category.entity';
import { CustomOrderItem } from './entities/custom-order-item.entity';
import {
  CustomRequest,
  CustomRequestStatus,
} from './entities/custom-request.entity';
import {
  Customer,
  CustomerStatus,
  CustomerType,
} from './entities/customer.entity';
import {
  InventoryTransaction,
  ReferenceType,
  TransactionType,
} from './entities/inventory-transaction.entity';
import { Material } from './entities/material.entity';
import {
  DeliveryType,
  Order,
  OrderStatus,
  SalesChannel,
} from './entities/order.entity';
import { PaymentQRCode, QRCodeStatus } from './entities/payment-qr.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';
import { Size } from './entities/size.entity';
import { StandardOrderItem } from './entities/standard-order-item.entity';
import { User, UserRole, UserStatus } from './entities/user.entity';

// Load JSON data
const categoriesData = require('./init/final_categories_with_id_fields.json');
const productsData = require('./init/products-complete-new.json');
const sizesData = require('./init/sizes.json');
const materialsData = require('./init/materials.json');
const productVariantsData = require('./init/product-variants-new.json');

// NOTE: You must install bcrypt and @types/bcrypt for this script to work:
// npm install bcrypt @types/bcrypt

dotenv.config({ path: '.env' });

const configService = new ConfigService();
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/entities/*.entity.{ts,js}'],
  synchronize: false,
  logging: false,
});

async function seed() {
  await dataSource.initialize();

  console.log('🗄️  Checking JSON data files...');
  console.log(`   📂 Categories: ${categoriesData.length} items`);
  console.log(`   📦 Products: ${productsData.length} items`);
  console.log(`   🏷️  Materials: ${materialsData.length} items`);
  console.log(`   📏 Sizes: ${sizesData.length} items`);
  console.log(`   🎯 Product Variants: ${productVariantsData.length} items`);
  console.log('');

  // Clear all data (order matters due to FKs)
  console.log('🗑️  Clearing existing data...');
  await dataSource.manager.query('SET FOREIGN_KEY_CHECKS = 0');
  await dataSource.manager.clear(InventoryTransaction);
  await dataSource.manager.clear(StandardOrderItem);
  await dataSource.manager.clear(CustomOrderItem);
  await dataSource.manager.clear(Order);
  await dataSource.manager.clear(CustomRequest);
  await dataSource.manager.clear(CartItem);
  await dataSource.manager.clear(Cart);
  await dataSource.manager.clear(Customer);
  await dataSource.manager.clear(ProductVariant);
  await dataSource.manager.clear(Product);
  await dataSource.manager.clear(PaymentQRCode);
  await dataSource.manager.clear(Address);
  await dataSource.manager.clear(Size);
  await dataSource.manager.clear(Material);
  await dataSource.manager.clear(Category);
  await dataSource.manager.clear(User);
  await dataSource.manager.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ Database cleared');
  console.log('');

  // 1. USERS - 7 users total (1 admin, 2 employees, 4 users)
  const admin = dataSource.manager.create(User, {
    email: 'admin@furniturestore.com',
    passwordHash: await bcrypt.hash('password123', 10),
    fullName: 'Nguyễn Văn Admin',
    phone: '0901234567',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    employeeCode: 'ADMIN001',
    hireDate: new Date('2023-01-15'),
  });

  const employee1 = dataSource.manager.create(User, {
    email: 'employee1@furniturestore.com',
    passwordHash: await bcrypt.hash('password123', 10),
    fullName: 'Trần Thị Mai',
    phone: '0912345678',
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    employeeCode: 'EMP001',
    hireDate: new Date('2023-03-20'),
  });

  const employee2 = dataSource.manager.create(User, {
    email: 'employee2@furniturestore.com',
    passwordHash: await bcrypt.hash('password123', 10),
    fullName: 'Lê Văn Đức',
    phone: '0923456789',
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    employeeCode: 'EMP002',
    hireDate: new Date('2023-06-10'),
  });

  // 20 Online users
  const users: User[] = [];
  const userNames = [
    'Phạm Minh Khôi',
    'Võ Thị Lan',
    'Nguyễn Hoàng Nam',
    'Trần Thị Hoa',
    'Lê Văn Đức',
    'Nguyễn Thị Mai',
    'Hoàng Minh Tuấn',
    'Đặng Thị Ngọc',
    'Bùi Văn Hùng',
    'Vũ Thị Linh',
    'Phan Minh Quang',
    'Tôn Thị Hương',
    'Đinh Văn Long',
    'Lý Thị Thảo',
    'Trịnh Minh Đức',
    'Dương Thị Oanh',
    'Ngô Văn Sơn',
    'Lương Thị Kiều',
    'Huỳnh Minh Tân',
    'Cao Thị Bích',
  ];

  const genders = ['male', 'female'];
  const districts = [
    'Quận 1',
    'Quận 3',
    'Quận 5',
    'Quận 7',
    'Quận Bình Thạnh',
    'Quận Tân Bình',
    'Quận Phú Nhuận',
  ];

  for (let i = 0; i < 20; i++) {
    const user = dataSource.manager.create(User, {
      email: `user${i + 1}@gmail.com`,
      passwordHash: await bcrypt.hash('password123', 10),
      fullName: userNames[i],
      phone: `093${String(i + 1).padStart(7, '0')}`,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      address: `${100 + i} Đường ABC, ${districts[i % districts.length]}, TP.HCM`,
      dateOfBirth: new Date(1985 + (i % 15), i % 12, (i % 28) + 1),
      gender: genders[i % 2],
    });
    users.push(user);
  }

  await dataSource.manager.save([admin, employee1, employee2]);
  await dataSource.manager.save(users);

  // 1.1. ADDRESSES - 2-3 addresses for each user (only for role 'user')
  const addresses: Address[] = [];
  const addressTypes = [
    'Nhà riêng',
    'Văn phòng',
    'Nhà bạn',
    'Nhà bà ngoại',
    'Công ty',
  ];
  const streets = [
    'Nguyễn Văn Cừ',
    'Lê Văn Sỹ',
    'Điện Biên Phủ',
    'Hai Bà Trưng',
    'Võ Văn Tần',
    'Pasteur',
    'Nguyễn Du',
  ];
  const wards = [
    'Phường 1',
    'Phường 2',
    'Phường 5',
    'Phường 11',
    'Phường 25',
    'Phường 6',
    'Phường Bến Nghé',
  ];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const numAddresses = 2 + (i % 2); // 2 or 3 addresses per user

    for (let j = 0; j < numAddresses; j++) {
      const address = dataSource.manager.create(Address, {
        userId: user.id,
        name: addressTypes[j % addressTypes.length],
        fullName: user.fullName,
        phone: user.phone,
        address: `${200 + i * 10 + j} ${streets[j % streets.length]}, ${wards[j % wards.length]}, ${districts[i % districts.length]}, TP.HCM`,
        isDefault: j === 0,
      });
      addresses.push(address);
    }
  }

  await dataSource.manager.save(addresses);

  // 2. PAYMENT QR CODES - 2 codes
  const qrCode1 = dataSource.manager.create(PaymentQRCode, {
    qrCodeUrl: 'https://img.vietqr.io/image/970416-1234567890-compact.png',
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'CONG TY TNHH DO GO ABC',
    description: 'QR thanh toán chính cho đơn hàng online',
    status: QRCodeStatus.ACTIVE,
    updatedById: admin.id,
  });

  const qrCode2 = dataSource.manager.create(PaymentQRCode, {
    qrCodeUrl: 'https://img.vietqr.io/image/970415-0987654321-compact.png',
    bankName: 'Techcombank',
    accountNumber: '0987654321',
    accountName: 'CONG TY TNHH DO GO ABC',
    description: 'QR dự phòng',
    status: QRCodeStatus.INACTIVE,
    updatedById: admin.id,
  });

  await dataSource.manager.save([qrCode1, qrCode2]);

  // 3. MATERIALS - From AI-generated JSON data
  console.log(`📋 Loading ${materialsData.length} materials from JSON...`);
  const materials = materialsData.map((materialData) =>
    dataSource.manager.create(Material, {
      name: materialData.name,
      description: materialData.description,
      isActive: materialData.isActive !== false,
    }),
  );

  await dataSource.manager.save(materials);
  console.log(`✅ Saved ${materials.length} materials`);

  // 4. SIZES - From AI-generated JSON data
  console.log(`📋 Loading ${sizesData.length} sizes from JSON...`);
  const sizes = sizesData.map((sizeData) =>
    dataSource.manager.create(Size, {
      name: sizeData.name,
      lengthCm: sizeData.lengthCm,
      widthCm: sizeData.widthCm,
      heightCm: sizeData.heightCm,
      isActive: sizeData.isActive !== false,
    }),
  );

  await dataSource.manager.save(sizes);
  console.log(`✅ Saved ${sizes.length} sizes`);

  // 5. CATEGORIES - Create flat category structure from JSON
  const allCategories: Category[] = [];

  // Helper function to recursively create categories
  const createCategoriesRecursively = (
    categoryArray: any[],
    parentId?: number,
  ) => {
    for (const catData of categoryArray) {
      const category = dataSource.manager.create(Category, {
        id: catData.id,
        name: catData.name,
        description: `Danh mục ${catData.name}`,
        parentId: parentId,
        isActive: true,
        sortOrder: catData.id,
      });

      allCategories.push(category);

      // If has children, create them recursively
      if (catData.children && catData.children.length > 0) {
        createCategoriesRecursively(catData.children, catData.id);
      }
    }
  };

  // Create all categories
  createCategoriesRecursively(categoriesData);

  await dataSource.manager.save(allCategories);

  // 6. PRODUCTS & VARIANTS - From JSON data
  const products: Product[] = [];
  const productVariants: ProductVariant[] = [];

  for (const productData of productsData) {
    const product = dataSource.manager.create(Product, {
      name: productData.name,
      description: productData.description,
      categoryId: productData.categoryId, // Use categoryId directly from JSON
      basePrice: (() => {
        if (typeof productData.basePrice === 'string') {
          const parsed = parseInt(productData.basePrice.replace(/\D/g, '')); // Remove non-digits
          return isNaN(parsed) ? 1000000 : parsed; // Default to 1M if can't parse
        }
        return typeof productData.basePrice === 'number'
          ? productData.basePrice
          : 1000000;
      })(),
      minQuantity: 1,
      thumbnailUrl: productData.thumbnailUrl,
      isActive: true,
    });

    products.push(product);
  }

  await dataSource.manager.save(products);

  // Create product variants from JSON data
  console.log(`📋 Creating product variants from JSON data...`);

  // Map materials and sizes by their names for lookup
  const materialMap = new Map();
  materials.forEach((material) => {
    materialMap.set(material.name, material);
  });

  const sizeMap = new Map();
  sizes.forEach((size) => {
    sizeMap.set(size.name, size);
  });

  for (const variantData of productVariantsData) {
    // Find the corresponding product
    const product = products.find((p) => p.id === variantData.productId);

    // Find material by ID since JSON contains material IDs
    const material = materials.find((m) => m.id === variantData.materialId);

    // Find size by ID since JSON contains size IDs
    const size = sizes.find((s) => s.id === variantData.sizeId);

    if (product && material && size) {
      const variant = dataSource.manager.create(ProductVariant, {
        productId: product.id,
        materialId: material.id,
        sizeId: size.id,
        sku: variantData.sku,
        price: variantData.price,
        stockQuantity: variantData.stockQuantity || 20,
        minStockLevel: variantData.minStockLevel || 5,
        isAvailable: variantData.isAvailable !== false,
      });

      productVariants.push(variant);
    } else {
      console.warn(
        `⚠️  Skipping variant ${variantData.sku}: missing dependencies`,
      );
      if (!product)
        console.warn(`   Product ID ${variantData.productId} not found`);
      if (!material)
        console.warn(`   Material ID ${variantData.materialId} not found`);
      if (!size) console.warn(`   Size ID ${variantData.sizeId} not found`);
    }
  }

  // If no variants were created from JSON, create some fallback variants
  if (productVariants.length === 0) {
    console.log(`📋 No variants from JSON, creating fallback variants...`);

    for (let i = 0; i < Math.min(productsData.length, 10); i++) {
      const product = products[i];

      // Create 2 variants per product with different materials and sizes
      for (let j = 0; j < 2; j++) {
        const materialIndex = (i + j) % materials.length;
        const sizeIndex = (i * 2 + j) % sizes.length;

        const variant = dataSource.manager.create(ProductVariant, {
          productId: product.id,
          materialId: materials[materialIndex].id,
          sizeId: sizes[sizeIndex].id,
          sku: `${product.name
            .substring(0, 3)
            .toUpperCase()
            .replace(
              /[^A-Z]/g,
              '',
            )}-${materials[materialIndex].id}-${sizes[sizeIndex].id}`,
          price: product.basePrice + j * 200000, // Add variation in price
          stockQuantity: 10 + (i % 20),
          minStockLevel: 5,
          isAvailable: true,
        });

        productVariants.push(variant);
      }
    }
  }

  console.log(`✅ Created ${productVariants.length} product variants`);

  await dataSource.manager.save(productVariants);

  // 7. CUSTOMERS - 4 customers
  const customers = [
    dataSource.manager.create(Customer, {
      customerCode: 'MKH0901111111',
      fullName: 'Nguyễn Văn An',
      phone: '0901111111',
      email: 'nguyenvanan@email.com',
      address: '123 Lê Lợi, Quận 1, TP.HCM',
      dateOfBirth: new Date('1985-03-10'),
      gender: 'male',
      customerType: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
      totalOrders: 0,
      totalSpent: 0,
      createdById: employee1.id,
      notes: 'Khách hàng thân thiết',
    }),
    dataSource.manager.create(Customer, {
      customerCode: 'MKH0902222222',
      fullName: 'Trần Thị Bình',
      phone: '0902222222',
      email: 'tranthibinh@email.com',
      address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
      customerType: CustomerType.WHOLESALE,
      status: CustomerStatus.ACTIVE,
      totalOrders: 0,
      totalSpent: 0,
      createdById: employee2.id,
      notes: 'Chủ nhà hàng, đặt số lượng lớn',
    }),
    dataSource.manager.create(Customer, {
      customerCode: 'MKH0903333333',
      fullName: 'Lê Minh Hoàng',
      phone: '0903333333',
      address: '789 Hai Bà Trưng, Quận 3, TP.HCM',
      customerType: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
      totalOrders: 0,
      totalSpent: 0,
      createdById: employee1.id,
    }),
    dataSource.manager.create(Customer, {
      customerCode: 'MKH0904444444',
      fullName: 'Phạm Thị Cẩm',
      phone: '0904444444',
      email: 'phamthicam@email.com',
      address: '159 Pasteur, Quận 3, TP.HCM',
      dateOfBirth: new Date('1990-07-15'),
      gender: 'female',
      customerType: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
      totalOrders: 0,
      totalSpent: 0,
      createdById: employee2.id,
      notes: 'Khách hàng mới',
    }),
  ];

  await dataSource.manager.save(customers);

  // 8. ORDERS - 100 orders distributed across April, May, June 2025
  const orders: Order[] = [];
  const orderStatuses = [
    OrderStatus.COMPLETED,
    OrderStatus.PROCESSING,
    OrderStatus.APPROVED,
    OrderStatus.PENDING,
  ];
  const deliveryTypes = [DeliveryType.STANDARD, DeliveryType.EXPRESS];
  const channels = [SalesChannel.ONLINE, SalesChannel.OFFLINE];

  // Generate 100 orders distributed across months
  const orderDistribution = [
    { month: 4, count: 20, year: 2025 }, // April
    { month: 5, count: 40, year: 2025 }, // May
    { month: 6, count: 40, year: 2025 }, // June
  ];

  let orderCounter = 1;

  for (const monthData of orderDistribution) {
    for (let i = 0; i < monthData.count; i++) {
      const randomDay = Math.floor(Math.random() * 28) + 1; // Day 1-28 to avoid month boundary issues
      const orderDate = new Date(
        monthData.year,
        monthData.month - 1,
        randomDay,
      );

      // Mix of user orders and customer orders
      const isUserOrder = Math.random() > 0.3; // 70% user orders, 30% customer orders
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const status =
        orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const deliveryType =
        deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)];

      // Select random product variants (1-3 items per order)
      const numItems = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const randomVariantIndex = Math.floor(
          Math.random() * productVariants.length,
        );
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
        totalAmount += productVariants[randomVariantIndex].price * quantity;
      }

      const discountRate = Math.random() > 0.7 ? 0.1 : 0; // 30% chance of 10% discount
      const discountAmount = totalAmount * discountRate;
      const finalAmount = totalAmount - discountAmount;

      let depositAmount = 0;
      let remainingAmount = finalAmount;

      // Set deposit based on status
      if (status === OrderStatus.COMPLETED) {
        depositAmount = finalAmount; // Full payment
        remainingAmount = 0;
      } else if (
        status === OrderStatus.PROCESSING ||
        status === OrderStatus.APPROVED
      ) {
        depositAmount = finalAmount * (Math.random() * 0.7 + 0.3); // 30-100% deposit
        remainingAmount = finalAmount - depositAmount;
      } else {
        depositAmount = finalAmount * (Math.random() * 0.5 + 0.2); // 20-70% deposit
        remainingAmount = finalAmount - depositAmount;
      }

      let order;

      if (isUserOrder && users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const userAddress = addresses.find(
          (addr) => addr.userId === randomUser.id && addr.isDefault,
        );

        order = dataSource.manager.create(Order, {
          orderNumber: `ORD-2025-${String(orderCounter).padStart(6, '0')}`,
          userId: randomUser.id,
          totalAmount,
          discountAmount,
          finalAmount,
          depositAmount,
          remainingAmount,
          paymentProof:
            channel === SalesChannel.ONLINE
              ? `https://example.com/payment-proof-${orderCounter}.jpg`
              : undefined,
          orderStatus: status,
          channel,
          deliveryName: randomUser.fullName,
          deliveryPhone: randomUser.phone,
          deliveryAddress: userAddress?.address || randomUser.address,
          deliveryType,
          estimatedDeliveryDays:
            deliveryType === DeliveryType.EXPRESS ? '3-5 ngày' : '7-12 ngày',
          notes: `Đơn hàng ${channel === SalesChannel.ONLINE ? 'online' : 'offline'} tháng ${monthData.month}/2025`,
          createdAt: orderDate,
          updatedAt: orderDate,
        });
      } else {
        const randomCustomer =
          customers[Math.floor(Math.random() * customers.length)];
        const randomEmployee = [employee1, employee2][
          Math.floor(Math.random() * 2)
        ];

        order = dataSource.manager.create(Order, {
          orderNumber: `ORD-2025-${String(orderCounter).padStart(6, '0')}`,
          customerId: randomCustomer.id,
          totalAmount,
          discountAmount,
          finalAmount,
          depositAmount,
          remainingAmount,
          orderStatus: status,
          channel,
          deliveryName: randomCustomer.fullName,
          deliveryPhone: randomCustomer.phone,
          deliveryAddress: randomCustomer.address,
          deliveryType,
          estimatedDeliveryDays:
            deliveryType === DeliveryType.EXPRESS ? '3-5 ngày' : '7-12 ngày',
          notes: `Đơn hàng ${channel === SalesChannel.ONLINE ? 'online' : 'offline'} tháng ${monthData.month}/2025`,
          createdById: randomEmployee.id,
          createdAt: orderDate,
          updatedAt: orderDate,
        });
      }

      orders.push(order);
      orderCounter++;
    }
  }

  await dataSource.manager.save(orders);

  // 9. ORDER ITEMS - Generate items for each order
  const orderItems: StandardOrderItem[] = [];

  for (const order of orders) {
    // Generate 1-3 items per order
    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numItems; i++) {
      const randomVariantIndex = Math.floor(
        Math.random() * productVariants.length,
      );
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
      const variant = productVariants[randomVariantIndex];

      const orderItem = dataSource.manager.create(StandardOrderItem, {
        orderId: order.id,
        productVariantId: variant.id,
        quantity,
        unitPrice: variant.price,
        totalPrice: variant.price * quantity,
        notes: `Item ${i + 1} cho ${order.orderNumber}`,
      });

      orderItems.push(orderItem);
    }
  }

  await dataSource.manager.save(orderItems);

  // 10. INVENTORY TRANSACTIONS
  const inventoryTransactions: InventoryTransaction[] = [];

  // Initial stock for all variants
  for (const variant of productVariants) {
    const product = products.find((p) => p.id === variant.productId);
    inventoryTransactions.push(
      dataSource.manager.create(InventoryTransaction, {
        productVariantId: variant.id,
        transactionType: TransactionType.IN,
        quantity: variant.stockQuantity + 10, // Add extra to initial stock
        reason: `Khởi tạo ${product?.name}`,
        referenceType: ReferenceType.ADJUSTMENT,
        performedById: admin.id,
        transactionDate: new Date('2024-01-01'),
      }),
    );
  }

  // Order-related transactions - Generate for completed orders
  const orderTransactions: InventoryTransaction[] = [];

  for (const order of orders) {
    // Only create inventory transactions for completed and processing orders
    if (
      order.orderStatus === OrderStatus.COMPLETED ||
      order.orderStatus === OrderStatus.PROCESSING
    ) {
      const relatedOrderItems = orderItems.filter(
        (item) => item.orderId === order.id,
      );

      for (const orderItem of relatedOrderItems) {
        const product = products.find((p) => {
          const variant = productVariants.find(
            (v) => v.id === orderItem.productVariantId,
          );
          return variant && p.id === variant.productId;
        });

        const transaction = dataSource.manager.create(InventoryTransaction, {
          productVariantId: orderItem.productVariantId,
          transactionType: TransactionType.OUT,
          quantity: orderItem.quantity,
          reason: `${order.orderNumber} - ${product?.name || 'Unknown Product'}`,
          referenceType: ReferenceType.ORDER,
          referenceId: order.id,
          performedById: order.createdById || admin.id,
          transactionDate: order.createdAt,
        });

        orderTransactions.push(transaction);
      }
    }
  }

  inventoryTransactions.push(...orderTransactions);
  await dataSource.manager.save(inventoryTransactions);

  // 11. CART & CART ITEMS - Add items to user carts
  const cart1 = dataSource.manager.create(Cart, {
    userId: users[2].id,
  });
  await dataSource.manager.save(cart1);

  const cartItems = [
    dataSource.manager.create(CartItem, {
      cartId: cart1.id,
      productVariantId: productVariants[4].id,
      quantity: 1,
      unitPrice: productVariants[4].price,
      totalPrice: productVariants[4].price,
      notes: 'Quan tâm đến sản phẩm này',
    }),
    dataSource.manager.create(CartItem, {
      cartId: cart1.id,
      productVariantId: productVariants[5].id,
      quantity: 2,
      unitPrice: productVariants[5].price,
      totalPrice: productVariants[5].price * 2,
      notes: 'Muốn mua 2 cái',
    }),
  ];

  await dataSource.manager.save(cartItems);

  // 12. CUSTOM REQUESTS
  const customRequests = [
    dataSource.manager.create(CustomRequest, {
      userId: users[0].id,
      productId: products[0]?.id,
      materialId: materials[0].id,
      customWidth: 200,
      customHeight: 90,
      customDepth: 80,
      specialRequirements: 'Cần làm thêm ngăn kéo ở dưới bàn',
      status: CustomRequestStatus.QUOTED,
      quotedPrice: products[0]?.basePrice * 1.3,
      quotedById: admin.id,
      quotedAt: new Date('2024-01-18'),
      estimatedDays: 18,
      adminNotes: 'Giá đã bao gồm ngăn kéo và phí gia công đặc biệt',
    }),
    dataSource.manager.create(CustomRequest, {
      userId: users[1].id,
      productId: products[1]?.id,
      materialId: materials[1].id,
      customWidth: 160,
      customHeight: 85,
      customDepth: 75,
      specialRequirements: 'Cần màu sơn đặc biệt - màu nâu chocolate',
      status: CustomRequestStatus.PENDING,
    }),
  ];

  await dataSource.manager.save(customRequests);

  console.log('✅ Comprehensive seed data inserted successfully!');
  console.log('');
  console.log('📊 USERS & AUTH:');
  console.log('   👤 Admin: admin@furniturestore.com / password123');
  console.log('   👤 Employee 1: employee1@furniturestore.com / password123');
  console.log('   👤 Employee 2: employee2@furniturestore.com / password123');
  console.log(
    `   👥 ${users.length} online users: user1@gmail.com to user${users.length}@gmail.com / password123`,
  );
  console.log(
    `   📮 ${addresses.length} addresses: 2-3 for each user (with defaults)`,
  );
  console.log('');
  console.log('🛒 BUSINESS DATA:');
  console.log(`   🏷️ ${materials.length} materials from AI-generated JSON`);
  console.log(`   📏 ${sizes.length} sizes from AI-generated JSON`);
  console.log(
    `   📂 ${allCategories.length} categories (hierarchical structure)`,
  );
  console.log(`   📦 ${productsData.length} products with AI descriptions`);
  console.log(
    `   🎯 ${productVariants.length} product variants from AI-generated data`,
  );
  console.log('   🏪 4 customers');
  console.log('   📱 2 Payment QR codes');
  console.log('');
  console.log('🛒 ORDERS & INVENTORY:');
  console.log(
    `   📦 ${orders.length} orders distributed across April-June 2025:`,
  );
  console.log('      - 20 orders in April 2025');
  console.log('      - 40 orders in May 2025');
  console.log('      - 40 orders in June 2025');
  console.log(`   📄 ${orderItems.length} order items generated`);
  console.log('   📊 Initial inventory transactions for all variants');
  console.log(
    `   📈 ${orderTransactions.length} order-based inventory movements`,
  );
  console.log('   🛒 1 cart with 2 items');
  console.log('   🔧 2 custom requests');

  await dataSource.destroy();
}

