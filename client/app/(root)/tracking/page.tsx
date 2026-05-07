'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  CheckCircle,
  Mail,
  Package,
  Phone,
  PhoneCall,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { toast } from 'sonner';

import {
  OrderTrackingTimeline,
} from '@/components/common/OrderTrackingTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  Order,
  OrderStatus,
  OrderStatusLabels,
} from '@/lib/types';
import {
  formatCurrency,
  formatDate,
} from '@/lib/utils';

export default function TrackingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tokens } = useAuth()
  const apiClient = new APIClient(tokens)

  const orderParam = searchParams.get('order')
  const [orderNumber, setOrderNumber] = useState(orderParam || '')
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Debounce the order number for URL updates
  const debouncedOrderNumber = useDebounce(orderNumber, 500)

  useEffect(() => {
    if (orderParam) {
      handleSearch()
    }
  }, [orderParam])

  // Update URL when debounced order number changes
  useEffect(() => {
    if (debouncedOrderNumber !== orderParam) {
      if (debouncedOrderNumber.trim()) {
        router.replace(`/tracking?order=${debouncedOrderNumber}`, { scroll: false })
      } else {
        router.replace('/tracking', { scroll: false })
      }
    }
  }, [debouncedOrderNumber, orderParam, router])

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      toast.error('Vui lòng nhập số đơn hàng')
      return
    }

    setIsLoading(true)
    try {
      // First get order details
      const orderResponse = await apiClient.order().trackOrder(orderNumber.trim())
      const orderData = orderResponse.data
      setOrder(orderData)
      
    } catch (error: any) {
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'approved':
        return <Package className="h-5 w-5" />
      case 'processing':
        return <Package className="h-5 w-5" />
      case 'delivery':
        return <Truck className="h-5 w-5" />
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-wood-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            Theo dõi đơn hàng
          </h1>
          <p className="text-walnut-600">
            Nhập số đơn hàng để xem chi tiết và tình trạng vận chuyển
          </p>
        </div>

        {/* Search Form */}
        <Card className="border-wood-200 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-charcoal">
              Tìm kiếm đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="orderNumber">Số đơn hàng</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value)
                  }}
                  placeholder="Nhập số đơn hàng (ví dụ: ORD-2024-001)"
                  className="mt-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-wood-500 hover:bg-wood-600"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-wood-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-charcoal">
                    Thông tin đơn hàng #{order.orderNumber}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-wood-600">
                    {getStatusIcon(order.orderStatus)}
                    <span className="font-medium">
                      {OrderStatusLabels[order.orderStatus]}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-charcoal mb-2">Thông tin giao hàng</h4>
                    <div className="text-sm text-walnut-600 space-y-1">
                      <p><span className="font-medium">Tên:</span> {order.deliveryName}</p>
                      <p><span className="font-medium">SĐT:</span> {order.deliveryPhone}</p>
                      <p><span className="font-medium">Địa chỉ:</span> {order.deliveryAddress}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal mb-2">Thông tin đơn hàng</h4>
                    <div className="text-sm text-walnut-600 space-y-1">
                      <p><span className="font-medium">Ngày đặt:</span> {formatDate(order.createdAt)}</p>
                      <p><span className="font-medium">Kênh:</span> {order.channel === 'online' ? 'Trực tuyến' : 'Tại cửa hàng'}</p>
                      <p><span className="font-medium">Sản phẩm:</span> {order.items.length} mặt hàng</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal mb-2">Thông tin thanh toán</h4>
                    <div className="text-sm text-walnut-600 space-y-1">
                      <p><span className="font-medium">Tổng tiền:</span> {formatCurrency(order.finalAmount)}</p>
                      <p><span className="font-medium">Đã thanh toán:</span> {formatCurrency(order.depositAmount)}</p>
                      <p><span className="font-medium">Còn lại:</span> {formatCurrency(order.remainingAmount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="border-wood-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-charcoal">
                  Chi tiết sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={item.id} className="border border-wood-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-charcoal">
                            {item.type === 'standard' 
                              ? item.productVariant?.product?.name 
                              : item.product?.name
                            }
                          </h4>
                          {item.type === 'custom' && (
                            <div className="text-sm text-walnut-600 mt-1">
                              <p>Kích thước: {item.customWidth} x {item.customHeight} x {item.customDepth} cm</p>
                              {item.material && <p>Chất liệu: {item.material.name}</p>}
                              {item.specialRequirements && <p>Yêu cầu đặc biệt: {item.specialRequirements}</p>}
                            </div>
                          )}
                          {item.type === 'standard' && item.productVariant && (
                            <div className="text-sm text-walnut-600 mt-1">
                              <p>Chất liệu: {item.productVariant.material?.name}</p>
                              <p>Kích thước: {item.productVariant.size?.name}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-charcoal">
                            {formatCurrency(item.totalPrice)}
                          </p>
                          <p className="text-sm text-walnut-600">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {order.reasonCancel && order.orderStatus === OrderStatus.CANCELLED && (
              <Card className="border-wood-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-5 w-5" />
                    <CardTitle className="text-lg font-semibold">
                      Thông tin hủy đơn hàng
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-walnut-600">Lý do hủy:</label>
                        <p className="mt-1 text-charcoal whitespace-pre-wrap">{order.reasonCancel}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                        <div>
                          <label className="text-sm font-medium text-walnut-600">Thời gian hủy:</label>
                          <p className="mt-1 text-charcoal">{order.cancelAt ? formatDate(order.cancelAt) : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-walnut-600">Người hủy:</label>
                          <p className="mt-1 text-charcoal flex items-center gap-1">
                            {order.cancelByUser?.fullName ? (
                              <>
                                {order.cancelByUser.fullName}
                                <Badge variant="outline" className="ml-1">
                                  {order.cancelByUser.role === 'admin' ? 'Quản trị viên' : 
                                   order.cancelByUser.role === 'employee' ? 'Nhân viên' : 'Khách hàng'}
                                </Badge>
                              </>
                            ) : (
                              <>
                                Hệ thống
                                <Badge variant="outline" className="ml-1">Tự động</Badge>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Support Section */}
                  <div className="rounded-lg bg-white p-4 flex items-start gap-3 shadow-sm">
                    <div className="mt-1">
                      <PhoneCall className="h-5 w-5 text-wood-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-charcoal">Cần hỗ trợ?</h4>
                      <p className="text-sm text-walnut-600 mt-1">
                        Nếu bạn cần thêm thông tin hoặc hỗ trợ, vui lòng liên hệ với chúng tôi qua:
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-wood-600 hover:text-wood-700">
                          <Phone className="h-4 w-4 mr-1" />
                          0123 456 789
                        </Button>
                        <Button variant="outline" size="sm" className="text-wood-600 hover:text-wood-700">
                          <Mail className="h-4 w-4 mr-1" />
                          support@example.com
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracking Timeline */}
            <OrderTrackingTimeline
              trackingLogs={order.trackingLogs || []}
              orderStatus={order.orderStatus}
            />
          </div>
        )}

        {/* No order found message */}
        {!order && !isLoading && orderNumber && (
          <Card className="border-wood-200">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-walnut-400" />
              <h3 className="text-lg font-medium text-charcoal mb-2">
                Không tìm thấy đơn hàng
              </h3>
              <p className="text-walnut-600">
                Vui lòng kiểm tra lại số đơn hàng và thử lại
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
