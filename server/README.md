# Wood Furniture Store Management System

A comprehensive backend system for managing Vietnamese wood furniture stores, built with NestJS, TypeORM, MySQL, and Redis.

## 🎯 Project Overview

This system is designed for small to medium-sized wood furniture stores in Vietnam to replace manual management processes with automated business workflows. It focuses on internal management and in-store sales support (no online sales functionality).

## 🏗️ System Architecture

### Technology Stack
- **Backend Framework**: NestJS (TypeScript)
- **Database**: MySQL 8.0+
- **ORM**: TypeORM
- **Cache**: Redis (1-hour TTL)
- **Authentication**: JWT + Role-based guards
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

### Database Schema (11 Tables)

1. **users** - User management with admin/employee roles
2. **categories** - Hierarchical product categories
3. **materials** - Wood materials with price multipliers
4. **sizes** - Standard and custom furniture sizes
5. **products** - Base product information
6. **product_variants** - Product variations (material + size combinations)
7. **customers** - Customer information (retail/wholesale)
8. **orders** - Sales orders with order items
9. **order_items** - Individual order line items
10. **custom_orders** - Custom furniture orders
11. **inventory_transactions** - Stock movement history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

### Installation

1. **Clone and install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=furniture_store
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   
   # App
   PORT=3000
   NODE_ENV=development
   ```

3. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE furniture_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # Run migrations (TypeORM will auto-create tables)
   npm run start:dev
   ```

4. **Start the Application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

### Access Swagger Documentation
- **URL**: `http://localhost:3000/api/docs`
- **Local Development**: Available immediately after starting the server

### Authentication Flow

1. **Register Admin User**
   ```bash
   POST /auth/register
   {
     "email": "admin@example.com",
     "password": "admin123",
     "fullName": "System Admin",
     "role": "admin"
   }
   ```

2. **Login**
   ```bash
   POST /auth/login
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```

3. **Use JWT Token**
   ```bash
   Authorization: Bearer <your-jwt-token>
   ```

## 🔧 Core Modules

### 1. Authentication & Authorization
- **Endpoints**: `/auth/*`
- **Features**: JWT authentication, role-based access control
- **Roles**: Admin (full access), Employee (limited access)

### 2. Categories Management
- **Endpoints**: `/categories/*`
- **Features**: 
  - Hierarchical category support
  - Redis caching
  - Tree structure building
  - Admin-only CRUD operations

### 3. Materials Management
- **Endpoints**: `/materials/*`
- **Features**:
  - Wood material management
  - Price multiplier calculations
  - Active/inactive filtering
  - Conflict prevention for materials with variants

### 4. Sizes Management
- **Endpoints**: `/sizes/*`
- **Features**:
  - Standard and custom size management
  - Dimension tracking (L×W×H)
  - Standard/active filtering
  - Cache invalidation patterns

### 5. Products Management
- **Endpoints**: `/products/*`
- **Features**:
  - Product management with pagination and search
  - Category relationships
  - Variant counting
  - Toggle status functionality

### 6. Product Variants Management
- **Endpoints**: `/product-variants/*`
- **Features**:
  - Material + Size combinations
  - Stock quantity management
  - SKU generation and validation
  - Low stock alerts
  - Inventory adjustment with transaction logging

### 7. Customers Management
- **Endpoints**: `/customers/*`
- **Features**:
  - Customer management (retail/wholesale)
  - Search functionality (name, phone, email)
  - Order history tracking
  - Statistics updating (total orders/spent)

### 8. Cart Management
- **Endpoints**: `/cart/*`
- **Features**:
  - Add/remove items from shopping cart
  - Update cart item quantities
  - Get cart by customer with full details
  - Clear entire cart
  - Create order from cart items (checkout)
  - Real-time stock validation
  - Redis caching for cart data

### 9. Custom Requests Management
- **Endpoints**: `/custom-requests/*`
- **Features**:
  - Customer custom furniture requests with specific dimensions
  - Material selection from available options
  - Status workflow: Pending → Quoted → Approved → In Progress → Completed
  - Admin-only pricing and quotation
  - Customer approval/cancellation system
  - Delivery date management
  - Complete audit trail
  - Filtered views (pending, quoted, by customer)

### 10. Orders Management
- **Endpoints**: `/orders/*`
- **Features**:
  - Complete order processing
  - Inventory auto-adjustment
  - Payment tracking
  - Order status management
  - Customer statistics updates

### 11. Dashboard & Analytics
- **Endpoints**: `/dashboard/*`
- **Features**:
  - Real-time business statistics
  - Recent activity monitoring
  - Sales analytics
  - Low stock alerts
  - Top products and customers

## 📊 Key Features

### Redis Caching Strategy
- **Pattern**: `{module}:{action}:{params}`
- **TTL**: 3600 seconds (1 hour)
- **Auto-invalidation**: On CRUD operations
- **Cached Data**: Product lists, variants, categories, cart data

