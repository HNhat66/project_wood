'use client'

import { useState } from 'react';

import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import { User } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    required_error: 'Vui lòng chọn trạng thái',
  }),
  reason: z.string().optional(),
});

type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;

interface UserStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

export default function UserStatusModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserStatusModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
	const {tokens} = useAuth();
  const client = new APIClient(tokens);

  const form = useForm<UpdateStatusFormData>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: user?.status || 'active',
      reason: '',
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateStatusFormData) => {
      if (!user) throw new Error('User not found');
      return client.user().updateUserStatus(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      form.reset();
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái người dùng",{
        description: error.message,
      });
    },
  });

  const onSubmit = (data: UpdateStatusFormData) => {
    setIsLoading(true);
    updateStatusMutation.mutate(data);
    setIsLoading(false);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm ngừng';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái người dùng</DialogTitle>
          <DialogDescription>
            Thay đổi trạng thái cho người dùng: <strong>{user.fullName}</strong>
            <br />
            Trạng thái hiện tại: <span className={getStatusColor(user.status)}>{getStatusLabel(user.status)}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái mới *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">
                        <span className="text-green-600">Hoạt động</span>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <span className="text-gray-600">Tạm ngừng</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do thay đổi</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nhập lý do thay đổi trạng thái (tùy chọn)"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong>
                <br />
                • <strong>Hoạt động:</strong> Người dùng có thể đăng nhập và sử dụng hệ thống bình thường
                <br />
                • <strong>Tạm ngừng:</strong> Người dùng không thể đăng nhập tạm thời
                <br />
                • <strong>Bị cấm:</strong> Người dùng bị cấm vĩnh viễn, không thể đăng nhập
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || updateStatusMutation.isPending}
                className="bg-wood-500 hover:bg-wood-600"
              >
                {isLoading || updateStatusMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 