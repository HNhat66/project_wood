import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  ChartDataDto,
  DashboardComparisonDto,
  DashboardStatsDto,
  ExtendedDashboardStatsDto,
  MonthlyRevenueDto,
  RecentActivityDto,
  SalesAnalyticsDto,
} from '../common/dto/dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê dashboard đã được lấy thành công',
    type: DashboardStatsDto,
  })
  getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Lấy dữ liệu hoạt động gần đây' })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu hoạt động gần đây đã được lấy thành công',
    type: RecentActivityDto,
  })
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('sales-analytics')
  @ApiOperation({ summary: 'Lấy dữ liệu phân tích doanh số' })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu phân tích doanh số đã được lấy thành công',
    type: SalesAnalyticsDto,
  })
  getSalesAnalytics() {
    return this.dashboardService.getSalesAnalytics();
  }

  @Get('extended-stats')
  @ApiOperation({ summary: 'Lấy thống kê dashboard mở rộng' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê dashboard mở rộng đã được lấy thành công',
    type: ExtendedDashboardStatsDto,
  })
  getExtendedStats() {
    return this.dashboardService.getExtendedDashboardStats();
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Lấy so sánh dashboard với tháng trước' })
  @ApiResponse({
    status: 200,
    description:
      'Dữ liệu so sánh dashboard với tháng trước đã được lấy thành công',
    type: DashboardComparisonDto,
  })
  getComparison() {
    return this.dashboardService.getDashboardComparison();
  }

  @Get('monthly-revenue')
  @ApiOperation({ summary: 'Lấy dữ liệu doanh thu hàng tháng cho biểu đồ' })
  @ApiResponse({
    status: 200,
    description:
      'Dữ liệu doanh thu hàng tháng cho biểu đồ đã được lấy thành công',
    type: MonthlyRevenueDto,
  })
  getMonthlyRevenue() {
    return this.dashboardService.getMonthlyRevenueData();
  }

  @Get('chart-data')
  @ApiOperation({
    summary: 'Lấy dữ liệu biểu đồ cho chu kỳ và khoảng thời gian cụ thể',
  })
  @ApiResponse({
    status: 200,
    description:
      'Dữ liệu biểu đồ cho chu kỳ và khoảng thời gian cụ thể đã được lấy thành công',
    type: ChartDataDto,
  })
  getChartData(
    @Query('periodType')
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.dashboardService.getChartData(periodType, start, end);
  }
}
