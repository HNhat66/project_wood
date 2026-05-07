'use client'

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

interface OrderTrackingTimelineProps {
  trackingLogs: TrackingLog[]
  orderStatus: string
  className?: string
}

const statusIcons: Record<string, React.ComponentType<any>> = {
  'pending': Clock,
  'approved': CheckCircle,
  'processing': Package,
  'delivery': Truck,
  'completed': CheckCircle,
  'cancelled': Clock,
}

const statusColors: Record<string, string> = {
  'pending': 'text-yellow-600 bg-yellow-100',
  'approved': 'text-blue-600 bg-blue-100',
  'processing': 'text-purple-600 bg-purple-100',
  'delivery': 'text-indigo-600 bg-indigo-100',
  'completed': 'text-green-600 bg-green-100',
  'cancelled': 'text-red-600 bg-red-100',
}

const statusLabels: Record<string, string> = {
  'pending': 'Đang chờ',
  'approved': 'Đã duyệt',
  'processing': 'Đang xử lý',
  'delivery': 'Đang giao',
  'completed': 'Hoàn thành',
  'cancelled': 'Đã hủy',
}

export function OrderTrackingTimeline({
  trackingLogs,
  orderStatus,
  className = '',
}: OrderTrackingTimelineProps) {
  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi })
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

  return (
    <Card className={`border-wood-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-charcoal">
            Lịch sử tracking đơn hàng
          </CardTitle>
          <Badge className={statusColors[orderStatus]}>
            {statusLabels[orderStatus]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {trackingLogs.length === 0 ? (
          <div className="text-center text-walnut-600 py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-walnut-400" />
            <p>Chưa có thông tin tracking nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {trackingLogs.map((log, index) => (
              <div key={log.id} className="relative">
                {/* Timeline line */}
                {index !== trackingLogs.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-8 bg-wood-200" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-wood-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-wood-600" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-wood-50 border border-wood-200 rounded-lg p-4">
                      <p className="text-charcoal font-medium mb-2">
                        {log.message}
                      </p>
                      <div className="flex items-center justify-between text-sm text-walnut-600">
                        <div className="flex items-center space-x-2">
                          <span>{getRoleDisplayName(log.createdBy.role)}</span>
                          <span>•</span>
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
      </CardContent>
    </Card>
  )
} 