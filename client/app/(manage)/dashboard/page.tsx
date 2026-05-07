'use client'

import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import DashboardChart from '@/components/dashboard/DashboardChart';
import APIClient from '@/lib/api';
import {
  useAuth,
  withEmployeeAuth,
} from '@/lib/auth-context';
import { ExtendedDashboardStats } from '@/lib/types';
import {
  formatDate,
  formatPrice,
} from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

function AdminStatisticsPage() {
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

  // Query comparison data
  const { data: comparisonData } = useQuery({
    queryKey: ['dashboard-comparison'],
    queryFn: async () => {
      const response = await client.getDashboardComparison();
      return response.data;
    },
    refetchInterval: 30000,
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

  const stats = [
    {
      title: 'Tổng sản phẩm',
      value: statsData?.totalProducts.toLocaleString() || '0',
      change: comparisonData?.products.changePercent || '0%',
      trend: (comparisonData?.products.change || 0) >= 0 ? 'up' : 'down',
      icon: Package,
      color: 'wood'
    },
    {
      title: 'Khách hàng',
      value: statsData?.totalCustomers.toLocaleString() || '0',
      change: comparisonData?.customers.changePercent || '0%',
      trend: (comparisonData?.customers.change || 0) >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'walnut'
    },
    {
      title: 'Đơn hàng',
      value: statsData?.totalOrders.toLocaleString() || '0',
      change: comparisonData?.orders.changePercent || '0%',
      trend: (comparisonData?.orders.change || 0) >= 0 ? 'up' : 'down',
      icon: ShoppingCart,
      color: 'sage'
    },
    {
      title: 'Doanh thu',
      value: formatPrice(statsData?.totalRevenue || 0),
      change: comparisonData?.revenue.changePercent || '0%',
      trend: (comparisonData?.revenue.change || 0) >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'terracotta'
    }
  ];

  const additionalStats = [
    {
      title: 'Doanh thu tháng',
      value: formatPrice(statsData?.monthlyRevenue || 0),
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Đơn chờ xử lý',
      value: statsData?.pendingOrders.toLocaleString() || '0',
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Hoàn thành',
      value: statsData?.completedOrders.toLocaleString() || '0',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Đã hủy',
      value: statsData?.cancelledOrders.toLocaleString() || '0',
      icon: XCircle,
      color: 'red'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-wood border border-wood-100 hover:shadow-wood-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-wood-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-wood-900">
                    {stat.value}
                  </p>
                  <p className={`text-sm font-medium mt-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} so với tháng trước
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color === 'wood' ? 'bg-wood-100' :
                    stat.color === 'walnut' ? 'bg-walnut-100' :
                      stat.color === 'sage' ? 'bg-green-100' :
                        'bg-orange-100'
                  }`}>
                  <Icon className={`w-6 h-6 ${stat.color === 'wood' ? 'text-wood-600' :
                      stat.color === 'walnut' ? 'text-walnut-600' :
                        stat.color === 'sage' ? 'text-green-600' :
                          'text-orange-600'
                    }`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {additionalStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-lg p-4 shadow-wood border border-wood-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-wood-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-lg font-bold text-wood-900">
                    {stat.value}
                  </p>
                </div>
                <Icon className={`w-5 h-5 ${stat.color === 'blue' ? 'text-blue-500' :
                    stat.color === 'yellow' ? 'text-yellow-500' :
                      stat.color === 'green' ? 'text-green-500' :
                        'text-red-500'
                  }`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Advanced Chart Section */}
      <DashboardChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl p-6 shadow-wood border border-wood-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-wood-900">
              Sản phẩm bán chạy
            </h3>
            <Link href="/dashboard/admin/products">
              <button className="text-wood-600 hover:text-wood-800 text-sm font-medium flex items-center gap-1">
                Xem tất cả
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="space-y-4">
            {statsData?.topSellingProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 bg-wood-50 rounded-lg hover:bg-wood-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-wood-200 text-wood-800 font-bold text-sm">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-wood-900">{product.name}</p>
                    <p className="text-sm text-wood-600">Đã bán: {product.sold}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-wood-900">{formatPrice(product.revenue)}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                    }`}>
                    Top {index + 1}
                  </span>
                </div>
              </div>
            )) || (
                <div className="text-center py-8 text-wood-600">
                  <Package className="w-12 h-12 mx-auto mb-4 text-wood-400" />
                  <p>Chưa có dữ liệu sản phẩm</p>
                </div>
              )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-wood border border-wood-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-wood-900">
              Hoạt động gần đây
            </h3>
            <Link href="/dashboard/admin/orders">
              <button className="text-wood-600 hover:text-wood-800 text-sm font-medium flex items-center gap-1">
                Xem tất cả
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="space-y-4">
            {statsData?.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-wood-50 rounded-lg hover:bg-wood-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-wood-900">{activity.description}</p>
                  <p className="text-sm text-wood-600">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${activity.type === 'ORDER' ? 'bg-blue-100 text-blue-800' :
                      activity.type === 'PRODUCT' ? 'bg-green-100 text-green-800' :
                        activity.type === 'CUSTOMER' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                    }`}>
                    {activity.type === 'ORDER' ? 'Đơn hàng' :
                      activity.type === 'PRODUCT' ? 'Sản phẩm' :
                        activity.type === 'CUSTOMER' ? 'Khách hàng' :
                          'Đặt làm'}
                  </span>
                </div>
              </div>
            )) || (
                <div className="text-center py-8 text-wood-600">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-wood-400" />
                  <p>Chưa có hoạt động gần đây</p>
                </div>
              )}
          </div>
        </div>
      </div>


    </div>
  )
} 

export default withEmployeeAuth(AdminStatisticsPage)