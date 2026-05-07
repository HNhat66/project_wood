'use client'

import { useState } from 'react';

import {
  DollarSign,
  Edit,
  Eye,
  Mail,
  Phone,
  Search,
  ShoppingCart,
  UserCheck,
  Users,
} from 'lucide-react';

import EditCustomerModal from '@/components/modals/EditCustomerModal';
import ViewCustomerModal from '@/components/modals/ViewCustomerModal';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Customer,
  PaginatedResponse,
} from '@/lib/types';
import {
  formatCurrency,
  formatDate,
} from '@/lib/utils';
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

interface AdminCustomersTableState {
  page: number
  limit: number
  search: string
  typeFilter: string
  statusFilter: string
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
}

export default function AdminCustomersPage() {
  const [tableState, setTableState] = useState<AdminCustomersTableState>({
    page: 1,
    limit: 20,
    search: '',
    typeFilter: 'all',
    statusFilter: 'all',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  })

  // Modal states
  const [editCustomerModalOpen, setEditCustomerModalOpen] = useState(false)
  const [viewCustomerModalOpen, setViewCustomerModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const queryClient = useQueryClient()
  const { tokens } = useAuth()
  const client = new APIClient(tokens)

  // Query customers
  const { data: customersData, isLoading, error } = useQuery({
    queryKey: ['admin-customers', tableState],
    queryFn: async (): Promise<PaginatedResponse<Customer>> => {
      const response = await client.customer().getCustomers({
        page: tableState.page,
        limit: tableState.limit,
        search: tableState.search || undefined,
        typeFilter: tableState.typeFilter === 'all' ? undefined : tableState.typeFilter,
        statusFilter: tableState.statusFilter === 'all' ? undefined : tableState.statusFilter,
        sortBy: tableState.sortBy,
        sortOrder: tableState.sortOrder,
      })
      return response.data
    }
  })

  const handleSearch = (value: string) => {
    setTableState(prev => ({ ...prev, search: value, page: 1 }))
  }
  const handlePageChange = (page: number) => {
    setTableState(prev => ({ ...prev, page }))
  }

  const handleSort = (sortBy: string, sortOrder: 'ASC' | 'DESC') => {
    setTableState(prev => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewCustomerModalOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditCustomerModalOpen(true)
  }


  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }: { row: Customer }) => (
        <span className="text-xs text-walnut-500 font-mono">
          #{row.id}
        </span>
      )
    },
    {
      accessorKey: 'customerCode',
      header: 'Mã khách hàng',
      cell: ({ row }: { row: Customer }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.customerCode}
        </Badge>
      )
    },
    {
      id: 'customer',
      header: 'Thông tin khách hàng',
      cell: ({ row }: { row: Customer }) => (
        <div>
          <div className="text-sm font-medium text-charcoal">
            {row.fullName}
          </div>
          <div className="text-sm text-walnut-500 flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {row.phone}
          </div>
          {row.email && (
            <div className="text-xs text-walnut-400 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {row.email}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'totalOrders',
      header: 'Số đơn hàng',
      cell: ({ row }: { row: Customer }) => (
        <Badge variant={row.totalOrders > 0 ? "default" : "secondary"}>
          {row.totalOrders}
        </Badge>
      )
    },
    {
      accessorKey: 'totalSpent',
      header: 'Tổng chi tiêu',
      cell: ({ row }: { row: Customer }) => (
        <span className={`font-medium ${row.totalSpent > 0 ? "text-wood-600" : "text-walnut-400"}`}>
          {formatCurrency(row.totalSpent)}
        </span>
      )
    },
    {
      accessorKey: 'lastOrderDate',
      header: 'Đơn gần nhất',
      cell: ({ row }: { row: Customer }) => (
        <div className="text-sm">
          {row.lastOrderDate ? formatDate(row.lastOrderDate) : (
            <span className="text-walnut-400">Chưa có</span>
          )}
        </div>
      )
    },
    {
      id: 'createdBy',
      header: 'Người tạo',
      cell: ({ row }: { row: Customer }) => (
        <div className="text-sm text-walnut-600">
          {row.createdBy?.fullName || 'N/A'}
        </div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }: { row: Customer }) => (
        <div className="text-sm text-charcoal">
          {formatDate(row.createdAt?.toString())}
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }: { row: Customer }) => (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-wood-600 hover:text-wood-900"
            onClick={() => handleViewCustomer(row)}
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-600 hover:text-blue-900"
            onClick={() => handleEditCustomer(row)}
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const customers = customersData?.data || []
  const totalCustomers = customersData?.total || 0
  const activeCustomers = customers.filter((c: Customer) => c.totalOrders > 0).length
  const totalRevenue = customers.reduce((sum: number, c: Customer) => sum + (c.totalSpent || 0), 0)
  const totalOrders = customers.reduce((sum: number, c: Customer) => sum + (c.totalOrders || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">Quản lý khách hàng</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-charcoal">{totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-wood-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Khách hàng tích cực</p>
                <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-wood-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-wood-500" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Data Table */}
      <Card>
        <CardHeader className='space-y-4'>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-walnut-400" />
            <Input
              placeholder="Tìm kiếm theo tên, SĐT, email, mã KH..."
              value={tableState.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <CardTitle>Danh sách khách hàng ({totalCustomers})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customers}
            isLoading={isLoading}
            pagination={{
              page: tableState.page,
              totalPages: customersData?.totalPages || 1,
              onPageChange: handlePageChange
            }}
          />
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={editCustomerModalOpen}
        onClose={() => {
          setEditCustomerModalOpen(false)
          setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
        }}
      />

      {/* View Customer Modal */}
      <ViewCustomerModal
        isOpen={viewCustomerModalOpen}
        onClose={() => {
          setViewCustomerModalOpen(false)
          setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
      />
    </div>
  )
}
