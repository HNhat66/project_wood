'use client'

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  OrderStatus,
  OrderStatusLabels,
  OrderStatusTransitions,
} from '@/lib/types';

interface UpdateOrderStatusWithLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  orderId: number
  orderNumber: string
  currentStatus: string
}

export function UpdateOrderStatusWithLogModal({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
  currentStatus,
}: UpdateOrderStatusWithLogModalProps) {
  const { tokens } = useAuth()
  const apiClient = new APIClient(tokens)
  const [newStatus, setNewStatus] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const availableStatuses = OrderStatusTransitions[currentStatus as OrderStatus] || []

  const handleSubmit = async () => {
    if (!newStatus) {
      toast.error('Vui lòng chọn trạng thái mới')
      return
    }

    // Check if message is required when status is cancelled
    if (newStatus === 'cancelled' && !message.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng')
      return
    }

    setIsLoading(true)
    try {
      await apiClient.orderTrackingLog().updateOrderStatusWithLog(orderId, {
        newStatus,
        message: message.trim() || undefined,
      })
      
      toast.success('Đã cập nhật trạng thái đơn hàng thành công')
      setNewStatus('')
      setMessage('')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setNewStatus('')
      setMessage('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
          <DialogDescription>
            Cập nhật trạng thái cho đơn hàng #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Trạng thái hiện tại</Label>
            <div className="p-2 bg-wood-50 border border-wood-200 rounded-md">
              {OrderStatusLabels[currentStatus as OrderStatus]}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái mới</Label>
            <Select value={newStatus} onValueChange={setNewStatus} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái mới" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status: OrderStatus) => (
                  <SelectItem key={status} value={status}>
                    {OrderStatusLabels[status as OrderStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              {newStatus === 'cancelled' 
                ? <>Lý do hủy đơn hàng <span className="text-red-500">*</span></> 
                : 'Ghi chú tracking (tùy chọn)'
              }
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                newStatus === 'cancelled' 
                  ? "Nhập lý do hủy đơn hàng..."
                  : "Ví dụ: Đơn hàng đã được chuyển sang trạng thái mới do..."
              }
              rows={3}
              disabled={isLoading}
              className={newStatus === 'cancelled' ? 'border-red-200 focus:border-red-500' : ''}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading || 
              !newStatus || 
              availableStatuses.length === 0 ||
              (newStatus === 'cancelled' && !message.trim())
            }
            className="bg-wood-500 hover:bg-wood-600" 
          >
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 