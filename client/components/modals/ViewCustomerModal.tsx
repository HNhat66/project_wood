'use client'

import {
  Calendar,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  User as UserIcon,
  UserCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Customer } from '@/lib/types';
import {
  formatCurrency,
  formatDate,
} from '@/lib/utils';

interface ViewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function ViewCustomerModal({
  isOpen,
  onClose,
  customer,
}: ViewCustomerModalProps) {

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Chi tiết khách hàng
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết của khách hàng: <strong>{customer.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-charcoal">Thông tin cơ bản</h3>
              <Badge variant="outline" className="font-mono text-xs">
                {customer.customerCode}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Họ và tên</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <UserIcon className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{customer.fullName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Số điện thoại</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{customer.phone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Email</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{customer.email || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Mã khách hàng</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <UserCheck className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal font-mono">{customer.customerCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {customer.address && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal">Địa chỉ</h3>
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-walnut-500 mt-0.5" />
                <div className="text-charcoal">{customer.address}</div>
              </div>
            </div>
          )}

          {/* Purchase Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal">Thống kê mua hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Tổng số đơn hàng</label>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-700 font-semibold">{customer.totalOrders}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Tổng chi tiêu</label>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CreditCard className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 font-semibold">{formatCurrency(customer.totalSpent)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Đơn hàng gần nhất</label>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-purple-700 text-sm">
                    {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Chưa có'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal">Ghi chú</h3>
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <FileText className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div className="text-charcoal whitespace-pre-wrap">{customer.notes}</div>
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal">Thông tin hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Ngày tạo</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{formatDate(customer.createdAt)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Người tạo</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <UserIcon className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">
                    {customer.createdBy?.fullName || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal">Trạng thái</h3>
            <div className="flex gap-2">
              <Badge 
                variant={customer.totalOrders > 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {customer.totalOrders > 0 ? "Khách hàng tích cực" : "Khách hàng mới"}
              </Badge>
              {customer.totalSpent > 5000000 && (
                <Badge variant="default" className="bg-gold-500 text-white text-xs">
                  Khách hàng VIP
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 