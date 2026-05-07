'use client'

import { useState } from 'react';

import {
  Edit,
  Eye,
  Key,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';

// Import modals
import CreateEmployeeModal from '@/components/modals/CreateEmployeeModal';
import EditEmployeeModal from '@/components/modals/EditEmployeeModal';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';
import UserStatusModal from '@/components/modals/UserStatusModal';
import ViewUserDetailModal from '@/components/modals/ViewUserDetailModal';
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
import APIClient from '@/lib/api';
import {
  useAuth,
  withAdminAuth,
} from '@/lib/auth-context';
import {
  AdminUsersTableState,
  PaginatedResponse,
  User,
  UserRole,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

function AdminUsersPage() {
  const [tableState, setTableState] = useState<AdminUsersTableState>({
    page: 1,
    limit: 10,
    search: '',
    roleFilter: 'all',
    statusFilter: 'all',
  });

  // Modal states
  const [createEmployeeModalOpen, setCreateEmployeeModalOpen] = useState(false);
  const [userStatusModalOpen, setUserStatusModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [viewUserDetailModalOpen, setViewUserDetailModalOpen] = useState(false);
  const [editEmployeeModalOpen, setEditEmployeeModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const queryClient = useQueryClient();

  const {tokens} = useAuth()
  const client = new APIClient(tokens);

  // Query users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['admin-users', tableState],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const response = await client.user().getUsers({
        page: tableState.page,
        limit: tableState.limit,
        search: tableState.search || undefined,
        roleFilter: tableState.roleFilter,
        statusFilter: tableState.statusFilter,
      });
      return response.data;
    }
  });


  const handleSearch = (value: string) => {
    setTableState(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleRoleFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, roleFilter: value, page: 1 }));
  };

  const handleStatusFilterChange = (value: string) => {
    setTableState(prev => ({ ...prev, statusFilter: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setTableState(prev => ({ ...prev, page }));
  };


  const handleUpdateStatus = (user: User) => {
    setSelectedUser(user);
    setUserStatusModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordModalOpen(true);
  };

  const handleCreateEmployee = () => {
    setCreateEmployeeModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewUserDetailModalOpen(true);
  };

  const handleEditEmployee = (user: User) => {
    setSelectedUser(user);
    setEditEmployeeModalOpen(true);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Quản trị viên</Badge>;
      case UserRole.EMPLOYEE:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Nhân viên</Badge>;
      case UserRole.USER:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Khách hàng</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Không xác định</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Tạm ngừng</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Không xác định</Badge>;
    }
  };

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }: { row: User }) => (
        <span className="text-xs text-walnut-500 font-mono">
          #{row.id}
        </span>
      )
    },
    {
      id: 'user',
      header: 'Người dùng',
      cell: ({ row }: { row: User }) => (
        <div>
          <div className="text-sm font-medium text-charcoal">
            {row.fullName}
          </div>
          <div className="text-sm text-walnut-500">
            {row.email}
          </div>
          {row.phone && (
            <div className="text-xs text-walnut-400">
              {row.phone}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'role',
      header: 'Vai trò',
      cell: ({ row }: { row: User }) => getRoleBadge(row.role)
    },
    {
      id: 'employeeCode',
      header: 'Mã NV',
      cell: ({ row }: { row: User }) => (
        <div className="text-sm text-charcoal w-fit">
          {row.employeeCode || 'N/A'}
        </div>
      )
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }: { row: User }) => getStatusBadge(row.status)
    },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }: { row: User }) => (
        <div className="text-sm text-charcoal">
          {formatDate(row.createdAt.toString())}
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }: { row: User }) => (
        <div className="flex items-center justify-end space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-wood-600 hover:text-wood-900"
            onClick={() => handleViewUser(row)}
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-blue-600 hover:text-blue-900"
            onClick={() => handleUpdateStatus(row)}
            title="Cập nhật trạng thái"
          >
            {row.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </Button>

          {(row.role === UserRole.ADMIN || row.role === UserRole.EMPLOYEE) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-orange-600 hover:text-orange-900"
              onClick={() => handleResetPassword(row)}
              title="Reset mật khẩu"
            >
              <Key className="w-4 h-4" />
            </Button>
          )}
          
          {(row.role === UserRole.ADMIN || row.role === UserRole.EMPLOYEE) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-wood-600 hover:text-wood-900"
              onClick={() => handleEditEmployee(row)}
              title="Chỉnh sửa thông tin"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          
        </div>
      )
    }
  ];

  const users = usersData?.data || [];
  const totalUsers = usersData?.total || 0;
  const activeUsers = users.filter((u: User) => u.status === 'active').length;
  const adminUsers = users.filter((u: User) => u.role === UserRole.ADMIN).length;
  const employeeUsers = users.filter((u: User) => u.role === UserRole.EMPLOYEE).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">Quản lý người dùng</h1>
        <Button 
          className="bg-wood-500 hover:bg-wood-600"
          onClick={handleCreateEmployee}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Tổng người dùng</p>
                <p className="text-2xl font-bold text-charcoal">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-wood-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Quản trị viên</p>
                <p className="text-2xl font-bold text-red-600">{adminUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-walnut-600">Nhân viên</p>
                <p className="text-2xl font-bold text-blue-600">{employeeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
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
                placeholder="Tìm kiếm người dùng..."
                value={tableState.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={tableState.roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="employee">Nhân viên</SelectItem>
                <SelectItem value="user">Khách hàng</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tableState.statusFilter} onValueChange={handleStatusFilterChange}>
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

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng ({totalUsers})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={users}
            isLoading={isLoading}
            pagination={{
              page: tableState.page,
              totalPages: usersData?.totalPages || 1,
              onPageChange: handlePageChange
            }}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateEmployeeModal
        isOpen={createEmployeeModalOpen}
        onClose={() => setCreateEmployeeModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }}
      />

      <UserStatusModal
        isOpen={userStatusModalOpen}
        onClose={() => {
          setUserStatusModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }}
      />

      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }}
      />

      <ViewUserDetailModal
        isOpen={viewUserDetailModalOpen}
        onClose={() => {
          setViewUserDetailModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <EditEmployeeModal
        isOpen={editEmployeeModalOpen}
        onClose={() => {
          setEditEmployeeModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }}
      />
    </div>
  )
}

export default withAdminAuth(AdminUsersPage);