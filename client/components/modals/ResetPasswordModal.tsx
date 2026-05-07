'use client'

import { useState } from 'react';

import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ResetPasswordRequest,
  User,
} from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

const resetPasswordSchema = z.object({
	newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
	confirmPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.newPassword === data.confirmPassword, {
	message: "Mật khẩu xác nhận không khớp",
	path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: User | null;
	onSuccess?: () => void;
}

export default function ResetPasswordModal({
	isOpen,
	onClose,
	user,
	onSuccess,
}: ResetPasswordModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();
	const { tokens } = useAuth()
	const client = new APIClient(tokens);

	const form = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			newPassword: '',
			confirmPassword: '',
		},
	});

	const resetPasswordMutation = useMutation({
		mutationFn: (data: ResetPasswordRequest) => {
			if (!user) throw new Error('User not found');
			return client.user().resetPassword(user.id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] });
			form.reset();
			onSuccess?.();
			onClose();
			alert('Mật khẩu đã được reset thành công!');
		},
		onError: (error: any) => {
			console.error('Error resetting password:', error);
			if (error.message.includes('Cannot reset password for customer accounts')) {
				alert('Không thể reset mật khẩu cho tài khoản khách hàng');
			} else {
				alert('Có lỗi xảy ra khi reset mật khẩu');
			}
		},
	});

	const onSubmit = (data: ResetPasswordFormData) => {
		setIsLoading(true);
		resetPasswordMutation.mutate({
			newPassword: data.newPassword,
			confirmPassword: data.confirmPassword,
		});
		setIsLoading(false);
	};

	const handleClose = () => {
		form.reset();
		onClose();
	};

	if (!user) return null;

	// Only allow password reset for employee and admin users
	if (user.role === 'user') {
		return (
			<Dialog open={isOpen} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle>Không thể reset mật khẩu</DialogTitle>
						<DialogDescription>
							Không thể reset mật khẩu cho tài khoản khách hàng.
							Chỉ có thể reset mật khẩu cho nhân viên và quản trị viên.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={handleClose}>Đóng</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Reset mật khẩu</DialogTitle>
					<DialogDescription>
						Reset mật khẩu cho nhân viên: <strong>{user.fullName}</strong>
						<br />
						Email: <strong>{user.email}</strong>
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Mật khẩu mới *</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Nhập mật khẩu mới"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Xác nhận mật khẩu *</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Nhập lại mật khẩu mới"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="bg-blue-50 border border-blue-200 rounded-md p-3">
							<p className="text-sm text-blue-800">
								<strong>Lưu ý:</strong>
								<br />
								• Mật khẩu mới sẽ được áp dụng ngay lập tức
								<br />
								• Nhân viên sẽ cần sử dụng mật khẩu mới để đăng nhập
								<br />
								• Nên thông báo cho nhân viên về mật khẩu mới qua kênh liên lạc riêng tư
							</p>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleClose}>
								Hủy
							</Button>
							<Button
								type="submit"
								disabled={isLoading || resetPasswordMutation.isPending}
								className="bg-red-500 hover:bg-red-600"
							>
								{isLoading || resetPasswordMutation.isPending ? 'Đang reset...' : 'Reset mật khẩu'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
} 