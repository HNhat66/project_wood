'use client'

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Eye,
  Loader2,
  Package,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import APIClient from '@/lib/api';
import {
  useAuth,
  withEmployeeAuth,
} from '@/lib/auth-context';
import { ExtendedDashboardStats } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

function UtilitiesPage() {
  const { tokens } = useAuth();
  const client = new APIClient(tokens);

  // Query dashboard stats
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<ExtendedDashboardStats> => {
      const response = await client.getExtendedDashboardStats();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-wood-500" />
        <span className="ml-2 text-wood-600">Đang tải dữ liệu dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Có lỗi khi tải dữ liệu dashboard</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-wood-500 text-white px-4 py-2 rounded-md hover:bg-wood-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Create Order Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-wood-900 mb-2">Dashboard</h1>
          <p className="text-wood-600">Tổng quan kinh doanh và hoạt động cửa hàng</p>
        </div>

        <Link href="/dashboard/admin/orders/create">
          <button className="bg-gradient-to-r from-wood-500 to-wood-600 hover:from-wood-600 hover:to-wood-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 group">
            <Plus className="w-6 h-6" />
            Tạo đơn hàng mới
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>
      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-wood border border-wood-100">
        <h3 className="text-lg font-semibold text-wood-900 mb-6">
          Thao tác nhanh
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/admin/products/create" className="w-full flex">
            <button className="flex items-center justify-center p-4 border-2 border-wood-200 rounded-lg hover:border-wood-400 hover:bg-wood-50 transition-all group w-full">
              <div className="text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-wood-500 group-hover:text-wood-700" />
                <p className="font-medium text-wood-700">Thêm sản phẩm</p>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/admin/customers" className="w-full flex">
            <button className="flex items-center justify-center p-4 border-2 border-wood-200 rounded-lg hover:border-wood-400 hover:bg-wood-50 transition-all group w-full">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-wood-500 group-hover:text-wood-700" />
                <p className="font-medium text-wood-700">Quản lý khách hàng</p>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/admin/inventory-transaction" className="w-full flex">
            <button className="flex items-center justify-center p-4 border-2 border-wood-200 rounded-lg hover:border-wood-400 hover:bg-wood-50 transition-all group w-full">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-wood-500 group-hover:text-wood-700" />
                <p className="font-medium text-wood-700">Báo cáo kho</p>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/admin/categories" className="w-full flex">
            <button className="flex items-center justify-center p-4 border-2 border-wood-200 rounded-lg hover:border-wood-400 hover:bg-wood-50 transition-all group w-full">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-wood-500 group-hover:text-wood-700" />
                <p className="font-medium text-wood-700">Quản lý danh mục</p>
              </div>
            </button>
          </Link>
        </div>
      </div>
      {/* Low Stock Alert - High Priority */}
      {statsData && statsData.lowStockProducts > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">
                  ⚠️ Cảnh báo tồn kho
                </h3>
                <p className="text-red-700">Cần xử lý ngay lập tức</p>
              </div>
            </div>
            <Link href="/dashboard/admin/products">
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Xem ngay
              </button>
            </Link>
          </div>
          <div className="bg-white/70 rounded-lg p-4 border border-red-200">
            <p className="text-red-900 text-lg">
              Có <span className="font-bold text-2xl text-red-600">{statsData.lowStockProducts}</span> sản phẩm sắp hết hàng trong kho.
            </p>
            <p className="text-red-700 mt-1">
              Vui lòng kiểm tra và nhập thêm hàng để tránh gián đoạn kinh doanh.
            </p>
          </div>
        </div>
      )}

    </div>
  )
} 

export default withEmployeeAuth(UtilitiesPage)