### Cart Management
- **Real-time tracking**: Stock levels automatically updated
- **Cart persistence**: Cart items saved per customer
- **Stock validation**: Prevents overselling
- **Checkout process**: Seamless cart-to-order conversion
- **Cache optimization**: Fast cart retrieval and updates

### Shopping Workflow
1. **Browse Products**: View products with variants, materials, sizes
2. **Add to Cart**: Select product variants and quantities
3. **Manage Cart**: Update quantities, remove items, add notes
4. **Checkout**: Convert cart to order with payment details
5. **Order Processing**: Automatic inventory updates and transaction logging

### Custom Request Workflow
1. **Customer Request**: Customer submits custom dimensions and material preferences
2. **Admin Review**: Admin reviews request and provides pricing estimate
3. **Customer Decision**: Customer approves/rejects the quote
4. **Production**: If approved, admin starts production process
5. **Completion**: Order fulfilled and delivered to customer

**Status Flow**: `PENDING` → `QUOTED` → `APPROVED` → `IN_PROGRESS` → `COMPLETED`
**Cancellation**: Any status can transition to `CANCELLED`

### Inventory Management
- **Real-time tracking**: Stock levels automatically updated
- **Transaction history**: Complete audit trail
- **Low stock alerts**: Configurable thresholds
- **Stock adjustments**: Manual adjustment with reasons

### Role-Based Security
- **Admin Role**: Full system access, CRUD operations
- **Employee Role**: Read access, limited write operations
- **JWT Protection**: All endpoints require authentication
- **Route Guards**: Automatic role validation

### Data Validation
- **Input validation**: class-validator decorators
- **Business rules**: Custom validation logic
- **Error handling**: Comprehensive error responses
- **Data transformation**: Automatic type conversion

## 🔄 API Endpoints Reference

### Authentication Endpoints
```
POST   /auth/register     # User registration
POST   /auth/login        # User login
GET    /auth/profile      # Get user profile
POST   /auth/refresh      # Refresh JWT token
POST   /auth/logout       # User logout
```

### Categories Endpoints
```
GET    /categories                    # List categories (hierarchical)
GET    /categories/:id               # Get category details
POST   /categories                   # Create category [Admin]
PUT    /categories/:id               # Update category [Admin]
DELETE /categories/:id               # Delete category [Admin]
```

### Materials & Sizes Endpoints
```
GET    /materials?active=true        # List materials
POST   /materials                    # Create material [Admin]
PUT    /materials/:id                # Update material [Admin]
DELETE /materials/:id                # Delete material [Admin]

GET    /sizes?standard=true          # List sizes
POST   /sizes                        # Create size [Admin]
PUT    /sizes/:id                    # Update size [Admin]
DELETE /sizes/:id                    # Delete size [Admin]
```

### Products Endpoints
```
GET    /products?page=1&limit=10&search=&category=  # List products
GET    /products/:id                                # Product details
POST   /products                                    # Create product [Admin]
PUT    /products/:id                                # Update product [Admin]
PATCH  /products/:id/toggle-status                  # Toggle status [Admin]
DELETE /products/:id                                # Delete product [Admin]
```

### Product Variants Endpoints
```
GET    /product-variants?page=1&limit=10            # List variants
GET    /product-variants/low-stock                  # Low stock variants
GET    /product-variants/:id                        # Variant details
GET    /product-variants/:id/inventory-history      # Inventory history
POST   /product-variants                            # Create variant [Admin]
PATCH  /product-variants/:id                        # Update variant [Admin]
PATCH  /product-variants/:id/adjust-stock           # Adjust stock [Admin]
PATCH  /product-variants/:id/toggle-availability    # Toggle availability [Admin]
DELETE /product-variants/:id                        # Delete variant [Admin]
```

### Customers Endpoints
```
GET    /customers?page=1&limit=10&search=&type=     # List customers
GET    /customers/:id                               # Customer details
POST   /customers                                   # Create customer
PUT    /customers/:id                               # Update customer
DELETE /customers/:id                               # Delete customer [Admin]
```

### Cart Endpoints
```
POST   /cart/add                         # Add item to cart
GET    /cart/customer/:customerId        # Get customer's cart
PATCH  /cart/items/:cartItemId           # Update cart item
DELETE /cart/items/:cartItemId           # Remove cart item
DELETE /cart/customer/:customerId/clear  # Clear entire cart
POST   /cart/checkout                    # Create order from cart
```

