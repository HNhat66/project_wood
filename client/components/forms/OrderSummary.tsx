'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryProps {
  subtotal: number
  shippingFee: number
  itemCount: number
  title?: string
}

export function OrderSummary({ 
  subtotal, 
  shippingFee, 
  itemCount,
  title = "Tóm tắt đơn hàng"
}: OrderSummaryProps) {
  const finalTotal = subtotal + shippingFee

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-walnut-600">Tạm tính ({itemCount} sản phẩm)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-walnut-600">Phí giao hàng</span>
          <span className="font-medium">{formatPrice(shippingFee)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Tổng cộng</span>
          <span className="text-wood-600">{formatPrice(finalTotal)}</span>
        </div>
        <div className="text-sm text-walnut-600 mt-2">
          <p>* Bạn sẽ thanh toán sau khi đặt hàng thành công</p>
        </div>
      </CardContent>
    </Card>
  )
} 