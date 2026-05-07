'use client'

import { Truck } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { formatPrice } from '@/lib/utils';

interface ShippingMethodSelectorProps {
  shippingMethod: string
  onShippingMethodChange: (method: string) => void
}

export function ShippingMethodSelector({ 
  shippingMethod, 
  onShippingMethodChange 
}: ShippingMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phương thức giao hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={shippingMethod} onValueChange={onShippingMethodChange}>
          <div className="flex items-center space-x-3 p-3 border border-wood-200 rounded-lg">
            <RadioGroupItem value="standard" id="standard" />
            <Label htmlFor="standard" className="flex-1 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Truck className="size-5 text-wood-500 flex-shrink-0" />
                  <span>Giao hàng tiêu chuẩn</span>
                </div>
                <span className="font-medium">{formatPrice(30000)}</span>
              </div>
              <div className="text-sm text-walnut-600 mt-1">
                3-5 ngày làm việc
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-3 border border-wood-200 rounded-lg">
            <RadioGroupItem value="express" id="express" />
            <Label htmlFor="express" className="flex-1 cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Truck className="size-5 text-wood-500 flex-shrink-0" />
                  <span>Giao hàng nhanh</span>
                </div>
                <span className="font-medium">{formatPrice(50000)}</span>
              </div>
              <div className="text-sm text-walnut-600 mt-1">
                1-2 ngày làm việc
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
} 