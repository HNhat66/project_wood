'use client'

import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  Eye,
  FileText,
  LogIn,
  MessageSquarePlus,
  MoreHorizontal,
  Search,
  Shield,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  OrderTrackingTimelineCompact,
} from '@/components/common/OrderTrackingTimelineCompact';
import { AddTrackingLogModal } from '@/components/modals/AddTrackingLogModal';
import {
  UpdateOrderStatusWithLogModal,
} from '@/components/modals/UpdateOrderStatusWithLogModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { queryKeys } from '@/lib/react-query';
import {
  Order,
  OrdersTableProps,
  OrderStatus,
  OrderStatusColors,
  OrderStatusLabels,
  PaginatedResponse,
  UserRole,
} from '@/lib/types';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Order status colors and labels



const channelLabels: Record<string, string> = {
  'online': 'Trực tuyến',
  'offline': 'Tại cửa hàng',
}

// Pure table component that renders table and handles data fetching
function OrdersTable({
  currentPage,
  rowsPerPage,
  statusFilter,
  channelFilter,
  customerIdFilter,
  userIdFilter,
  searchFilter,
  onPageChange,
  onRowsPerPageChange,
  userRole,
}: OrdersTableProps) {
  const { tokens } = useAuth()
  const apiClient = new APIClient(tokens)
  const queryClient = useQueryClient()

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(searchFilter || '', 500)

  // Memoize query parameters
  const queryParams = useMemo(() => {
    if (userRole === 'admin') {
      return {
        page: currentPage,
        limit: rowsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        channel: channelFilter === 'all' ? undefined : (channelFilter as 'online' | 'offline'),
        customerId: customerIdFilter ? Number(customerIdFilter) : undefined,
        userId: userIdFilter ? Number(userIdFilter) : undefined,
        search: debouncedSearch || undefined,
      }
    } else {
      return {
        page: currentPage,
        limit: rowsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }
    }
  }, [currentPage, rowsPerPage, statusFilter, channelFilter, customerIdFilter, userIdFilter, debouncedSearch, userRole])

  // Fetch orders data
  const { data, isLoading, error, refetch, isFetching } = useQuery<PaginatedResponse<Order>>({
    queryKey: [UserRole.ADMIN, UserRole.EMPLOYEE].includes(userRole as UserRole)
      ? queryKeys.orders.list({ ...queryParams, admin: true })
      : queryKeys.orders.list(queryParams),
    queryFn: async () => {
      const response = [UserRole.ADMIN, UserRole.EMPLOYEE].includes(userRole as UserRole)
        ? await apiClient.order().getAllOrders(queryParams)
        : await apiClient.order().getOrders(queryParams)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!tokens?.accessToken,
  })

  // Cancel order mutation (for users)
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiClient.order().cancelOrder(orderId)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })



  const [cancellingOrderId, setCancellingOrderId] = useState<number | undefined>(undefined)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('')
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('')

  // Tracking log modals
  const [showAddTrackingLogModal, setShowAddTrackingLogModal] = useState(false)
  const [showUpdateStatusWithLogModal, setShowUpdateStatusWithLogModal] = useState(false)

  // Handle cancel order
  const handleCancelOrder = async (orderId: number): Promise<void> => {
    setCancellingOrderId(orderId)
    try {
      await cancelOrderMutation.mutateAsync(orderId)
      setCancellingOrderId(undefined)
      toast.success('Đơn hàng đã được hủy thành công')
    } catch (error: any) {
      setCancellingOrderId(undefined)
      toast.error(error.message || 'Có lỗi xảy ra khi hủy đơn hàng')
    }
  }



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }



  const openAddTrackingLogModal = (order: Order) => {
    setSelectedOrderId(order.id)
    setSelectedOrderNumber(order.orderNumber)
    setShowAddTrackingLogModal(true)
  }

  const openUpdateStatusWithLogModal = (order: Order) => {
    setSelectedOrderId(order.id)
    setSelectedOrderNumber(order.orderNumber)
    setSelectedOrderStatus(order.orderStatus)
    setShowUpdateStatusWithLogModal(true)
  }

  const handleTrackingLogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
  }

  const orders = data?.data || []
  const totalItems = data?.total || 0
  const totalPages = data?.totalPages || 1

  // Show authentication required message for user role
  if (userRole === UserRole.USER && !data && !isLoading && !isFetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="h-16 w-16 text-wood-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-wood-900 mb-2">
            Đăng nhập để xem đơn hàng
          </h3>
          <p className="text-walnut-600 mb-4">
            Bạn cần đăng nhập để xem danh sách đơn hàng của mình
          </p>
          <Button onClick={() => window.location.href = '/login'} className="bg-wood-500 hover:bg-wood-600">
            <LogIn className="h-4 w-4 mr-2" />
            Đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  // Loading state for initial load
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-wood-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-lg text-red-600">Lỗi tải dữ liệu</div>
        <div className="text-sm text-walnut-600">{error.message}</div>
        <Button onClick={() => refetch()} variant="outline">
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Table with loading overlay */}
      <div className="relative">
        {/* Loading overlay only for table */}
        {isFetching && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-wood-200">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-wood-500"></div>
              <div className="text-sm text-walnut-600">Đang tải...</div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-wood-300 scrollbar-track-wood-100 hover:scrollbar-thumb-wood-400"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d4844f #f1ddc7'
          }}>
          <Table className='border-collapse'>
            <TableHeader>
              <TableRow>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Kênh</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Đã thanh toán</TableHead>
                <TableHead>Còn lại</TableHead>
                <TableHead>Giao hàng</TableHead>
                <TableHead>Lý do hủy</TableHead>
                {userRole === UserRole.ADMIN && <TableHead>Tracking Logs</TableHead>}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-wood-100 rounded-lg flex items-center justify-center">
                        <span className="text-wood-600 font-medium text-xs">
                          #{order.id}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-charcoal">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-walnut-600">
                          {order.totalItems || 0} sản phẩm
                        </div>
                        {userRole === UserRole.ADMIN && (
                          <div className="text-xs text-walnut-500">
                            {order.userId ? `User ID: ${order.userId}` : ''}
                            {order.customerId ? `Customer ID: ${order.customerId}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-charcoal">
                        {order?.deliveryName}
                      </div>
                      <div className="text-walnut-600">
                        {order?.deliveryPhone}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {channelLabels[order.channel]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-walnut-600">
                      {formatDate(order.createdAt)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={OrderStatusColors[order.orderStatus]}>
                      {OrderStatusLabels[order.orderStatus as OrderStatus]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-charcoal">
                        {formatCurrency(order.finalAmount)}
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="text-xs text-walnut-500 line-through">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(order.depositAmount)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium text-orange-600">
                      {formatCurrency(order.remainingAmount)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-walnut-600 max-w-xs truncate">
                      {order.deliveryAddress}
                    </div>
                  </TableCell>


                  <TableCell>
                    {order.orderStatus === OrderStatus.CANCELLED ? order.reasonCancel : 'Không có'}
                  </TableCell>

                  {userRole === UserRole.ADMIN &&  (
                    <TableCell>
                      <OrderTrackingTimelineCompact
                        trackingLogs={order.trackingLogs || []}
                        orderNumber={order.orderNumber}
                      />
                    </TableCell>
                  )}

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tracking?order=${order.orderNumber}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>

                        {userRole === UserRole.USER && order.orderStatus === OrderStatus.AWAITING_PAYMENT_PROOF && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/orders/${order.orderNumber}/payment`}
                              className="text-wood-600"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Upload thanh toán
                            </Link>
                          </DropdownMenuItem>
                        )}

                        {userRole === UserRole.USER && [OrderStatus.PENDING, OrderStatus.APPROVED, OrderStatus.PROCESSING, OrderStatus.DELIVERY].includes(order.orderStatus) && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {cancellingOrderId === order.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                          </DropdownMenuItem>
                        )}

                        {userRole === UserRole.ADMIN && (
                          <>
                            <DropdownMenuItem
                              onClick={() => openAddTrackingLogModal(order)}
                            >
                              <MessageSquarePlus className="h-4 w-4 mr-2" />
                              Thêm tracking log
                            </DropdownMenuItem>

                            {order.orderStatus !== OrderStatus.COMPLETED && order.orderStatus !== OrderStatus.CANCELLED && (
                              <DropdownMenuItem
                                onClick={() => openUpdateStatusWithLogModal(order)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Cập nhật trạng thái
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-walnut-600 mb-4">
              Chưa có đơn hàng nào
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-1 mt-4">
        <div className="flex items-center gap-2 text-sm text-walnut-600">
          <span>Số dòng trên trang:</span>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => onRowsPerPageChange(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-walnut-600">
            {totalItems > 0 ? `${((currentPage - 1) * rowsPerPage) + 1}-${Math.min(currentPage * rowsPerPage, totalItems)} của ${totalItems}` : '0 đơn hàng'}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        </div>
      </div>



      {/* Add Tracking Log Modal */}
      <AddTrackingLogModal
        isOpen={showAddTrackingLogModal}
        onClose={() => setShowAddTrackingLogModal(false)}
        onSuccess={handleTrackingLogSuccess}
        orderId={selectedOrderId || 0}
        orderNumber={selectedOrderNumber}
      />

      {/* Update Order Status With Log Modal */}
      <UpdateOrderStatusWithLogModal
        isOpen={showUpdateStatusWithLogModal}
        onClose={() => setShowUpdateStatusWithLogModal(false)}
        onSuccess={handleTrackingLogSuccess}
        orderId={selectedOrderId || 0}
        orderNumber={selectedOrderNumber}
        currentStatus={selectedOrderStatus}
      />
    </>
  )
}

// Container component that only manages state
export function OrdersCard({ userRole }: { userRole: 'user' | 'admin' }) {
  // All state management in OrdersCard
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(userRole === 'admin' ? 20 : 10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [customerIdFilter, setCustomerIdFilter] = useState<string>('')
  const [userIdFilter, setUserIdFilter] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState<string>('')

  // Memoize handlers to prevent unnecessary re-renders
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleRowsPerPageChange = useCallback((rows: number) => {
    setRowsPerPage(rows)
    setCurrentPage(1)
  }, [])

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }, [])

  const handleChannelFilterChange = useCallback((channel: string) => {
    setChannelFilter(channel)
    setCurrentPage(1)
  }, [])

  const handleCustomerIdFilterChange = useCallback((customerId: string) => {
    setCustomerIdFilter(customerId)
    if (userIdFilter) {
      setUserIdFilter('')
    }
    setCurrentPage(1)
  }, [])

  const handleUserIdFilterChange = useCallback((userId: string) => {
    setUserIdFilter(userId)
    if (customerIdFilter) {
      setCustomerIdFilter('')
    }
    setCurrentPage(1)
  }, [])

  const handleSearchFilterChange = useCallback((search: string) => {
    setSearchFilter(search)
    setCurrentPage(1)
  }, [])

  return (
    <div className="space-y-6">
      <Card className='border-wood-200'>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div>
              <h2 className="text-xl font-semibold text-charcoal">
                {userRole === 'admin' ? 'Quản lý đơn hàng' : 'Đơn hàng của tôi'}
              </h2>
              <p className="text-walnut-600">
                Danh sách đơn hàng
              </p>
            </div>
          </div>

          {/* Admin Filters */}
          {userRole === 'admin' && (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-walnut-400" />
                <Input
                  placeholder="Tìm kiếm theo số đơn hàng, tên khách hàng..."
                  value={searchFilter || ''}
                  onChange={(e) => handleSearchFilterChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className='w-full'>
                    <SelectValue className='text-walnut-400' placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="delivery">Đang giao</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={channelFilter || 'all'} onValueChange={handleChannelFilterChange}>
                  <SelectTrigger className='w-full'>
                    <SelectValue className='text-walnut-400' placeholder="Tất cả kênh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả kênh</SelectItem>
                    <SelectItem value="online">Trực tuyến</SelectItem>
                    <SelectItem value="offline">Tại cửa hàng</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  className='w-full'
                  placeholder="ID người dùng"
                  value={userIdFilter || ''}
                  onChange={(e) => handleUserIdFilterChange(e.target.value)}
                  type="number"
                />

                <Input
                  className='w-full'
                  placeholder="ID khách hàng"
                  value={customerIdFilter || ''}
                  onChange={(e) => handleCustomerIdFilterChange(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          )}

          {/* User Status Filter */}
          {userRole === 'user' && (
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="delivery">Đang giao</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-3">
          {/* Table component with its own data fetching */}
          <OrdersTable
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            statusFilter={statusFilter}
            channelFilter={channelFilter}
            customerIdFilter={customerIdFilter}
            userIdFilter={userIdFilter}
            searchFilter={searchFilter}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onStatusFilterChange={handleStatusFilterChange}
            onChannelFilterChange={handleChannelFilterChange}
            onCustomerIdFilterChange={handleCustomerIdFilterChange}
            onUserIdFilterChange={handleUserIdFilterChange}
            onSearchFilterChange={handleSearchFilterChange}
            userRole={userRole}
          />
        </CardContent>
      </Card>
    </div>
  )
} 