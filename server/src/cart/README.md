# Cart Module - API Documentation

## Cập nhật Cart Module (v2.0)

Cart module đã được triển khai lại để hỗ trợ format grouped mới, group các sản phẩm theo product và hiển thị các variants của từng product.

### 🎯 Format Mới của Cart Response

```json
[
    {
        "product": {
            "id": 1,
            "name": "Bàn ăn Classic",
            "category": "Bàn ăn gia đình",
            "thumbnailUrl": "https://example.com/classic-table.jpg"
        },
        "variants": [
            {
                "materialId": 1,
                "materialName": "Gỗ sồi",
                "sizeId": 2,
                "sizeName": "Vừa (4-5 người)",
                "price": "4500000.00",
                "quantity": 5,
                "productVariantId": 123,
                "sku": "BAN-SOI-VUA-001",
                "stockQuantity": 50
            },
            {
                "materialId": 2,
                "materialName": "Gỗ thông",
                "sizeId": 1,
                "sizeName": "Nhỏ (2-3 người)",
                "price": "3000000.00",
                "quantity": 3,
                "productVariantId": 124,
                "sku": "BAN-THONG-NHO-001",
                "stockQuantity": 30
            }
        ]
    }
]
```

### 🚀 API Endpoints Mới

#### 1. Lấy giỏ hàng (format mới)
```
GET /cart
GET /cart/my-cart (legacy endpoint)
```

#### 2. Thêm sản phẩm vào giỏ hàng
```
POST /cart/add
Body: {
    "productVariantId": 123,
    "quantity": 2
}
```

#### 3. Cập nhật số lượng sản phẩm trong giỏ hàng
```
PATCH /cart/update
Body: {
    "productVariantId": 123,
    "quantity": 5
}
```

#### 4. Xóa sản phẩm khỏi giỏ hàng
```
DELETE /cart/remove
Body: {
    "productVariantId": 123
}
```

#### 5. Xóa toàn bộ giỏ hàng
```
DELETE /cart/clear
```

#### 6. Checkout từ giỏ hàng
```
POST /cart/checkout
Body: {
    "depositAmount": 3000000,
    "paymentProof": "https://example.com/payment-proof.jpg",
    "deliveryAddressId": 1,
    "deliveryType": "standard",
    "notes": "Ghi chú đơn hàng"
}
```

### 🔄 Legacy Endpoints (Backward Compatibility)

Các endpoint cũ vẫn được hỗ trợ để đảm bảo tương thích ngược:

```
PATCH /cart/items/:cartItemId
DELETE /cart/items/:cartItemId
```

### 🎨 Lợi ích của Format Mới

1. **Group theo Product**: Dễ dàng hiển thị UI theo từng sản phẩm
2. **Hiển thị Variants**: Thấy được tất cả variants của cùng 1 product trong giỏ hàng
3. **Thông tin đầy đủ**: Có material name, size name, price cho mỗi variant
4. **Dễ quản lý**: Update/remove theo productVariantId thay vì cartItemId

### 🔧 Cache Strategy

- Cache key: `cart:grouped:user:{userId}`
- TTL: 30 minutes (1800s)
- Cache empty cart: 5 minutes
- Auto invalidate khi có thay đổi

### 📊 Response Structure

```typescript
interface GroupedCartResponseDto {
  userId: number;
  cartItems: CartProductDto[];
  totalItems: number;      // Tổng số lượng tất cả variants
  totalAmount: number;     // Tổng giá trị giỏ hàng
  createdAt: Date;
  updatedAt: Date;
}
```

### 🚨 Breaking Changes

1. Cart response format đã thay đổi hoàn toàn
2. Update/Remove API đã đổi từ cartItemId sang productVariantId
3. Response type đổi từ `CartResponseDto` thành `GroupedCartResponseDto`

### 🔀 Migration Guide

Nếu đang sử dụng API cũ:

1. **GET /cart/my-cart** → **GET /cart** (response format mới)
2. **PATCH /cart/items/:id** → **PATCH /cart/update** + body với productVariantId
3. **DELETE /cart/items/:id** → **DELETE /cart/remove** + body với productVariantId

### 🧪 Testing

Sử dụng Swagger UI tại `/api/docs` để test các endpoints mới.

### 📝 Notes

- Tất cả endpoints đều yêu cầu JWT authentication
- Role: USER
- Validation được áp dụng cho tất cả inputs
- Error responses có format thống nhất 