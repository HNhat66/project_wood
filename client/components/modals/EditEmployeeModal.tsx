'use client'

import React, { useState } from 'react';

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
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import APIClient from '@/lib/api';
import { User, UserRole } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

const editEmployeeSchema = z.object({
	fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
	phone: z.string().optional(),
	role: z.nativeEnum(UserRole),
	employeeCode: z.string().optional(),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: User | null;
	onSuccess?: () => void;
}

export default function EditEmployeeModal({
	isOpen,
	onClose,
	user,
	onSuccess,
}: EditEmployeeModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();
	const { tokens } = useAuth();
	const client = new APIClient(tokens);

	const form = useForm<EditEmployeeFormData>({
		resolver: zodResolver(editEmployeeSchema),
		defaultValues: {
			fullName: user?.fullName || '',
			phone: user?.phone || '',
			role: (user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLOYEE) ? user.role : UserRole.EMPLOYEE,
			employeeCode: user?.employeeCode || '',
		},
	});

	// Reset form when user changes
	React.useEffect(() => {
		if (user) {
			form.reset({
				fullName: user.fullName,
				phone: user.phone || '',
				role: (user.role === UserRole.ADMIN || user.role === UserRole.EMPLOYEE) ? user.role : UserRole.EMPLOYEE,
				employeeCode: user.employeeCode || '',
			});
		}
	}, [user, form]);

	const updateEmployeeMutation = useMutation({
		mutationFn: (data: EditEmployeeFormData) => {
			if (!user) throw new Error('User not found');
			return client.user().updateEmployee(user.id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] });
			queryClient.invalidateQueries({ queryKey: ['user-stats'] });
			onSuccess?.();
			onClose();
			toast.success('Cập nhật thông tin nhân viên thành công');
		},
		onError: (error: any) => {
			toast.error('Có lỗi xảy ra khi cập nhật thông tin nhân viên', {
				description: error.response?.data?.message || error.message,
			});
		},
	});

	const onSubmit = (data: EditEmployeeFormData) => {
		setIsLoading(true);
		// Remove empty strings and convert to proper format
		const cleanedData = {
			...data,
			phone: data.phone || undefined,
			employeeCode: data.employeeCode || undefined,
		};
		updateEmployeeMutation.mutate(cleanedData);
		setIsLoading(false);
	};

	const handleClose = () => {
		form.reset();
		onClose();
	};

	if (!user || user.role === UserRole.USER) {
		return null; // Only show for admin/employee users
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
					<DialogDescription>
						Cập nhật thông tin cho nhân viên: <strong>{user.fullName}</strong>
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
										<FormLabel>Số điện thoại</FormLabel>
										<FormControl>
											<Input placeholder="0901234567" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Vai trò *</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Chọn vai trò" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={UserRole.EMPLOYEE}>Nhân viên</SelectItem>
												<SelectItem value={UserRole.ADMIN}>Quản trị viên</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="employeeCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mã nhân viên</FormLabel>
										<FormControl>
											<Input placeholder="EMP001" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter className="gap-2">
							<Button type="button" variant="outline" onClick={handleClose}>
								Hủy
							</Button>
							<Button
								type="submit"
								className="bg-wood-500 hover:bg-wood-600"
								disabled={isLoading || updateEmployeeMutation.isPending}
							>
								{isLoading || updateEmployeeMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
} 