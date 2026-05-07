'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, UserRole } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Calendar, Mail, MapPin, Phone, User as UserIcon, Briefcase, Shield, Users } from 'lucide-react';

interface ViewUserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ViewUserDetailModal({
  isOpen,
  onClose,
  user,
}: ViewUserDetailModalProps) {
  
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <Shield className="w-3 h-3 mr-1" />
            Quản trị viên
          </Badge>
        );
      case UserRole.EMPLOYEE:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Briefcase className="w-3 h-3 mr-1" />
            Nhân viên
          </Badge>
        );
      case UserRole.USER:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Users className="w-3 h-3 mr-1" />
            Khách hàng
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Không xác định
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Tạm ngừng</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Không xác định</Badge>;
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Chi tiết người dùng
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết của người dùng: <strong>{user.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-charcoal">Thông tin cơ bản</h3>
              <div className="flex gap-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Họ và tên</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <UserIcon className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{user.fullName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Email</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{user.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Số điện thoại</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{user.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              {user.employeeCode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-walnut-600">Mã nhân viên</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="w-4 h-4 text-walnut-500" />
                    <span className="text-charcoal">{user.employeeCode}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          {user.address && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-charcoal">Địa chỉ</h3>
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-walnut-500 mt-0.5" />
                <div className="text-charcoal">{user.address}</div>
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
                  <span className="text-charcoal">{formatDate(user.createdAt.toString())}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-walnut-600">Cập nhật lần cuối</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-walnut-500" />
                  <span className="text-charcoal">{formatDate(user.updatedAt.toString())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 