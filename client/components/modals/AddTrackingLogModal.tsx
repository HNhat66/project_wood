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
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface AddTrackingLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  orderId: number
  orderNumber: string
}

export function AddTrackingLogModal({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
}: AddTrackingLogModalProps) {
  const { tokens } = useAuth()
  const apiClient = new APIClient(tokens)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung log')
      return
    }

    setIsLoading(true)
    try {
      await apiClient.orderTrackingLog().createTrackingLog({
        orderId,
        message: message.trim(),
      })
      
      toast.success('Đã thêm log tracking thành công')
      setMessage('')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi thêm log tracking')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setMessage('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Log Tracking</DialogTitle>
          <DialogDescription>
            Thêm ghi chú tracking cho đơn hàng #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Nội dung log</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ví dụ: Đơn hàng đã được đóng gói và sẵn sàng giao..."
              rows={4}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
            className="bg-wood-500 hover:bg-wood-600"
          >
            {isLoading ? 'Đang thêm...' : 'Thêm Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 