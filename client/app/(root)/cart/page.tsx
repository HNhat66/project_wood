'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AddressSelector } from '@/components/forms/AddressSelector';
import { OrderSummary } from '@/components/forms/OrderSummary';
import {
  ShippingMethodSelector,
} from '@/components/forms/ShippingMethodSelector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  useAuth,
  withGuestAuth,
} from '@/lib/auth-context';
import { useCart } from '@/lib/hooks/use-cart';
import {
  Address,
  CartProduct,
} from '@/lib/types';
import { formatPrice } from '@/lib/utils';

function CartPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const cart = useCart()

  const [isLoading, setIsLoading] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [cartItems, setCartItems] = useState<CartProduct[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(undefined)
  const [notes, setNotes] = useState('')

  const shippingFee = shippingMethod === 'express' ? 50000 : 30000
  const totalPrice = cart.totalPrice
  const finalTotal = totalPrice + shippingFee

  useEffect(() => {
    if (cart.isAuthenticated && cart.serverCartData) {
      setCartItems(cart.serverCartData.cartItems)
    } else {
      setCartItems(cart.items)
    }
  }, [cart.isLoading,cart.items.length])

  // Handle quantity changes
  const handleQuantityChange = (
    productId: number,
    materialId: number,
    sizeId: number,
    newQuantity: number,
    productVariantId?: number
  ) => {
    if (newQuantity < 1) {
      // Remove item if quantity becomes 0
      handleRemoveItem(productId, materialId, sizeId, productVariantId)
    } else {
      // Update quantity
      if (cart.isAuthenticated && productVariantId) {
        cart.updateCartItem.server({ productVariantId, quantity: newQuantity })
      } else if (!cart.isAuthenticated) {
        cart.updateCartItem.local(productId, materialId, sizeId, newQuantity)
      }
    }
  }

  // Handle item removal
  const handleRemoveItem = (
    productId: number,
    materialId: number,
    sizeId: number,
    productVariantId?: number
  ) => {
    if (cart.isAuthenticated && productVariantId) {
      cart.removeCartItem.server(productVariantId)
    } else if (!cart.isAuthenticated) {
      cart.removeCartItem.local(productId, materialId, sizeId)
    }
  }

  // Helper function to get variant ID for authenticated users
  const getVariantId = (variant: any) => {
    // For authenticated users (server cart), use productVariantId
    if (cart.isAuthenticated) {
      return variant.productVariantId
    }
    // For guest users, variant ID doesn't exist
    return undefined
  }

  // Helper function to get variant price
  const getVariantPrice = (variant: any) => {
    if (cart.isAuthenticated) {
      return parseFloat(variant.price)
    }
    return variant.price
  }

  // Handle checkout - requires authentication
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/cart'))
      return
    }

    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng')
      return
    }

    setIsLoading(true)
    try {
      const orderData = {
        notes,
        deliveryAddressId: selectedAddress?.id,
        deliveryType: shippingMethod
      }
      cart.checkout.server(orderData)
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return <div className='min-h-screen bg-cream flex items-center justify-center'>
      <LoadingSpinner />
    </div>
  }

  if (cartItems.length === 0 && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="mx-auto h-24 w-24 text-walnut-400 mb-6" />
          <h1 className="text-2xl font-bold text-charcoal mb-4">
            Giỏ hàng trống
          </h1>
          <p className="text-walnut-600 mb-8">
            Hãy thêm một số sản phẩm vào giỏ hàng để tiếp tục
          </p>
          <Button
            onClick={() => router.push('/products')}
            className="bg-wood-500 hover:bg-wood-600"
          >
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-charcoal mb-8">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-wood-200 flex-shrink-0">
                      <Image
                        src={item.product.thumbnailUrl || '/placeholder-wood.jpg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-charcoal mb-1">
                        {item.product.name}
                      </h3>
                      {item.variants.map((variant) => (
                        <div className="flex-1 border-t border-wood-200 py-2" key={variant.materialId + '-' + variant.sizeId}>

                          <div className="flex md:items-center justify-between md:flex-row flex-col">
                            <div className="flex gap-2 flex-col">
                              <p className="text-sm text-walnut-600 mb-2">
                                {variant.materialName} - {variant.sizeName}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.product.id, variant.materialId, variant.sizeId, variant.quantity - 1, getVariantId(variant))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {variant.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.product.id, variant.materialId, variant.sizeId, variant.quantity + 1, getVariantId(variant))}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <div className='flex-1 space-y-1'>
                                <div className="font-bold text-wood-600">
                                  {formatPrice(getVariantPrice(variant) * variant.quantity)}
                                </div>
                                <div className="text-sm text-walnut-600">
                                  {formatPrice(getVariantPrice(variant))} / cái
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.product.id, variant.materialId, variant.sizeId, getVariantId(variant))}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Form */}
          {isAuthenticated ? <>
            <div className="space-y-6">
              {/* Address Selection */}
              <AddressSelector
                selectedAddress={selectedAddress}
                onAddressChange={setSelectedAddress}
              />

              {/* Notes */}
              <Card>
                <CardContent className="p-6">
                  <div className='space-y-2'>
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Yêu cầu đặc biệt..."
                      className='border-wood-500'
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <ShippingMethodSelector
                shippingMethod={shippingMethod}
                onShippingMethodChange={setShippingMethod}
              />

              <Separator />

              {/* Order Summary */}
              <OrderSummary
                subtotal={totalPrice}
                shippingFee={shippingFee}
                itemCount={cartItems.length}
              />

              <Button
                onClick={handleCheckout}
                disabled={
                  isLoading ||
                  !selectedAddress
                }
                className="w-full bg-wood-500 hover:bg-wood-600 mt-6 disabled:opacity-50"
              >
                {isLoading ? 'Đang xử lý...' : 'Đặt hàng'}
              </Button>
            </div></> : <div className="space-y-6">
            <p>Vui lòng đăng nhập để tiếp tục</p>
            <Button onClick={() => router.push('/login?redirect=' + encodeURIComponent('/cart'))}>Đăng nhập</Button>
          </div>}
        </div>
      </div>
    </div>
  )
}

export default withGuestAuth(CartPage) 