### Custom Requests Endpoints
```
GET    /custom-requests?page=1&limit=10&status=&customerId=   # List custom requests
GET    /custom-requests/pending                               # Get pending requests
GET    /custom-requests/quoted                                # Get quoted requests
GET    /custom-requests/customer/:customerId                  # Get by customer
GET    /custom-requests/:id                                   # Custom request details
POST   /custom-requests                                       # Create custom request
PUT    /custom-requests/:id                                   # Update custom request
PATCH  /custom-requests/:id/quote                             # Provide quote [Admin]
PATCH  /custom-requests/:id/status                            # Update status
DELETE /custom-requests/:id                                   # Delete custom request [Admin]
```

### Orders Endpoints
```
GET    /orders?page=1&limit=10&status=&from_date=&to_date=  # List orders
GET    /orders/:id                                          # Order details
POST   /orders                                              # Create order
PUT    /orders/:id                                          # Update order [Admin]
PATCH  /orders/:id/status                                   # Update status [Admin]
PATCH  /orders/:id/payment                                  # Update payment [Admin]
DELETE /orders/:id                                          # Cancel order [Admin]
```

### Dashboard Endpoints
```
GET    /dashboard/stats               # Dashboard statistics
GET    /dashboard/recent-activity     # Recent activities
GET    /dashboard/sales-analytics     # Sales analytics
```

## 🧪 Development

### Available Scripts
```bash
npm run start          # Production start
npm run start:dev      # Development with hot reload
npm run start:debug    # Debug mode
npm run build          # Build for production
npm run test           # Run unit tests
npm run test:e2e       # Run integration tests
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

### Database Migrations
```bash
npm run typeorm:migration:generate -- -n MigrationName
npm run typeorm:migration:run
npm run typeorm:migration:revert
```

## 🐳 Docker Support

### Docker Compose (Development)
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f api
```

### Production Deployment
```bash
# Build image
docker build -t furniture-store-api .

# Run container
docker run -d \
  --name furniture-api \
  -p 3000:3000 \
  --env-file .env.production \
  furniture-store-api
```

## 🔧 Configuration

### Environment Variables Reference
```env
# Required Database Settings
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=furniture_user
DB_PASSWORD=secure_password
DB_DATABASE=furniture_store

# Required Redis Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Required JWT Settings
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Optional Application Settings
PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3001

# Optional Cache Settings
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MySQL service
   sudo systemctl status mysql
   
   # Verify database exists
   mysql -u root -p -e "SHOW DATABASES;"
   
   # Check user permissions
   mysql -u root -p -e "SHOW GRANTS FOR 'your_username'@'localhost';"
   ```

2. **Redis Connection Error**
   ```bash
   # Check Redis service
   sudo systemctl status redis
   
   # Test Redis connection
   redis-cli ping
   ```

3. **JWT Token Invalid**
   ```bash
   # Verify JWT_SECRET is set
   echo $JWT_SECRET
   
   # Check token expiration
   # Use online JWT decoder to verify token structure
   ```

4. **TypeORM Errors**
   ```bash
   # Clear compiled files
   rm -rf dist/
   
   # Rebuild
   npm run build
   
   # Check entity synchronization
   # Set synchronize: true in development only
   ```

## 📈 Performance Considerations

### Caching Strategy
- **Redis TTL**: 1 hour for most data
- **Cache Keys**: Structured with module:action:params
- **Invalidation**: Automatic on data changes
- **Memory Usage**: Monitor Redis memory consumption

### Database Optimization
- **Indexes**: Added on frequently queried columns
- **Pagination**: Implemented on all list endpoints
- **Query Optimization**: Use QueryBuilder for complex queries
- **Connection Pooling**: Configured in TypeORM settings

### Security Best Practices
- **JWT Secrets**: Use strong, unique secrets
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: All inputs validated and sanitized
- **Role Guards**: Endpoints protected by role requirements
- **CORS**: Configure for production domains only

## 🔄 Future Enhancements

### Phase 2 Features (Optional)
- **Custom Orders Module**: Advanced workflow for custom furniture
- **Reports Module**: Advanced analytics and reporting
- **Inventory Module**: Enhanced inventory management
- **File Upload**: Product images and document management
- **Email Notifications**: Order status and inventory alerts
- **Backup System**: Automated database backups
- **Mobile API**: Optimized endpoints for mobile apps

### Integration Opportunities
- **Payment Gateways**: VNPay, MoMo integration
- **SMS Notifications**: Twilio or local SMS services
- **Accounting Software**: Integration with Vietnamese accounting systems
- **Shipping**: Local delivery service integration

## 📞 Support

### Getting Help
1. **Documentation**: Check this README and Swagger docs
2. **Issues**: Open GitHub issues for bugs
3. **Features**: Submit feature requests via GitHub
4. **Community**: Join project discussions

### Development Team
- **Architecture**: NestJS + TypeORM + MySQL + Redis
- **API Design**: RESTful with OpenAPI documentation
- **Security**: JWT + Role-based access control
- **Performance**: Redis caching + Database optimization

---

**Ready to manage your furniture store business efficiently! 🪑✨**
