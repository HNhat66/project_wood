'use client'

import { useState } from 'react';

import {
  Edit,
  Package,
  Plus,
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
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import {
  useAuth,
  withAdminAuth,
} from '@/lib/auth-context';
import {
  AdminMaterialsTableState,
  Material,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

interface MaterialFormData {
  name: string;
  description: string;
  isActive?: boolean;
}

function AdminMaterialsPage() {
  const [tableState, setTableState] = useState<AdminMaterialsTableState>({
    page: 1,
    limit: 10,
    search: '',
    active: 'all'
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  const queryClient = useQueryClient();
  const {tokens} = useAuth();
  const client = new APIClient(tokens);

  // React Hook Form for create
  const createForm = useForm<MaterialFormData>({
    defaultValues: {
      name: '',
      description: '',
      isActive: true
    }
  });

  // React Hook Form for edit
  const editForm = useForm<MaterialFormData>({
    defaultValues: {
      name: '',
      description: '',
      isActive: true
    }
  });

  // Query materials
  const { data: materialsData, isLoading, error } = useQuery({
    queryKey: ['admin-materials', tableState],
    queryFn: async (): Promise<Material[]> => {
      const response = await client.material().getMaterials({
        page: tableState.page,
        limit: tableState.limit,
        search: tableState.search || undefined,
        active: tableState.active !== 'all' ? tableState.active : undefined
      });
      return response.data;
    }
  });

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: (data: MaterialFormData) => client.material().createMaterial({
      ...data,
      isActive: data.isActive ?? true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
      toast.success('Tạo vật liệu thành công!');
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      console.error('Error creating material:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo vật liệu');
    }
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MaterialFormData }) => 
      client.material().updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
      toast.success('Cập nhật vật liệu thành công!');
      setEditDialogOpen(false);
      setMaterialToEdit(null);
      editForm.reset();
    },
    onError: (error: any) => {
      console.error('Error updating material:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật vật liệu');
    }
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) => client.material().deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
      toast.success('Xóa vật liệu thành công!');
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    },
    onError: (error: any) => {
      console.error('Error deleting material:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi xóa vật liệu');
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

  const handleEditClick = (material: Material) => {
    setMaterialToEdit(material);
    editForm.reset({
      name: material.name,
      description: material.description || '',
      isActive: material.isActive
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (material: Material) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (data: MaterialFormData) => {
    createMaterialMutation.mutate(data);
  };

  const handleEditSubmit = (data: MaterialFormData) => {
    if (materialToEdit) {
      updateMaterialMutation.mutate({ id: materialToEdit.id, data });
    }
  };

  const handleDeleteConfirm = () => {
    if (materialToDelete) {
      deleteMaterialMutation.mutate(materialToDelete.id);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>
      : <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Tạm ngừng</Badge>;
  };

  const materials = materialsData || [];
  const totalMaterials = materials.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">Quản lý vật liệu</h1>
        <Button 
          className="bg-wood-500 hover:bg-wood-600"
          onClick={handleCreateClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm vật liệu
        </Button>
      </div>

      {/* Filters */}
      <Card >
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-walnut-400" />
              <Input
                placeholder="Tìm kiếm vật liệu..."
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

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách vật liệu ({totalMaterials})</CardTitle>
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
          ) : materials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-wood-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-wood-900 mb-2">
                Không tìm thấy vật liệu
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
                      Vật liệu
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Mô tả
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Trạng thái
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-wood-500 uppercase tracking-wider">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id} className="hover:bg-wood-50 transition-colors border-b border-wood-200">
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-charcoal">
                          {material.name}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 ">
                        <div className="text-sm text-charcoal max-w-xs line-clamp-1 overflow-ellipsis">
                          {material.description || 'Chưa có mô tả'}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(material.isActive)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                        {formatDate(material.createdAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-wood-600 hover:text-wood-900"
                            onClick={() => handleEditClick(material)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(material)}
                            disabled={deleteMaterialMutation.isPending}
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

      {/* Create Material Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thêm vật liệu mới</DialogTitle>
            <DialogDescription>
              Điền thông tin vật liệu mới. Nhấn lưu khi hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Tên vật liệu</Label>
              <Input
                id="create-name"
                placeholder="Nhập tên vật liệu"
                {...createForm.register('name', { required: 'Tên vật liệu là bắt buộc' })}
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-red-600">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Mô tả</Label>
              <Textarea
                id="create-description"
                placeholder="Nhập mô tả vật liệu (tuỳ chọn)"
                rows={3}
                {...createForm.register('description')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="create-isActive"
                checked={createForm.watch('isActive')}
                onCheckedChange={(checked) => {
                  createForm.setValue('isActive', checked, { shouldValidate: true });
                }}
              />
              <Label htmlFor="create-isActive">Kích hoạt ngay</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMaterialMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMaterialMutation.isPending}
                className="bg-wood-500 hover:bg-wood-600"
              >
                {createMaterialMutation.isPending ? 'Đang tạo...' : 'Tạo vật liệu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa vật liệu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin vật liệu {materialToEdit?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên vật liệu</Label>
              <Input
                id="edit-name"
                placeholder="Nhập tên vật liệu"
                {...editForm.register('name', { required: 'Tên vật liệu là bắt buộc' })}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-600">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                placeholder="Nhập mô tả vật liệu (tuỳ chọn)"
                rows={3}
                {...editForm.register('description')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={editForm.watch('isActive')}
                onCheckedChange={(checked) => {
                  editForm.setValue('isActive', checked, { shouldValidate: true });
                }}
              />
              <Label htmlFor="edit-isActive">Trạng thái hoạt động</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMaterialMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateMaterialMutation.isPending}
                className="bg-wood-500 hover:bg-wood-600"
              >
                {updateMaterialMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa vật liệu</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vật liệu {materialToDelete?.name}?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMaterialMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMaterialMutation.isPending}
            >
              {deleteMaterialMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default withAdminAuth(AdminMaterialsPage);