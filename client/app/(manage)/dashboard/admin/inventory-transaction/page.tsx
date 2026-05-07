'use client'

import { useState } from 'react';

import {
  Calendar,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import APIClient from '@/lib/api';
import {
  useAuth,
  withEmployeeAuth,
} from '@/lib/auth-context';
import {
  InventoryTransaction,
  InventoryTransactionTableState,
  PaginatedResponse,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

function InventoryTransactionPage() {
  const [tableState, setTableState] = useState<InventoryTransactionTableState>({
    page: 1,
    limit: 10,
    search: '',
    transactionTypeFilter: 'all',
    productVariantIdFilter: '',
    referenceTypeFilter: 'all',
  });

  const { tokens } = useAuth();
  const client = new APIClient(tokens);

  // Query inventory transactions
  const { data: transactionsData, isLoading, error } = useQuery({
    queryKey: ['inventory-transactions', tableState],
    queryFn: async (): Promise<PaginatedResponse<InventoryTransaction>> => {
      const response = await client.inventoryTransaction().getInventoryTransactions({
        page: tableState.page,
        limit: tableState.limit,
        search: tableState.search || undefined,
        transactionType: tableState.transactionTypeFilter !== 'all' ? tableState.transactionTypeFilter as 'in' | 'out' | 'adjustment' : undefined,
        productVariantId: tableState.productVariantIdFilter ? parseInt(tableState.productVariantIdFilter) : undefined,
        referenceType: tableState.referenceTypeFilter !== 'all' ? tableState.referenceTypeFilter as 'order' | 'adjustment' | 'return' : undefined,
      });
      return response.data;
    }
  });

  const handleSearch = (value: string) => {
    setTableState(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleTransactionTypeFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, transactionTypeFilter: value, page: 1 }));
  };

  const handleReferenceTypeFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, referenceTypeFilter: value, page: 1 }));
  };

  const handleProductVariantIdFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, productVariantIdFilter: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setTableState(prev => ({ ...prev, page }));
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <TrendingUp className="w-3 h-3 mr-1" />
          Nhập kho
        </Badge>;
      case 'out':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <TrendingDown className="w-3 h-3 mr-1" />
          Xuất kho
        </Badge>;
      case 'adjustment':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <RotateCcw className="w-3 h-3 mr-1" />
          Điều chỉnh
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          {type}
        </Badge>;
    }
  };

  const getReferenceTypeBadge = (type?: string) => {
    if (!type) return null;
    
    switch (type) {
      case 'order':
        return <Badge variant="outline" className="text-xs">Đơn hàng</Badge>;
      case 'adjustment':
        return <Badge variant="outline" className="text-xs">Điều chỉnh</Badge>;
      case 'return':
        return <Badge variant="outline" className="text-xs">Trả hàng</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const columns = [
    {
      id: 'transaction',
      header: 'Giao dịch',
      cell: ({ row }: { row: InventoryTransaction }) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-charcoal">#{row.id}</span>
            {getTransactionTypeBadge(row.transactionType)}
          </div>
          {row.referenceType && (
            <div className="flex items-center gap-1">
              {getReferenceTypeBadge(row.referenceType)}
              {row.referenceId && (
                <span className="text-xs text-walnut-500">#{row.referenceId}</span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      cell: ({ row }: { row: InventoryTransaction }) => (
        <div>
          <div className="text-sm font-medium text-charcoal">
            {row.productVariant?.product?.name || 'N/A'}
          </div>
          <div className="text-xs text-walnut-500">
            {row.productVariant?.material?.name} - {row.productVariant?.size?.name}
          </div>
          <div className="text-xs text-walnut-400">
            SKU: {row.productVariant?.sku}
          </div>
        </div>
      )
    },
    {
      id: 'quantity',
      header: 'Số lượng',
      cell: ({ row }: { row: InventoryTransaction }) => (
        <div className="text-center">
          <div className={`text-sm font-medium ${
            row.transactionType === 'in' ? 'text-green-600' : 
            row.transactionType === 'out' ? 'text-red-600' : 'text-blue-600'
          }`}>
            {row.transactionType === 'in' ? '+' : row.transactionType === 'out' ? '-' : ''}
            {row.quantity}
          </div>
        </div>
      )
    },
    {
      id: 'reason',
      header: 'Lý do',
      cell: ({ row }: { row: InventoryTransaction }) => (
        <div>
          <div className="text-sm text-charcoal">
            {row.reason}
          </div>
          {row.notes && (
            <div className="text-xs text-walnut-500 mt-1">
              {row.notes}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'performedBy',
      header: 'Thực hiện bởi',
      cell: ({ row }: { row: InventoryTransaction }) => (
        <div className="text-sm text-charcoal">
          {row.performedBy?.fullName || 'N/A'}
        </div>
      )
    },
    {
      id: 'date',
      header: 'Ngày giao dịch',
      cell: ({ row }: { row: InventoryTransaction }) => (
        <div className="text-sm text-charcoal">
          {formatDate(row.transactionDate.toString())}
        </div>
      )
    },
  ];

  const transactions = transactionsData?.data || [];
  const totalTransactions = transactionsData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">Lịch sử kho hàng</h1>
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-walnut-400" />
              <Input
                placeholder="Tìm kiếm theo lý do, ghi chú, sản phẩm..."
                value={tableState.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={tableState.transactionTypeFilter} onValueChange={handleTransactionTypeFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="in">Nhập kho</SelectItem>
                <SelectItem value="out">Xuất kho</SelectItem>
                <SelectItem value="adjustment">Điều chỉnh</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tableState.referenceTypeFilter} onValueChange={handleReferenceTypeFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại tham chiếu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tham chiếu</SelectItem>
                <SelectItem value="order">Đơn hàng</SelectItem>
                <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                <SelectItem value="return">Trả hàng</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="ID Variant"
              value={tableState.productVariantIdFilter}
              onChange={(e) => handleProductVariantIdFilterChange(e.target.value)}
              className="w-[140px]"
              type="number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Lịch sử giao dịch ({totalTransactions})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={transactions}
            isLoading={isLoading}
            pagination={{
              page: tableState.page,
              totalPages: transactionsData?.totalPages || 1,
              onPageChange: handlePageChange
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
} 

export default withEmployeeAuth(InventoryTransactionPage)