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
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import APIClient from '@/lib/api';
import { UserRole } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
const createEmployeeSchema = z.object({
	email: z.string().email('Email không hợp lệ'),
	fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
	phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
	role: z.enum([UserRole.ADMIN, UserRole.EMPLOYEE], {
		required_error: 'Vui lòng chọn vai trò',
	}),
	employeeCode: z.string().optional(),
	password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

interface CreateEmployeeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function CreateEmployeeModal({
	isOpen,
	onClose,
	onSuccess,
}: CreateEmployeeModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();
	const {tokens} = useAuth()
	const client = new APIClient(tokens);

	const form = useForm<CreateEmployeeFormData>({
		resolver: zodResolver(createEmployeeSchema),
		defaultValues: {
			email: '',
			fullName: '',
			phone: '',
			role: UserRole.EMPLOYEE,
			employeeCode: '',
			password: '',
		},
	});

	const createEmployeeMutation = useMutation({
		mutationFn: (data: CreateEmployeeFormData) => client.user().createEmployee(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] });
			queryClient.invalidateQueries({ queryKey: ['user-stats'] });
			form.reset();
			onSuccess?.();
			onClose();
			toast.success('Tạo tài khoản nhân viên thành công');
		},
		onError: (error: any) => {
			toast.error('Có lỗi xảy ra khi tạo tài khoản nhân viên', {
				description: error.response.data.message,
			});
		},
	});

	const onSubmit = (data: CreateEmployeeFormData) => {
		setIsLoading(true);
		createEmployeeMutation.mutate(data);
		setIsLoading(false);
	};

	const handleClose = () => {
		form.reset();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Tạo tài khoản nhân viên</DialogTitle>
					<DialogDescription>
						Tạo tài khoản mới cho nhân viên hoặc quản trị viên
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
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
									<FormLabel>Email *</FormLabel>
									<FormControl>
										<Input type="email" placeholder="employee@company.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Vai trò *</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
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

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Mật khẩu *</FormLabel>
									<FormControl>
										<Input type="password" placeholder="Mật khẩu tạm thời" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleClose}>
								Hủy
							</Button>
							<Button
								type="submit"
								disabled={isLoading || createEmployeeMutation.isPending}
								className="bg-wood-500 hover:bg-wood-600"
							>
								{isLoading || createEmployeeMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
} 