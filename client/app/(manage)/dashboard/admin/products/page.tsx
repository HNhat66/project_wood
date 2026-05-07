'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  Edit,
  Package,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import APIClient from '@/lib/api';
import {
  useAuth,
  withEmployeeAuth,
} from '@/lib/auth-context';
import {
  AdminProductsTableState,
  Category,
  PaginatedResponse,
  Product,
} from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

function AdminProductsPage() {
  const [tableState, setTableState] = useState<AdminProductsTableState>({
    page: 1,
    limit: 10,
    search: '',
    statusFilter: 'all',
    categoryFilter: 'all',
    stockFilter: 'all'
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const { tokens } = useAuth();
  const queryClient = useQueryClient();
  const client = new APIClient(tokens);

  // Load categories for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await client.category().getCategories({ limit: 100 });
        setCategories(response.data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Query products
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['admin-products', tableState],
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      const response = await client.product().getProducts({
        page: tableState.page,
        limit: tableState.limit,
        search: tableState.search || undefined,
        statusFilter: tableState.statusFilter,
        categoryFilter: tableState.categoryFilter,
        stockFilter: tableState.stockFilter,
        withVariants: true
      });
      return response.data;
    }
  });

  // Toggle product status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await client.product().toggleProductStatus(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Cập nhật trạng thái sản phẩm thành công');
    },
    onError: (error) => {
      console.error('Toggle error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái sản phẩm');
    }
  });

  const handleSearch = (value: string) => {
    setTableState(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, statusFilter: value, page: 1 }));
  };

  const handleCategoryFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, categoryFilter: value, page: 1 }));
  };

  const handleStockFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, stockFilter: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setTableState(prev => ({ ...prev, page }));
  };

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id);
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ngừng bán</Badge>
    );
  };

  const getStockStatus = (variants: any[] = []) => {
    const totalStock = variants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0);

    if (totalStock === 0) {
      return <span className="text-red-600 font-medium">Hết hàng</span>;
    } else if (totalStock < 10) {
      return <span className="text-orange-600 font-medium">Sắp hết ({totalStock})</span>;
    } else {
      return <span className="text-green-600 font-medium">Còn hàng ({totalStock})</span>;
    }
  };

  const columns = [
    {
      id: 'product',
      header: 'Sản phẩm',
      cell: ({ row }: { row: Product }) => (
        <div>
          <div className="text-sm font-medium text-charcoal">
            {row.name}
          </div>
          <div className="text-sm text-walnut-500 max-w-xs truncate">
            {row.description}
          </div>
        </div>
      )
    },
    {
      id: 'category',
      header: 'Danh mục',
      cell: ({ row }: { row: Product }) => (
        <span className="px-2 py-1 bg-wood-100 text-wood-700 text-xs rounded-full">
          {row.category?.name || 'N/A'}
        </span>
      )
    },
    {
      id: 'basePrice',
      header: 'Giá cơ sở',
      cell: ({ row }: { row: Product }) => (
        <div className="text-sm text-charcoal">
          {formatPrice(row.basePrice)}
        </div>
      )
    },
    {
      id: 'variants',
      header: 'Biến thể',
      cell: ({ row }: { row: Product }) => (
        <div className="text-sm text-charcoal">
          {row.variantCount || row.variants?.length || 0} biến thể
        </div>
      )
    },
    {
      id: 'stock',
      header: 'Tồn kho',
      cell: ({ row }: { row: Product }) => (
        <div className="text-sm">
          {getStockStatus(row.variants)}
        </div>
      )
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }: { row: Product }) => getStatusBadge(row.isActive)
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }: { row: Product }) => (
        <div className="flex items-center justify-end space-x-2">
          <Link href={`/dashboard/admin/products/${row.id}/inventory`}>
            <Button variant="ghost" size="icon" className="text-wood-600 hover:text-wood-900">
              <Package className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/dashboard/admin/products/${row.id}/edit`}>
            <Button variant="ghost" size="icon" className="text-wood-600 hover:text-wood-900">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Switch
            checked={row.isActive}
            onCheckedChange={() => handleToggleStatus(row.id)}
          />
        </div>
      )
    }
  ];

  const products = productsData?.data || [];
  const totalProducts = productsData?.total || 0;
  const activeProducts = products.filter((p: Product) => p.isActive).length;
  const inactiveProducts = products.filter((p: Product) => !p.isActive).length;
  const lowStockProducts = products.filter((p: Product) => {
    const totalStock = p.variants?.reduce((sum: number, variant: any) => sum + (variant.stockQuantity || 0), 0) || 0;
    return totalStock < 10 && totalStock > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">Quản lý sản phẩm</h1>
        <Link href="/dashboard/admin/products/create">
          <Button className="bg-wood-500 hover:bg-wood-600">
            <Plus className="w-4 h-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-charcoal">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-wood-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Đang bán</p>
                <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Ngừng bán</p>
                <p className="text-2xl font-bold text-red-600">{inactiveProducts}</p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Sắp hết hàng</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-walnut-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={tableState.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={tableState.statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang bán</SelectItem>
                <SelectItem value="inactive">Ngừng bán</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tableState.categoryFilter} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories?.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tableState.stockFilter} onValueChange={handleStockFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tồn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="in_stock">Còn hàng</SelectItem>
                <SelectItem value="low_stock">Sắp hết</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({totalProducts})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            pagination={{
              page: tableState.page,
              totalPages: productsData?.totalPages || 1,
              onPageChange: handlePageChange
            }}
          />
        </CardContent>
      </Card>

    </div>
  )
} 

export default withEmployeeAuth(AdminProductsPage)