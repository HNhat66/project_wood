'use client'

import { useState } from 'react';

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
import {
  cn,
  formatPrice,
} from '@/lib/utils';

interface PaymentSectionProps {
  totalPrice: number
  depositAmount: number
  onDepositChange: (amount: number) => void
}

export function PaymentSection({
  totalPrice,
  depositAmount,
  onDepositChange,
}: PaymentSectionProps) {
  const { tokens } = useAuth()
  const api = new APIClient(tokens)
  const [depositError, setDepositError] = useState<string>('')

  // Calculate min and max deposit amounts
  const minDeposit = totalPrice * 0.3 // 30%
  const maxDeposit = totalPrice

  // Validate deposit amount
  const validateDepositAmount = (amount: number) => {
    if (amount < minDeposit) {
      setDepositError(`Số tiền đặt cọc phải lớn hơn ${formatPrice(minDeposit - minDeposit % 10000)} (30% của tổng đơn hàng)`)
      return false
    }
    if (amount > maxDeposit) {
      setDepositError(`Số tiền đặt cọc phải nhỏ hơn ${formatPrice(maxDeposit - maxDeposit % 10000)} (100% của tổng đơn hàng)`)
      return false
    }
    setDepositError('')
    return true
  }

  // Handle deposit amount change
  const handleDepositChange = (value: string) => {
    const amount = parseFloat(value) || 0
    onDepositChange(amount)
    validateDepositAmount(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deposit Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="deposit-amount">
            Số tiền đặt cọc *
            <span className="text-sm text-walnut-600 ml-2">
              (Tối thiểu {formatPrice(minDeposit)} - Tối đa {formatPrice(maxDeposit)})
            </span>
          </Label>
          <Input
            id="deposit-amount"
            type="number"
            value={depositAmount || ''}
            onChange={(e) => handleDepositChange(e.target.value)}
            placeholder={`Nhập số tiền (tối thiểu ${formatPrice(minDeposit)})`}
            className={cn(
              'border-wood-500',
              depositError && 'border-red-500 focus:border-red-500'
            )}
            min={minDeposit}
            max={maxDeposit}
          />
          {depositError && (
            <p className="text-sm text-red-500">{depositError}</p>
          )}
          {depositAmount > 0 && !depositError && (
            <div className="text-sm text-green-600">
              <p>Số tiền đặt cọc: {formatPrice(depositAmount)}</p>
              <p>Số tiền còn lại: {formatPrice(totalPrice - depositAmount)}</p>
            </div>
          )}
        </div>



      </CardContent>
    </Card>
  )
} 