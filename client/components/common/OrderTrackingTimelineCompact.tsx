'use client'

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  MessageSquare,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserRole } from '@/lib/types';

interface TrackingLog {
  id: number
  message: string
  createdAt: Date | string
  createdBy: {
    id: number
    fullName: string
    role: string
  }
}

interface OrderTrackingTimelineCompactProps {
  trackingLogs: TrackingLog[]
  orderNumber: string
}

export function OrderTrackingTimelineCompact({
  trackingLogs,
  orderNumber,
}: OrderTrackingTimelineCompactProps) {
  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi })
  }

  const formatShortDate = (date: Date | string) => {
    return format(new Date(date), 'dd/MM HH:mm', { locale: vi })
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Quản trị viên'
      case UserRole.EMPLOYEE:
        return 'Nhân viên'
      case UserRole.USER:
        return 'Khách hàng'
      default:
        return 'Hệ thống'
    }
  }

  if (trackingLogs.length === 0) {
    return (
      <div className="text-xs text-walnut-500">
        Chưa có tracking log
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <div className="text-xs text-wood-600 hover:text-wood-700">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{trackingLogs.length} tracking log{trackingLogs.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          {trackingLogs.length > 0 && (
            <div className="text-xs text-walnut-500 mt-1">
              Gần nhất: {formatShortDate(trackingLogs[0].createdAt)}
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Lịch sử tracking - {orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          {trackingLogs.length === 0 ? (
            <div className="text-center text-walnut-600 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-walnut-400" />
              <p>Chưa có thông tin tracking nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trackingLogs.map((log, index) => (
                <div key={log.id} className="relative">
                  {/* Timeline line */}
                  {index !== trackingLogs.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-6 bg-wood-200" />
                  )}
                  
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-wood-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-wood-600" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-wood-50 border border-wood-200 rounded-lg p-3">
                        <p className="text-charcoal text-sm font-medium mb-2">
                          {log.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-walnut-600">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getRoleDisplayName(log.createdBy.role)}
                            </Badge>
                            <span>{log.createdBy.fullName}</span>
                          </div>
                          <time dateTime={new Date(log.createdAt).toISOString()}>
                            {formatDate(log.createdAt)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 