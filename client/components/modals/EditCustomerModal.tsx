'use client'

import React, { useState } from 'react';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Customer } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

const editCustomerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100, 'Họ tên không được quá 100 ký tự'),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type EditCustomerFormData = z.infer<typeof editCustomerSchema>;

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess?: () => void;
}

export default function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: EditCustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { tokens } = useAuth();
  const client = new APIClient(tokens);

  const form = useForm<EditCustomerFormData>({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      fullName: customer?.fullName || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      address: customer?.address || '',
      notes: customer?.notes || '',
    },
  });

  // Reset form when customer changes
  React.useEffect(() => {
    if (customer) {
      form.reset({
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    }
  }, [customer, form]);

  const updateCustomerMutation = useMutation({
    mutationFn: (data: EditCustomerFormData) => {
      if (!customer) throw new Error('Customer not found');
      
      // Clean data - remove empty strings
      const cleanedData = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
      };
      
      return client.customer().updateCustomer(customer.id, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customer?.id] });
      onSuccess?.();
      onClose();
      toast.success('Cập nhật thông tin khách hàng thành công');
    },
    onError: (error: any) => {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin khách hàng', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  const onSubmit = (data: EditCustomerFormData) => {
    setIsLoading(true);
    updateCustomerMutation.mutate(data);
    setIsLoading(false);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!customer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho khách hàng: <strong>{customer.fullName}</strong> ({customer.customerCode})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn An" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại *</FormLabel>
                    <FormControl>
                      <Input placeholder="0901234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="nguyenvanan@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="123 Đường ABC, Quận 1, TP.HCM" 
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ghi chú thêm về khách hàng..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading || updateCustomerMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading || updateCustomerMutation.isPending}
                className="bg-wood-500 hover:bg-wood-600"
              >
                {updateCustomerMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 