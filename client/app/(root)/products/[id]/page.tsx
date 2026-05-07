'use client'

import { useState } from 'react';

import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import Image from 'next/image';
import {
  useParams,
  useRouter,
} from 'next/navigation';
import { toast } from 'sonner';

import { ImageGallery } from '@/components/gallery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/hooks/use-cart';
import {
  Material,
  ProductVariant,
} from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = Number(params.id)
  const { user, tokens } = useAuth()
  const cart = useCart()
  const api = new APIClient(tokens);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showCustomRequest, setShowCustomRequest] = useState(false)
  const [customDimensions, setCustomDimensions] = useState({
    length: '',
    width: '',
    height: '',
    customMaterialId: '',
    specialRequirements: ''
  })

  const [isSubmittingCustomRequest, setIsSubmittingCustomRequest] = useState(false)

  // Fetch materials for custom order form
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => api.material().getMaterials(),
    enabled: showCustomRequest
  })

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => api.product().getProduct(productId),
    enabled: !!productId
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message="Không tìm thấy sản phẩm" />
      </div>
    )
  }

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn phiên bản sản phẩm')
      return
    }

    if (selectedVariant.stockQuantity === 0) {
      toast.error('Sản phẩm đã hết hàng')
      return
    }



    try {
      if (user) {
        // For authenticated users - use server cart mutation
        cart.addToCart.server({
          productVariantId: selectedVariant.id,
          quantity,
        })
      } else {
        cart.addToCart.local({
          productId: product.data.id,
          variantId: selectedVariant.id,
          quantity,
          price: selectedVariant.price,
          productName: product.data.name || '',
          materialName: selectedVariant.material?.name || '',
          sizeName: selectedVariant.size?.name || '',
          thumbnailUrl: product.data.thumbnailUrl || '',
          sizeId: selectedVariant.size?.id || 0,
          materialId: selectedVariant.material?.id || 0,
          productCategory: product.data.category?.name || ''
        })
      }

      // Open cart to show added item
      cart.openCart()
    } catch (error) {
      // Error is already handled by the cart hook with toast
      console.error('Add to cart error:', error)
    }
  }

  const handleCustomRequest = () => {
    setShowCustomRequest(!showCustomRequest)
  }

  const handleSubmitCustomRequest = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng theo yêu cầu')
      return
    }

    const { length, width, height, customMaterialId, specialRequirements } = customDimensions

    // Validate form data
    if (!length || !width || !height) {
      toast.error('Vui lòng nhập đầy đủ kích thước')
      return
    }

    if (Number(length) <= 0 || Number(width) <= 0 || Number(height) <= 0) {
      toast.error('Kích thước phải lớn hơn 0')
      return
    }

    setIsSubmittingCustomRequest(true)

    try {
      const orderData = {
        productId: product?.data?.id || 0,
        customWidth: Number(width),
        customHeight: Number(height),
        customDepth: Number(length),
        materialId: customMaterialId,
        specialRequirements: specialRequirements || undefined,
      }

      await api.customRequest().createCustomRequest({
        ...orderData,
        materialId: Number(customMaterialId)
      })

      toast.success('Đã gửi yêu cầu đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm.')

      // Redirect to custom-order page
      router.push('/custom-request')
    } catch (error: any) {
      console.error('Custom order error:', error)
      toast.error(error.message || "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại. ")
    } finally {
      setIsSubmittingCustomRequest(false)
    }
  }

  const isAddingToCart = cart.isAdding || cart.isLoading
  const isOutOfStock = selectedVariant?.stockQuantity === 0

  // Create images array for the gallery (demo purposes - multiple images for showcase)
  const productImages = product?.data.thumbnailUrl ? product.data.thumbnailUrl.split(';') : []
  console.log(productImages, 'productImages', product?.data.thumbnailUrl)
  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-walnut-700 hover:text-wood-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Gallery */}
          <ImageGallery
            images={productImages}
            productName={product?.data.name || 'Product'}
          />

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product?.data.category?.name}
              </Badge>
              <h1 className="text-3xl font-bold text-charcoal mb-2">
                {product?.data.name}
              </h1>

            </div>

            {/* Variants */}
            {product?.data.variants && product?.data.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-charcoal">Chọn phiên bản</h3>
                <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                  <RadioGroup
                    value={selectedVariant?.id.toString()}
                    onValueChange={(value) => {
                      const variant = product?.data.variants?.find(v => v.id.toString() === value)
                      setSelectedVariant(variant || null)
                      setQuantity(1) // Reset quantity when variant changes
                    }}
                    className="space-y-3"
                  >
                    {product?.data.variants?.map((variant) => (
                      <div key={variant.id} className="flex items-center space-x-3 p-4 border border-wood-200 rounded-lg hover:border-wood-400 transition-colors">
                        <RadioGroupItem
                          value={variant.id.toString()}
                          id={variant.id.toString()}
                          disabled={variant.stockQuantity === 0}
                        />
                        <Label htmlFor={variant.id.toString()} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <div className="font-medium text-charcoal">
                                {variant.material?.name} - {variant.size?.name}
                              </div>
                              <div className="text-sm text-walnut-600">
                                {variant.size?.lengthCm}cm x {variant.size?.widthCm}cm x {variant.size?.heightCm}cm
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-wood-600">
                                {formatCurrency(parseFloat(variant.price))}
                              </div>
                              <div className={`text-sm ${variant.stockQuantity === 0 ? 'text-red-500' : 'text-walnut-600'}`}>
                                {variant.stockQuantity === 0 ? 'Hết hàng' : `Còn: ${variant.stockQuantity}`}
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Quantity */}
            {selectedVariant && !isOutOfStock && (
              <div className="space-y-4">
                <Label htmlFor="quantity" className="text-lg font-semibold text-charcoal">
                  Số lượng
                </Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isAddingToCart}
                  >
                    <Minus />
                  </Button>
                  <span className="text-lg font-medium text-charcoal w-8 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(selectedVariant.stockQuantity, quantity + 1))}
                    disabled={quantity >= selectedVariant.stockQuantity || isAddingToCart}
                  >
                    <Plus />
                  </Button>
                  <span className="text-sm text-walnut-600">
                    / {selectedVariant.stockQuantity} có sẵn
                  </span>
                </div>
              </div>
            )}

            {/* Cart Info for authenticated users */}
            {user && cart.totalItems > 0 && (
              <div className="bg-wood-50 border border-wood-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-walnut-700">
                    Giỏ hàng: {cart.totalItems} sản phẩm - {formatCurrency(cart.totalPrice)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push('/cart')
                    }}
                    className="text-wood-600 hover:text-wood-700"
                  >
                    Xem giỏ hàng
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || isOutOfStock || isAddingToCart}
                  className="flex-1 bg-wood-500 hover:bg-wood-600 disabled:opacity-50"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang thêm...
                    </>
                  ) : isOutOfStock ? (
                    'Hết hàng'
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Thêm vào giỏ
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="secondary"
                onClick={handleCustomRequest}
                className="w-full bg-walnut-500 hover:bg-walnut-600 text-white"
              >
                Đặt làm theo yêu cầu
              </Button>

              {/* Custom Order Form */}
              {showCustomRequest && (
                <Card className="mt-4">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-charcoal mb-4">
                      Đặt làm theo yêu cầu
                    </h3>

                    <div className="space-y-4">
                      {/* Dimensions */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className='space-y-2'>
                          <Label htmlFor="custom-length">Chiều dài (cm)</Label>
                          <Input
                            id="custom-length"
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="150"
                            value={customDimensions.length}
                            onChange={(e) => setCustomDimensions(prev => ({ ...prev, length: e.target.value }))}
                            disabled={isSubmittingCustomRequest}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor="custom-width">Chiều rộng (cm)</Label>
                          <Input
                            id="custom-width"
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="80"
                            value={customDimensions.width}
                            onChange={(e) => setCustomDimensions(prev => ({ ...prev, width: e.target.value }))}
                            disabled={isSubmittingCustomRequest}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor="custom-height">Chiều cao/Độ dày (cm)</Label>
                          <Input
                            id="custom-height"
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="75"
                            value={customDimensions.height}
                            onChange={(e) => setCustomDimensions(prev => ({ ...prev, height: e.target.value }))}
                            disabled={isSubmittingCustomRequest}
                          />
                        </div>
                      </div>

                      {/* Custom Material */}
                      <div className='space-y-2'>
                        <Label htmlFor="custom-material">Chất liệu tùy chỉnh (tùy chọn)</Label>
                        <Select
                          value={customDimensions.customMaterialId}
                          onValueChange={(value) => setCustomDimensions(prev => ({ ...prev, customMaterialId: value }))}
                          disabled={isSubmittingCustomRequest}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn chất liệu..." />
                          </SelectTrigger>
                          <SelectContent>
                            {materials?.data?.map((material: Material) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Special Requirements */}
                      <div className='space-y-2'>
                        <Label htmlFor="special-requirements">Yêu cầu đặc biệt (tùy chọn)</Label>
                        <Textarea
                          id="special-requirements"
                          className='border-wood-400'
                          placeholder="Ví dụ: Thêm ngăn kéo, tay cầm đồng, v.v."
                          value={customDimensions.specialRequirements}
                          onChange={(e) => setCustomDimensions(prev => ({ ...prev, specialRequirements: e.target.value }))}
                          disabled={isSubmittingCustomRequest}
                        />
                      </div>



                      {/* Action Buttons */}
                      <div className="flex space-x-4 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowCustomRequest(false)}
                          disabled={isSubmittingCustomRequest}
                          className="flex-1"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSubmitCustomRequest}
                          disabled={isSubmittingCustomRequest}
                          className="flex-1 bg-wood-500 hover:bg-wood-600"
                        >
                          {isSubmittingCustomRequest ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang gửi...
                            </>
                          ) : (
                            'Gửi yêu cầu'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Guest user notice */}
              {!user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Đăng nhập</strong> để đồng bộ giỏ hàng trên các thiết bị và đặt hàng nhanh chóng
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-16 space-y-6">

          <h2 className="text-2xl font-bold text-charcoal mb-6">Chi tiết sản phẩm</h2>
          <Card>
            <CardContent>
              <h3 className="font-semibold text-lg text-charcoal mb-4">Thông tin kỹ thuật</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-walnut-600">Danh mục:</span>
                  <span className="text-charcoal font-medium">{product?.data.category?.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-walnut-600">Xuất xứ:</span>
                  <span className="text-charcoal font-medium">Việt Nam</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-walnut-600">Chất lượng:</span>
                  <span className="text-charcoal font-medium">Cao cấp</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-walnut-600">Vật liệu:</span>
                  <span className="text-charcoal font-medium">
                    {selectedVariant?.material?.name ??
                      product?.data.variants?.[0]?.material?.name ?? 'Không xác định'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-walnut-600">Kích thước:</span>
                  <span className="text-charcoal font-medium">{selectedVariant?.size?.lengthCm ?? product?.data.variants?.[0]?.size?.lengthCm}cm x {selectedVariant?.size?.widthCm ?? product?.data.variants?.[0]?.size?.widthCm}cm x {selectedVariant?.size?.heightCm ?? product?.data.variants?.[0]?.size?.heightCm}cm </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-charcoal mb-4">Hướng dẫn bảo quản</h3>
              <ul className="space-y-2 text-walnut-600">
                <li>• Tránh tiếp xúc trực tiếp với ánh nắng mặt trời</li>
                <li>• Lau chùi bằng khăn mềm, khô</li>
                <li>• Tránh để ở nơi ẩm ướt</li>
                <li>• Sử dụng chất bảo vệ gỗ định kỳ</li>
              </ul>
            </CardContent>
          </Card>
          <h2 className="text-2xl font-bold text-charcoal mb-6">Mô tả sản phẩm</h2>
          <Card className="container mx-auto px-4 py-8">
            <p className="text-walnut-600 leading-relaxed">
              {product?.data.description}
            </p>
            {product?.data.thumbnailUrl && product?.data.thumbnailUrl.split(';').length > 0 && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {product?.data.thumbnailUrl.split(';').map((image,index) => (
                  <div
                    className='flex mx-auto items-center gap-4 mt-4 w-full aspect-square lg:w-[500px] relative rounded-lg overflow-hidden'
                    key={index}
                  >
                    <Image
                      src={image || '/placeholder.svg'}
                      alt={product?.data.name || 'Product Image'}
                      sizes='100%'
                      fill
                      className='object-contain rounded-lg'
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 