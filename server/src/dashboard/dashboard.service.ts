import { And, LessThan, MoreThanOrEqual, Not, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ChartDataDto,
  DashboardComparisonDto,
  DashboardStatsDto,
  ExtendedDashboardStatsDto,
  MonthlyRevenueDto,
  RecentActivityDto,
  SalesAnalyticsDto,
} from '../common/dto/dashboard.dto';
import { Category } from '../entities/category.entity';
import { Customer } from '../entities/customer.entity';
import { Material } from '../entities/material.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Product } from '../entities/product.entity';
import { Size } from '../entities/size.entity';
import { User, UserStatus } from '../entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      totalProducts,
      totalVariants,
      totalCustomers,
      totalOrders,
      totalRevenue,
      lowStockCount,
      pendingOrdersCount,
      activeCategoriesCount,
    ] = await Promise.all([
      this.productRepository.count({ where: { isActive: true } }),
      this.productVariantRepository.count({ where: { isAvailable: true } }),
      this.customerRepository.count(),
      this.orderRepository.count({
        where: { orderStatus: Not(OrderStatus.CANCELLED) as any },
      }),
      this.getTotalRevenue(),
      this.getLowStockCount(),
      this.orderRepository.count({
        where: { orderStatus: OrderStatus.PENDING },
      }),
      this.categoryRepository.count({ where: { isActive: true } }),
    ]);

    return {
      totalProducts,
      totalVariants,
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue || 0,
      lowStockCount,
      pendingOrdersCount,
      activeCategoriesCount,
    };
  }

  async getExtendedDashboardStats(): Promise<ExtendedDashboardStatsDto> {
    const [
      totalProducts,
      totalCategories,
      totalCustomers,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      pendingOrders,
      lowStockProducts,
      activeUsers,
      totalMaterials,
      totalSizes,
      completedOrders,
      cancelledOrders,
      topSellingProducts,
      recentActivity,
    ] = await Promise.all([
      this.productRepository.count({ where: { isActive: true } }),
      this.categoryRepository.count({ where: { isActive: true } }),
      this.customerRepository.count(),
      this.orderRepository.count({
        where: { orderStatus: Not(OrderStatus.CANCELLED) as any },
      }),
      this.getTotalRevenue(),
      this.getMonthlyRevenue(),
      this.orderRepository.count({
        where: { orderStatus: OrderStatus.PENDING },
      }),
      this.getLowStockCount(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.materialRepository.count({ where: { isActive: true } }),
      this.sizeRepository.count({ where: { isActive: true } }),
      this.orderRepository.count({
        where: { orderStatus: OrderStatus.COMPLETED },
      }),
      this.orderRepository.count({
        where: { orderStatus: OrderStatus.CANCELLED },
      }),
      this.getTopSellingProductsForDashboard(),
      this.getRecentActivityForDashboard(),
    ]);

    return {
      totalProducts,
      totalCategories,
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue || 0,
      monthlyRevenue: monthlyRevenue || 0,
      pendingOrders,
      lowStockProducts,
      activeUsers,
      totalMaterials,
      totalSizes,
      completedOrders,
      cancelledOrders,
      topSellingProducts,
      recentActivity,
    };
  }

  async getRecentActivity(): Promise<RecentActivityDto> {
    const [recentOrders, lowStockVariants, recentCustomers] = await Promise.all(
      [
        this.getRecentOrders(),
        this.getLowStockVariants(),
        this.getRecentCustomers(),
      ],
    );

    return {
      recentOrders,
      lowStockVariants,
      recentCustomers,
    };
  }

  async getSalesAnalytics(): Promise<SalesAnalyticsDto> {
    const [monthlySales, topProducts, topCustomers, categoryPerformance] =
      await Promise.all([
        this.getMonthlySales(),
        this.getTopProducts(),
        this.getTopCustomers(),
        this.getCategoryPerformance(),
      ]);

    return {
      monthlySales,
      topProducts,
      topCustomers,
      categoryPerformance,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  private async getLowStockCount(): Promise<number> {
    return await this.productVariantRepository
      .createQueryBuilder('variant')
      .where('variant.stockQuantity <= variant.minStockLevel')
      .andWhere('variant.isAvailable = true')
      .getCount();
  }

  private async getRecentOrders() {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy('order.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.fullName,
      finalAmount: order.finalAmount,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    }));
  }

  private async getLowStockVariants() {
    const variants = await this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('variant.stockQuantity <= variant.minStockLevel')
      .andWhere('variant.isAvailable = true')
      .orderBy('variant.stockQuantity', 'ASC')
      .limit(10)
      .getMany();

    return variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      productName: variant.product.name,
      stockQuantity: variant.stockQuantity,
      minStockLevel: variant.minStockLevel,
    }));
  }

  private async getRecentCustomers() {
    const customers = await this.customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return customers.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      totalOrders: customer.orders.length,
      totalSpent: customer.totalSpent,
      createdAt: customer.createdAt.getTime(),
    }));
  }

  private async getMonthlySales() {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'YEAR(order.createdAt) as year',
        'MONTH(order.createdAt) as month',
        'SUM(order.finalAmount) as revenue',
        'COUNT(order.id) as orderCount',
      ])
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .andWhere('order.createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)')
      .groupBy('YEAR(order.createdAt), MONTH(order.createdAt)')
      .orderBy('year, month')
      .getRawMany();

    return result.map((row) => ({
      month: `${row.year}-${String(row.month).padStart(2, '0')}`,
      revenue: parseFloat(row.revenue) || 0,
      orderCount: parseInt(row.orderCount) || 0,
    }));
  }

  private async getTopProducts() {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.standardOrderItems', 'orderItem')
      .leftJoin('orderItem.productVariant', 'variant')
      .leftJoin('variant.product', 'product')
      .select([
        'product.id as productId',
        'product.name as productName',
        'SUM(orderItem.quantity) as totalSold',
        'SUM(orderItem.totalPrice) as totalRevenue',
      ])
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .groupBy('product.id, product.name')
      .orderBy('totalRevenue', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      totalSold: parseInt(row.totalSold) || 0,
      totalRevenue: parseFloat(row.totalRevenue) || 0,
    }));
  }

  private async getTopCustomers() {
    const customers = await this.customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.totalSpent', 'DESC')
      .limit(10)
      .getMany();

    return customers.map((customer) => ({
      customerId: customer.id,
      customerName: customer.fullName,
      totalOrders: customer.orders.length,
      totalSpent: customer.totalSpent,
    }));
  }

  private async getCategoryPerformance() {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.standardOrderItems', 'orderItem')
      .leftJoin('orderItem.productVariant', 'variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.category', 'category')
      .select([
        'category.id as categoryId',
        'category.name as categoryName',
        'SUM(orderItem.totalPrice) as totalRevenue',
        'COUNT(DISTINCT order.id) as orderCount',
      ])
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .groupBy('category.id, category.name')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    return result.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      totalRevenue: parseFloat(row.totalRevenue) || 0,
      orderCount: parseInt(row.orderCount) || 0,
    }));
  }

  async getDashboardComparison(): Promise<DashboardComparisonDto> {
    // Get current month data
    const currentMonth = new Date();
    const previousMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    const [
      currentProducts,
      previousProducts,
      currentCustomers,
      previousCustomers,
      currentOrders,
      previousOrders,
      currentRevenue,
      previousRevenue,
    ] = await Promise.all([
      // Current month products
      this.productRepository.count({
        where: {
          isActive: true,
          createdAt: MoreThanOrEqual(currentMonthStart),
        },
      }),
      // Previous month products
      this.productRepository.count({
        where: {
          isActive: true,
          createdAt: And(
            MoreThanOrEqual(previousMonth),
            LessThan(currentMonthStart),
          ),
        },
      }),
      // Current month customers
      this.customerRepository.count({
        where: {
          createdAt: MoreThanOrEqual(currentMonthStart),
        },
      }),
      // Previous month customers
      this.customerRepository.count({
        where: {
          createdAt: And(
            MoreThanOrEqual(previousMonth),
            LessThan(currentMonthStart),
          ),
        },
      }),
      // Current month orders
      this.orderRepository.count({
        where: {
          createdAt: MoreThanOrEqual(currentMonthStart),
          orderStatus: Not(OrderStatus.CANCELLED),
        },
      }),
      // Previous month orders
      this.orderRepository.count({
        where: {
          createdAt: And(
            MoreThanOrEqual(previousMonth),
            LessThan(currentMonthStart),
          ),
          orderStatus: Not(OrderStatus.CANCELLED),
        },
      }),
      // Current month revenue
      this.getRevenueForPeriod(currentMonthStart, new Date()),
      // Previous month revenue
      this.getRevenueForPeriod(previousMonth, currentMonthStart),
    ]);

    const calculateChange = (current: number, previous: number) => {
      const change = current - previous;
      const changePercent =
        previous > 0 ? ((change / previous) * 100).toFixed(1) : '100.0';
      return {
        current,
        previous,
        change,
        changePercent: `${change >= 0 ? '+' : ''}${changePercent}%`,
      };
    };

    return {
      products: calculateChange(currentProducts, previousProducts),
      customers: calculateChange(currentCustomers, previousCustomers),
      orders: calculateChange(currentOrders, previousOrders),
      revenue: calculateChange(currentRevenue, previousRevenue),
    };
  }

  async getMonthlyRevenueData(): Promise<MonthlyRevenueDto> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyData = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'YEAR(order.createdAt) as year',
        'MONTH(order.createdAt) as month',
        'SUM(order.finalAmount) as revenue',
        'COUNT(order.id) as orders',
      ])
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .andWhere('order.createdAt >= :startDate', { startDate: sixMonthsAgo })
      .groupBy('YEAR(order.createdAt), MONTH(order.createdAt)')
      .orderBy('year, month')
      .getRawMany();

    const formattedData = monthlyData.map((row, index) => {
      const revenue = parseFloat(row.revenue) || 0;
      const orders = parseInt(row.orders) || 0;
      const previousRevenue =
        index > 0 ? parseFloat(monthlyData[index - 1].revenue) || 0 : 0;
      const growth =
        previousRevenue > 0
          ? ((revenue - previousRevenue) / previousRevenue) * 100
          : 0;

      return {
        month: `T${String(row.month).padStart(2, '0')}`,
        revenue,
        orders,
        growth: Math.round(growth * 10) / 10,
      };
    });

    // Calculate trends
    const revenues = formattedData.map((d) => d.revenue);
    const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);
    const averageMonthlyRevenue = totalRevenue / revenues.length;

    const maxRevenueIndex = revenues.indexOf(Math.max(...revenues));
    const minRevenueIndex = revenues.indexOf(Math.min(...revenues));

    const firstMonth = revenues[0] || 0;
    const lastMonth = revenues[revenues.length - 1] || 0;
    const overallGrowth =
      firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

    return {
      monthlyData: formattedData,
      trends: {
        totalRevenue,
        averageMonthlyRevenue: Math.round(averageMonthlyRevenue),
        highestMonth: formattedData[maxRevenueIndex]?.month || '',
        highestRevenue: Math.max(...revenues),
        lowestMonth: formattedData[minRevenueIndex]?.month || '',
        lowestRevenue: Math.min(...revenues),
        overallGrowth: Math.round(overallGrowth * 10) / 10,
      },
    };
  }

  async getChartData(
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: Date,
    endDate: Date,
  ): Promise<ChartDataDto> {
    let queryBuilder = this.orderRepository.createQueryBuilder('order');
    let groupByClause: string;
    let selectClause: string[];
    let periodFormat: string;

    // Configure query based on period type
    switch (periodType) {
      case 'daily':
        groupByClause = 'DATE(order.createdAt)';
        selectClause = [
          'DATE(order.createdAt) as period',
          'DATE(order.createdAt) as date',
        ];
        periodFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupByClause =
          "YEAR(order.createdAt), WEEK(order.createdAt), CONCAT(YEAR(order.createdAt), '-W', LPAD(WEEK(order.createdAt), 2, '0')), DATE(DATE_SUB(order.createdAt, INTERVAL WEEKDAY(order.createdAt) DAY))";
        selectClause = [
          "CONCAT(YEAR(order.createdAt), '-W', LPAD(WEEK(order.createdAt), 2, '0')) as period",
          'DATE(DATE_SUB(order.createdAt, INTERVAL WEEKDAY(order.createdAt) DAY)) as date',
        ];
        break;
      case 'monthly':
        groupByClause =
          "YEAR(order.createdAt), MONTH(order.createdAt), CONCAT(YEAR(order.createdAt), '-', LPAD(MONTH(order.createdAt), 2, '0')), DATE(CONCAT(YEAR(order.createdAt), '-', LPAD(MONTH(order.createdAt), 2, '0'), '-01'))";
        selectClause = [
          "CONCAT(YEAR(order.createdAt), '-', LPAD(MONTH(order.createdAt), 2, '0')) as period",
          "DATE(CONCAT(YEAR(order.createdAt), '-', LPAD(MONTH(order.createdAt), 2, '0'), '-01')) as date",
        ];
        break;
      case 'yearly':
        groupByClause =
          "YEAR(order.createdAt), DATE(CONCAT(YEAR(order.createdAt), '-01-01'))";
        selectClause = [
          'YEAR(order.createdAt) as period',
          "DATE(CONCAT(YEAR(order.createdAt), '-01-01')) as date",
        ];
        break;
    }

    const revenueData = await queryBuilder
      .select([
        ...selectClause,
        'SUM(order.finalAmount) as revenue',
        'COUNT(order.id) as orders',
      ])
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .groupBy(groupByClause)
      .orderBy('date')
      .getRawMany();

    // Get customer data for the same periods
    const customerData = await this.customerRepository
      .createQueryBuilder('customer')
      .select([
        periodType === 'daily'
          ? 'DATE(customer.createdAt) as period'
          : periodType === 'weekly'
            ? "CONCAT(YEAR(customer.createdAt), '-W', LPAD(WEEK(customer.createdAt), 2, '0')) as period"
            : periodType === 'monthly'
              ? "CONCAT(YEAR(customer.createdAt), '-', LPAD(MONTH(customer.createdAt), 2, '0')) as period"
              : 'YEAR(customer.createdAt) as period',
        'COUNT(customer.id) as customers',
      ])
      .where('customer.createdAt >= :startDate', { startDate })
      .andWhere('customer.createdAt <= :endDate', { endDate })
      .groupBy(
        periodType === 'daily'
          ? 'DATE(customer.createdAt)'
          : periodType === 'weekly'
            ? "YEAR(customer.createdAt), WEEK(customer.createdAt), CONCAT(YEAR(customer.createdAt), '-W', LPAD(WEEK(customer.createdAt), 2, '0'))"
            : periodType === 'monthly'
              ? "YEAR(customer.createdAt), MONTH(customer.createdAt), CONCAT(YEAR(customer.createdAt), '-', LPAD(MONTH(customer.createdAt), 2, '0'))"
              : 'YEAR(customer.createdAt)',
      )
      .getRawMany();

    // Get product data for the same periods
    const productData = await this.productRepository
      .createQueryBuilder('product')
      .select([
        periodType === 'daily'
          ? 'DATE(product.createdAt) as period'
          : periodType === 'weekly'
            ? "CONCAT(YEAR(product.createdAt), '-W', LPAD(WEEK(product.createdAt), 2, '0')) as period"
            : periodType === 'monthly'
              ? "CONCAT(YEAR(product.createdAt), '-', LPAD(MONTH(product.createdAt), 2, '0')) as period"
              : 'YEAR(product.createdAt) as period',
        'COUNT(product.id) as products',
      ])
      .where('product.createdAt >= :startDate', { startDate })
      .andWhere('product.createdAt <= :endDate', { endDate })
      .andWhere('product.isActive = true')
      .groupBy(
        periodType === 'daily'
          ? 'DATE(product.createdAt)'
          : periodType === 'weekly'
            ? "YEAR(product.createdAt), WEEK(product.createdAt), CONCAT(YEAR(product.createdAt), '-W', LPAD(WEEK(product.createdAt), 2, '0'))"
            : periodType === 'monthly'
              ? "YEAR(product.createdAt), MONTH(product.createdAt), CONCAT(YEAR(product.createdAt), '-', LPAD(MONTH(product.createdAt), 2, '0'))"
              : 'YEAR(product.createdAt)',
      )
      .getRawMany();

    // Merge all data
    const dataMap = new Map();

    revenueData.forEach((item) => {
      dataMap.set(item.period, {
        period: item.period,
        revenue: parseFloat(item.revenue) || 0,
        orders: parseInt(item.orders) || 0,
        customers: 0,
        products: 0,
        date: item.date,
      });
    });

    customerData.forEach((item) => {
      const existing = dataMap.get(item.period) || {
        period: item.period,
        revenue: 0,
        orders: 0,
        customers: 0,
        products: 0,
        date: this.getDateForPeriod(item.period, periodType),
      };
      existing.customers = parseInt(item.customers) || 0;
      dataMap.set(item.period, existing);
    });

    productData.forEach((item) => {
      const existing = dataMap.get(item.period) || {
        period: item.period,
        revenue: 0,
        orders: 0,
        customers: 0,
        products: 0,
        date: this.getDateForPeriod(item.period, periodType),
      };
      existing.products = parseInt(item.products) || 0;
      dataMap.set(item.period, existing);
    });

    const chartData = Array.from(dataMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate summary
    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
    const totalCustomers = chartData.reduce(
      (sum, item) => sum + item.customers,
      0,
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate growth rate (compare first and last period)
    const firstPeriod = chartData[0];
    const lastPeriod = chartData[chartData.length - 1];
    const growthRate =
      firstPeriod && lastPeriod && firstPeriod.revenue > 0
        ? ((lastPeriod.revenue - firstPeriod.revenue) / firstPeriod.revenue) *
          100
        : 0;
    return {
      data: chartData,
      periodType,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue: Math.round(averageOrderValue),
        growthRate: Math.round(growthRate * 100) / 100,
      },
    };
  }

  private getDateForPeriod(period: string, periodType: string): string {
    switch (periodType) {
      case 'daily':
        return period;
      case 'weekly':
        // Convert "2024-W01" to first day of that week
        const [year, week] = period.split('-W');
        const firstDayOfYear = new Date(parseInt(year), 0, 1);
        const daysToAdd = (parseInt(week) - 1) * 7;
        const weekDate = new Date(
          firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
        );
        return weekDate.toISOString().split('T')[0];
      case 'monthly':
        return `${period}-01`;
      case 'yearly':
        return `${period}-01-01`;
      default:
        return period;
    }
  }

  private async getRevenueForPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  private async getMonthlyRevenue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .andWhere('order.createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)')
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  private async getTopSellingProductsForDashboard() {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.standardOrderItems', 'orderItem')
      .leftJoin('orderItem.productVariant', 'variant')
      .leftJoin('variant.product', 'product')
      .select([
        'product.id as id',
        'product.name as name',
        'SUM(orderItem.quantity) as sold',
        'SUM(orderItem.totalPrice) as revenue',
      ])
      .where('order.orderStatus != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .groupBy('product.id, product.name')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany();

    return result
      .filter((row) => row.revenue > 0)
      .map((row) => ({
        id: row.id,
        name: row.name,
        sold: parseInt(row.sold) || 0,
        revenue: parseFloat(row.revenue) || 0,
      }));
  }

  private async getRecentActivityForDashboard() {
    const recentOrders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy('order.createdAt', 'DESC')
      .limit(5)
      .getMany();

    return recentOrders.map((order) => ({
      id: order.id,
      type: 'ORDER' as const,
      description: `Đơn hàng ${order.orderNumber} - ${order.customer?.fullName || 'Khách hàng'}`,
      timestamp: order.createdAt.toISOString(),
    }));
  }
}
