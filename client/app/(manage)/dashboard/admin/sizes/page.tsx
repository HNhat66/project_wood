'use client'

import { useState } from 'react';

import {
  Edit,
  Plus,
  Ruler,
  Search,
  Trash,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import APIClient from '@/lib/api';
import {
  useAuth,
  withAdminAuth,
} from '@/lib/auth-context';
import { Size } from '@/lib/types';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

interface AdminSizesTableState {
  page: number;
  limit: number;
  search: string;
  active: string;
}

interface SizeFormData {
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;   
  isActive: boolean;
}

function AdminSizesPage() {
  const [tableState, setTableState] = useState<AdminSizesTableState>({
    page: 1,
    limit: 10,
    search: '',
    active: 'all'
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<Size | null>(null);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sizeToEdit, setSizeToEdit] = useState<Size | null>(null);

  const queryClient = useQueryClient();
  const {tokens} = useAuth();
  const client = new APIClient(tokens);

  // React Hook Form for create
  const createForm = useForm<SizeFormData>({
    defaultValues: {
      name: '',
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
      isActive: true
    }
  });

  // React Hook Form for edit
  const editForm = useForm<SizeFormData>({
    defaultValues: {
      name: '',
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,  
      isActive: true
    }
  });

  // Query sizes
  const { data: sizesData, isLoading, error } = useQuery({
    queryKey: ['admin-sizes', tableState],
    queryFn: async (): Promise<Size[]> => {
      const response = await client.size().getSizes({
        page: tableState.page,
        limit: tableState.limit,
        search: tableState.search || undefined,
        active: tableState.active !== 'all' ? tableState.active : undefined
      });
      return response.data;
    }
  });

  // Create size mutation
  const createSizeMutation = useMutation({
    mutationFn: (data: SizeFormData) => client.size().createSize(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sizes'] });
      toast.success('Tạo kích thước thành công!');
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      console.error('Error creating size:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo kích thước');
    }
  });

  // Update size mutation
  const updateSizeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SizeFormData }) => 
      client.size().updateSize(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sizes'] });
      toast.success('Cập nhật kích thước thành công!');
      setEditDialogOpen(false);
      setSizeToEdit(null);
      editForm.reset();
    },
    onError: (error: any) => {
      console.error('Error updating size:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật kích thước');
    }
  });

  // Delete size mutation
  const deleteSizeMutation = useMutation({
    mutationFn: (id: number) => client.size().deleteSize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sizes'] });
      toast.success('Xóa kích thước thành công!');
      setDeleteDialogOpen(false);
      setSizeToDelete(null);
    },
    onError: (error: any) => {
      console.error('Error deleting size:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi xóa kích thước');
    }
  });

  const handleSearch = (value: string) => {
    setTableState(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, active: value, page: 1 }));
  };

  const handleCreateClick = () => {
    createForm.reset();
    setCreateDialogOpen(true);
  };

  const handleEditClick = (size: Size) => {
    setSizeToEdit(size);
    editForm.reset({
      name: size.name,
      lengthCm: size.lengthCm,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      isActive: size.isActive
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (size: Size) => {
    setSizeToDelete(size);
    setDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (data: SizeFormData) => {
    createSizeMutation.mutate(data);
  };

  const handleEditSubmit = (data: SizeFormData) => {
    if (sizeToEdit) {
      updateSizeMutation.mutate({ id: sizeToEdit.id, data });
    }
  };

  const handleDeleteConfirm = () => {
    if (sizeToDelete) {
      deleteSizeMutation.mutate(sizeToDelete.id);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>
      : <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Tạm ngừng</Badge>;
  };

  const formatDimensions = (size: Size) => {
    return `${size.lengthCm}×${size.widthCm}×${size.heightCm} cm`;
  };

  const sizes = sizesData || [];
  const totalSizes = sizes.length;
  const activeSizes = sizes.filter(s => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">Quản lý kích thước</h1>
        <Button 
          className="bg-wood-500 hover:bg-wood-600"
          onClick={handleCreateClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm kích thước
        </Button>
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-walnut-400" />
              <Input
                placeholder="Tìm kiếm kích thước..."
                value={tableState.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={tableState.active} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm ngừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sizes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách kích thước ({totalSizes})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-wood-500"></div>
              <p className="mt-2 text-wood-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu</p>
            </div>
          ) : sizes.length === 0 ? (
            <div className="text-center py-12">
              <Ruler className="w-16 h-16 text-wood-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-wood-900 mb-2">
                Không tìm thấy kích thước
              </h3>
              <p className="text-wood-600">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-wood-300 scrollbar-track-wood-100 hover:scrollbar-thumb-wood-400"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d4844f #f1ddc7'
              }}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-wood-50 border-b border-wood-200">
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Tên kích thước
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Kích thước (D×R×C)
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Trạng thái
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes.map((size) => (
                    <TableRow key={size.id} className="hover:bg-wood-50 transition-colors border-b border-wood-200">
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-charcoal">
                          {size.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-charcoal">
                          {formatDimensions(size)}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(size.isActive)}
                      </TableCell>  
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-wood-600 hover:text-wood-900"
                            onClick={() => handleEditClick(size)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(size)}
                            disabled={deleteSizeMutation.isPending}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Size Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm kích thước mới</DialogTitle>
            <DialogDescription>
              Điền thông tin kích thước mới. Nhấn lưu khi hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Tên kích thước</Label>
              <Input
                id="create-name"
                placeholder="Nhập tên kích thước"
                {...createForm.register('name', { required: 'Tên kích thước là bắt buộc' })}
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-red-600">{createForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-length">Dài (cm)</Label>
                <Input
                  id="create-length"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.0"
                  {...createForm.register('lengthCm', { 
                    required: 'Chiều dài là bắt buộc',
                    min: { value: 0.1, message: 'Chiều dài phải lớn hơn 0' },
                    valueAsNumber: true
                  })}
                />
                {createForm.formState.errors.lengthCm && (
                  <p className="text-sm text-red-600">{createForm.formState.errors.lengthCm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-width">Rộng (cm)</Label>
                <Input
                  id="create-width"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.0"
                  {...createForm.register('widthCm', { 
                    required: 'Chiều rộng là bắt buộc',
                    min: { value: 0.1, message: 'Chiều rộng phải lớn hơn 0' },
                    valueAsNumber: true
                  })}
                />
                {createForm.formState.errors.widthCm && (
                  <p className="text-sm text-red-600">{createForm.formState.errors.widthCm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-height">Cao/Dày (cm)</Label>
                <Input
                  id="create-height"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.0"
                  {...createForm.register('heightCm', { 
                    required: 'Chiều cao là bắt buộc',
                    min: { value: 0.1, message: 'Chiều cao phải lớn hơn 0' },
                    valueAsNumber: true
                  })}
                />
                {createForm.formState.errors.heightCm && (
                  <p className="text-sm text-red-600">{createForm.formState.errors.heightCm.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-isActive"
                checked={createForm.watch('isActive')}
                onCheckedChange={(checked) => createForm.setValue('isActive', checked)}
              />
              <Label htmlFor="create-isActive">Kích hoạt ngay</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createSizeMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createSizeMutation.isPending}
                className="bg-wood-500 hover:bg-wood-600"
              >
                {createSizeMutation.isPending ? 'Đang tạo...' : 'Tạo kích thước'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Size Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa kích thước</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin kích thước {sizeToEdit?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên kích thước</Label>
              <Input
                id="edit-name"
                placeholder="Nhập tên kích thước"
                {...editForm.register('name', { required: 'Tên kích thước là bắt buộc' })}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-600">{editForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-length">Dài (cm)</Label>
                <Input
                  id="edit-length"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.0"
                  {...editForm.register('lengthCm', { 
                    required: 'Chiều dài là bắt buộc',
                    min: { value: 0.1, message: 'Chiều dài phải lớn hơn 0' },
                    valueAsNumber: true
                  })}
                />
                {editForm.formState.errors.lengthCm && (
                  <p className="text-sm text-red-600">{editForm.formState.errors.lengthCm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-width">Rộng (cm)</Label>
                <Input
                  id="edit-width"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.0"
                  {...editForm.register('widthCm', { 
                    required: 'Chiều rộng là bắt buộc',
                    min: { value: 0.1, message: 'Chiều rộng phải lớn hơn 0' },
                    valueAsNumber: true
                  })}
                />
                {editForm.formState.errors.widthCm && (
                  <p className="text-sm text-red-600">{editForm.formState.errors.widthCm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-height">Cao/Dày (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="0.0"
                  {...editForm.register('heightCm', { 
                    required: 'Chiều cao là bắt buộc',
                    min: { value: 0.1, message: 'Chiều cao phải lớn hơn 0' },
                    valueAsNumber: true
                  })}
                />
                {editForm.formState.errors.heightCm && (
                  <p className="text-sm text-red-600">{editForm.formState.errors.heightCm.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={editForm.watch('isActive')}
                onCheckedChange={(checked) => editForm.setValue('isActive', checked)}
              />
              <Label htmlFor="edit-isActive">Trạng thái hoạt động</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateSizeMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateSizeMutation.isPending}
                className="bg-wood-500 hover:bg-wood-600"
              >
                {updateSizeMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa kích thước</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa kích thước {sizeToDelete?.name}?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSizeMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSizeMutation.isPending}
            >
              {deleteSizeMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default withAdminAuth(AdminSizesPage);