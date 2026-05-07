import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Tổng số sản phẩm',
    example: 50,
  })
  totalProducts: number;

  @ApiProperty({
    description: 'Tổng số phiên bản sản phẩm',
    example: 200,
  })
  totalVariants: number;

  @ApiProperty({
    description: 'Tổng số khách hàng',
    example: 150,
  })
  totalCustomers: number;

  @ApiProperty({
    description: 'Tổng số đơn hàng',
    example: 320,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Tổng doanh thu (VND)',
    example: 50000000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Số lượng phiên bản sản phẩm có ít tồn kho',
    example: 5,
  })
  lowStockCount: number;

  @ApiProperty({
    description: 'Số lượng đơn hàng chờ xử lý',
    example: 8,
  })
  pendingOrdersCount: number;

  @ApiProperty({
    description: 'Số lượng danh mục hoạt động',
    example: 12,
  })
  activeCategoriesCount: number;
}

export class ExtendedDashboardStatsDto {
  @ApiProperty({
    description: 'Tổng số sản phẩm',
    example: 50,
  })
  totalProducts: number;

  @ApiProperty({
    description: 'Tổng số danh mục',
    example: 12,
  })
  totalCategories: number;

  @ApiProperty({
    description: 'Tổng số khách hàng',
    example: 150,
  })
  totalCustomers: number;

  @ApiProperty({
    description: 'Tổng số đơn hàng',
    example: 320,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Tổng doanh thu (VND)',
    example: 50000000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Doanh thu tháng (VND)',
    example: 8000000,
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: 'Số lượng đơn hàng chờ xử lý',
    example: 8,
  })
  pendingOrders: number;

  @ApiProperty({
    description: 'Số lượng sản phẩm có ít tồn kho',
    example: 5,
  })
  lowStockProducts: number;

  @ApiProperty({
    description: 'Số lượng người dùng hoạt động',
    example: 25,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Tổng số vật liệu',
    example: 15,
  })
  totalMaterials: number;

  @ApiProperty({
    description: 'Tổng số kích thước',
    example: 20,
  })
  totalSizes: number;

  @ApiProperty({
    description: 'Số lượng đơn hàng hoàn thành',
    example: 280,
  })
  completedOrders: number;

  @ApiProperty({
    description: 'Số lượng đơn hàng hủy',
    example: 12,
  })
  cancelledOrders: number;

  @ApiProperty({
    description: 'Sản phẩm bán chạy nhất',
    isArray: true,
  })
  topSellingProducts: Array<{
    id: number;
    name: string;
    sold: number;
    revenue: number;
  }>;

  @ApiProperty({
    description: 'Hoạt động gần đây',
    isArray: true,
  })
  recentActivity: Array<{
    id: number;
    type: 'ORDER' | 'PRODUCT' | 'CUSTOMER' | 'CUSTOM_REQUEST';
    description: string;
    timestamp: string;
  }>;
}

export class DashboardComparisonDto {
  @ApiProperty({
    description: 'So sánh sản phẩm với tháng trước',
  })
  products: {
    current: number;
    previous: number;
    change: number;
    changePercent: string;
  };

  @ApiProperty({
    description: 'So sánh khách hàng với tháng trước',
  })
  customers: {
    current: number;
    previous: number;
    change: number;
    changePercent: string;
  };

  @ApiProperty({
    description: 'So sánh đơn hàng với tháng trước',
  })
  orders: {
    current: number;
    previous: number;
    change: number;
    changePercent: string;
  };

  @ApiProperty({
    description: 'So sánh doanh thu với tháng trước',
  })
  revenue: {
    current: number;
    previous: number;
    change: number;
    changePercent: string;
  };
}

export class MonthlyRevenueDto {
  @ApiProperty({
    description: 'Dữ liệu doanh thu tháng cho biểu đồ',
    isArray: true,
  })
  monthlyData: Array<{
    month: string;
    revenue: number;
    orders: number;
    growth: number;
  }>;

  @ApiProperty({
    description: 'Xu hướng và thống kê doanh thu',
  })
  trends: {
    totalRevenue: number;
    averageMonthlyRevenue: number;
    highestMonth: string;
    highestRevenue: number;
    lowestMonth: string;
    lowestRevenue: number;
    overallGrowth: number;
  };
}

export class ChartDataDto {
  @ApiProperty({
    description: 'Điểm dữ liệu cho biểu đồ',
    isArray: true,
  })
  data: Array<{
    period: string;
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    date: string;
  }>;

  @ApiProperty({
    description: 'Loại chu kỳ biểu đồ',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
  })
  periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Khoảng thời gian',
  })
  dateRange: {
    from: string;
    to: string;
  };

  @ApiProperty({
    description: 'Thống kê tổng quan',
  })
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    growthRate: number;
  };
}

export class RecentActivityDto {
  @ApiProperty({
    description: 'Đơn hàng gần đây (10)',
  })
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    customerName: string;
    finalAmount: number;
    orderStatus: string;
  }>;

  @ApiProperty({
    description: 'Phiên bản sản phẩm có ít tồn kho',
  })
  lowStockVariants: Array<{
    id: number;
    sku: string;
    productName: string;
    stockQuantity: number;
    minStockLevel: number;
  }>;

  @ApiProperty({
    description: 'Khách hàng gần đây (10)',
  })
  recentCustomers: Array<{
    id: number;
    fullName: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    createdAt: number;
  }>;
}

export class SalesAnalyticsDto {
  @ApiProperty({
    description: 'Dữ liệu doanh thu tháng cho 12 tháng gần đây',
  })
  monthlySales: Array<{
    month: string;
    revenue: number;
    orderCount: number;
  }>;

  @ApiProperty({
    description: 'Sản phẩm bán chạy nhất',
  })
  topProducts: Array<{
    productId: number;
    productName: string;
    totalSold: number;
    totalRevenue: number;
  }>;

  @ApiProperty({
    description: 'Khách hàng bán chạy nhất',
  })
  topCustomers: Array<{
    customerId: number;
    customerName: string;
    totalOrders: number;
    totalSpent: number;
  }>;

  @ApiProperty({
    description: 'Hiệu suất danh mục',
  })
  categoryPerformance: Array<{
    categoryId: number;
    categoryName: string;
    totalRevenue: number;
    orderCount: number;
  }>;
}
