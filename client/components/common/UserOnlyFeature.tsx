'use client'

import React from 'react';

import { AlertCircle } from 'lucide-react';

import { usePermissions } from '@/lib/auth-context';
import {
  UserOnlyFeatureProps,
  UserRole,
} from '@/lib/types';

import {
  Card,
  CardContent,
} from '../ui/card';

export function UserOnlyFeature({ children, fallback }: UserOnlyFeatureProps) {
  const { canAccessUserFeatures, user } = usePermissions()

  if (canAccessUserFeatures()) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  // Default fallback for admin/employee
  return (
    <Card className="border-wood-200 bg-wood-50">
      <CardContent className="flex items-center gap-3 pt-6">
        <AlertCircle className="h-5 w-5 text-wood-600 flex-shrink-0" />
        <p className="text-wood-700 text-sm">
          {user?.role === UserRole.ADMIN ? 'Tính năng này chỉ dành cho quản trị viên. Bạn có thể xem thông tin nhưng không thể thực hiện các thao tác.' 
          : user?.role === UserRole.EMPLOYEE ? 'Tính năng này chỉ dành cho nhân viên. Bạn có thể xem thông tin nhưng không thể thực hiện các thao tác.'
          : 'Tính năng này chỉ dành cho khách hàng đã đăng nhập.'}
        </p>
      </CardContent>
    </Card>
  )
} 