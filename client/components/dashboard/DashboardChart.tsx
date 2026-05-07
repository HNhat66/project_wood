'use client'

import {
  useMemo,
  useState,
} from 'react';

import {
  addDays,
  format,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  BarChart3,
  CalendarIcon,
  Package,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  cn,
  formatPrice,
} from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface DateRange {
  from: Date;
  to: Date;
}

const chartConfig = {
  revenue: {
    label: 'Doanh thu',
    color: 'hsl(var(--chart-1))',
  },
  orders: {
    label: 'Đơn hàng',
    color: 'hsl(var(--chart-2))',
  },
  customers: {
    label: 'Khách hàng',
    color: 'hsl(var(--chart-3))',
  },
  products: {
    label: 'Sản phẩm',
    color: 'hsl(var(--chart-4))',
  },
};

const periodOptions = [
  { value: 'daily', label: 'Ngày', defaultDays: 30 },
  { value: 'weekly', label: 'Tuần', defaultDays: 84 }, // 12 weeks
  { value: 'monthly', label: 'Tháng', defaultDays: 365 }, // 12 months
  { value: 'yearly', label: 'Năm', defaultDays: 1825 }, // 5 years
];

const chartTypeOptions = [
  { value: 'area', label: 'Diện tích', icon: BarChart3 },
  { value: 'bar', label: 'Cột', icon: BarChart3 },
];

export default function DashboardChart() {
  const { tokens } = useAuth();
  const client = new APIClient(tokens);

  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'customers' | 'products'>('revenue');

  const defaultDays = periodOptions.find(p => p.value === periodType)?.defaultDays || 30;
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), defaultDays),
    to: new Date(),
  });

  // Validation function for max 1 year range
  const validateDateRange = (range: DateRange): boolean => {
    if (!range.from || !range.to) return false;
    const diffInDays = Math.abs((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 365;
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      const newRange = { from: range.from, to: range.to };
      if (validateDateRange(newRange)) {
        setDateRange(newRange);
      } else {
        // If range is too large, set to 1 year from start date
        setDateRange({
          from: range.from,
          to: addDays(range.from, 365)
        });
      }
    }
  };

  // Query chart data
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['chart-data', periodType, dateRange.from, dateRange.to],
    queryFn: async () => {
      const response = await client.getChartData({
        periodType,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });
      return response.data;
    },
    refetchInterval: 60000,
  });

  // Quick date range presets
  const presets = [
    {
      label: '7 ngày qua',
      value: () => ({
        from: subDays(new Date(), 7),
        to: new Date(),
      }),
    },
    {
      label: '30 ngày qua',
      value: () => ({
        from: subDays(new Date(), 30),
        to: new Date(),
      }),
    },
    {
      label: '3 tháng qua',
      value: () => ({
        from: subMonths(new Date(), 3),
        to: new Date(),
      }),
    },
    {
      label: '1 năm qua',
      value: () => ({
        from: subYears(new Date(), 1),
        to: new Date(),
      }),
    },
  ];

  const formatTooltipValue = (value: any, name: any) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (String(name) === 'revenue') {
      return formatPrice(numValue);
    }
    return numValue.toLocaleString();
  };

  const formatPeriodLabel = (period: string, type: string) => {
    switch (type) {
      case 'daily':
        return format(new Date(period), 'dd/MM', { locale: vi });
      case 'weekly':
        return `Tuần ${period.split('-W')[1]}`;
      case 'monthly':
        return format(new Date(period + '-01'), 'MM/yyyy', { locale: vi });
      case 'yearly':
        return period;
      default:
        return period;
    }
  };

  const chartDataFormatted = useMemo(() => {
    if (!chartData?.data) return [];
    return chartData.data.map(item => ({
      ...item,
      periodLabel: formatPeriodLabel(item.period, periodType),
    }));
  }, [chartData, periodType]);

  const renderChart = () => {
    if (!chartDataFormatted.length) return <div></div>;

    const commonProps = {
      data: chartDataFormatted,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodLabel"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                selectedMetric === 'revenue' ? formatPrice(value) : value.toLocaleString()
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Kỳ: ${label}`}
                  formatter={formatTooltipValue}
                />
              }
            />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={chartConfig[selectedMetric].color}
              fill={chartConfig[selectedMetric].color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodLabel"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                selectedMetric === 'revenue' ? formatPrice(value) : value.toLocaleString()
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Kỳ: ${label}`}
                  formatter={formatTooltipValue}
                />
              }
            />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={chartConfig[selectedMetric].color}
              strokeWidth={2}
              dot={{ fill: chartConfig[selectedMetric].color, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodLabel"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                selectedMetric === 'revenue' ? formatPrice(value) : value.toLocaleString()
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Kỳ: ${label}`}
                  formatter={formatTooltipValue}
                />
              }
            />
            <Bar
              dataKey={selectedMetric}
              fill={chartConfig[selectedMetric].color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      default:
        return <div></div>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Biểu đồ phân tích</CardTitle>
            <CardDescription>
              Theo dõi các chỉ số kinh doanh theo thời gian
            </CardDescription>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
          {/* Period Type */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Theo:</label>
            <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart Type */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Kiểu:</label>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Picker */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Khoảng thời gian:</label>

            {/* Calendar Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal min-w-[240px]',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} -{' '}
                        {format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy', { locale: vi })
                    )
                  ) : (
                    <span>Chọn khoảng thời gian</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <p className="text-sm text-muted-foreground mb-2">
                    Khoảng thời gian tối đa: 1 năm
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = preset.value();
                          if (validateDateRange(newRange)) {
                            setDateRange(newRange);
                          }
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                  locale={vi}
                  required
                  disabled={(date) => {
                    const today = new Date();
                    const oneYearAgo = subYears(today, 1);
                    return date > today || date < oneYearAgo;
                  }}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Current range info */}
            {dateRange.from && dateRange.to && (
              <div className="text-xs text-muted-foreground">
                Khoảng thời gian: {Math.abs((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} ngày
                {!validateDateRange(dateRange) && (
                  <span className="text-red-500 ml-2">
                    (Quá 1 năm - sẽ tự động điều chỉnh)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Metric Tabs */}
        <Tabs value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Doanh thu</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Đơn hàng</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Khách hàng</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Sản phẩm</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedMetric} className="mt-6">
            {/* Summary Stats */}
            {chartData?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng doanh thu</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(chartData.summary.totalRevenue)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                  <p className="text-lg font-bold text-gray-900">
                    {chartData.summary.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Khách hàng mới</p>
                  <p className="text-lg font-bold text-gray-900">
                    {chartData.summary.totalCustomers.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tăng trưởng</p>
                  <p className={`text-lg font-bold ${chartData.summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {chartData.summary.growthRate >= 0 ? '+' : ''}{chartData.summary.growthRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">Có lỗi khi tải dữ liệu</p>
                    <Button onClick={() => window.location.reload()} size="sm">
                      Thử lại
                    </Button>
                  </div>
                </div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 