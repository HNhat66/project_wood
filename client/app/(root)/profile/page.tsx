'use client'

import React, {
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  UserCircle,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { LocationSelector } from '@/components/forms/LocationSelector';
import SkeletonLoadingProfile
  from '@/components/profile/SkeletonLoadingProfile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ChangePasswordForm,
  UpdateProfileForm,
  UserRole,
} from '@/lib/types';

// Skeleton loading component


export default function ProfilePage() {
	const { user, tokens ,isLoading,updateProfile} = useAuth()
	const [isEditingProfile, setIsEditingProfile] = useState(false)
	const [isChangingPassword, setIsChangingPassword] = useState(false)
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isUpdating, setIsUpdating] = useState(false)

	const profileForm = useForm<UpdateProfileForm>({
		defaultValues: {
			fullName: user?.fullName || '',
			phone: user?.phone || '',
			address: user?.address || '',
			dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
			gender: user?.gender as 'male' | 'female' | 'other' || 'other'
		}
	})

	const passwordForm = useForm<ChangePasswordForm>({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		}
	})
	useEffect(() => {
		if (user) {
			profileForm.reset({
				fullName: user.fullName || '',
				phone: user.phone || '',
				address: user.address || '',
				dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
				gender: user.gender || 'other'
			})
		}
	}, [user])

	if (isLoading) {
		return <SkeletonLoadingProfile />
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-cream flex items-center justify-center">
				<div className="text-center">
					<UserCircle className="w-16 h-16 text-wood-400 mx-auto mb-4" />
					<h1 className="text-2xl font-bold text-wood-900 mb-2">Không tìm thấy thông tin người dùng</h1>
					<p className="text-wood-600">Vui lòng đăng nhập để xem thông tin cá nhân.</p>
				</div>
			</div>
		)
	}

	const handleUpdateProfile = async (data: UpdateProfileForm) => {
		setIsUpdating(true)
		try {
			const response = await updateProfile(data)
			if (response.success) {
				setIsEditingProfile(false)
				toast.success('Cập nhật thông tin thành công!')
			} else {
				toast.error(response.error || 'Cập nhật thông tin thất bại')
			}
		} catch (error) {
			console.error('Update profile error:', error)
			toast.error('Có lỗi xảy ra khi cập nhật thông tin')
		} finally {
			setIsUpdating(false)
		}
	}

	const handleChangePassword = async (data: ChangePasswordForm) => {
		if (data.newPassword !== data.confirmPassword) {
			toast.error('Mật khẩu xác nhận không khớp')
			return
		}

		setIsUpdating(true)
		try {
			const api = new APIClient(tokens)
			const response = await api.auth().changePassword({
				currentPassword: data.currentPassword,
				newPassword: data.newPassword
			})

			if (response.status === 200) {
				setIsChangingPassword(false)
				passwordForm.reset()
				toast.success('Đổi mật khẩu thành công!')
			} else {
				toast.error('Đổi mật khẩu thất bại')
			}
		} catch (error) {
			console.error('Change password error:', error)
			toast.error('Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra')
		} finally {
			setIsUpdating(false)
		}
	}

	const formatDate = (date: Date | string | undefined) => {
		if (!date) return 'Chưa cập nhật'
		const d = new Date(date)
		return d.toLocaleDateString('vi-VN')
	}

	const getGenderText = (gender: string | undefined) => {
		switch (gender) {
			case 'male': return 'Nam'
			case 'female': return 'Nữ'
			case 'other': return 'Khác'
			default: return 'Chưa cập nhật'
		}
	}

	const getRoleText = (role: UserRole) => {
		switch (role) {
			case UserRole.ADMIN: return 'Quản trị viên'
			case UserRole.EMPLOYEE: return 'Nhân viên'
			case UserRole.USER: return 'Khách hàng'
			default: return role
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active': return 'bg-green-100 text-green-800'
			case 'inactive': return 'bg-gray-100 text-gray-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	return (
		<div className="min-h-screen bg-cream py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-wood-900">Thông tin cá nhân</h1>
					<p className="text-wood-600 mt-2">Quản lý thông tin và cài đặt tài khoản của bạn</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information Card */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<User className="w-5 h-5" />
											Thông tin cá nhân
										</CardTitle>
										<CardDescription>
											Thông tin cơ bản về tài khoản của bạn
										</CardDescription>
									</div>
									{!isEditingProfile && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsEditingProfile(true)}
										>
											<Edit className="w-4 h-4 mr-2" />
											Chỉnh sửa
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								{!isEditingProfile ? (
									// Display Mode
									<div className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label className="text-sm font-medium text-wood-700 flex items-center gap-2">
													<User className="w-4 h-4" />
													Họ và tên
												</Label>
												<p className="text-wood-900 font-medium">{user.fullName || 'Chưa cập nhật'}</p>
											</div>
											
											<div className="space-y-2">
												<Label className="text-sm font-medium text-wood-700 flex items-center gap-2">
													<Mail className="w-4 h-4" />
													Email
												</Label>
												<p className="text-wood-900">{user.email}</p>
											</div>
											
											<div className="space-y-2">
												<Label className="text-sm font-medium text-wood-700 flex items-center gap-2">
													<Phone className="w-4 h-4" />
													Số điện thoại
												</Label>
												<p className="text-wood-900">{user.phone || 'Chưa cập nhật'}</p>
											</div>
											
											<div className="space-y-2">
												<Label className="text-sm font-medium text-wood-700 flex items-center gap-2">
													<Calendar className="w-4 h-4" />
													Ngày sinh
												</Label>
												<p className="text-wood-900">{formatDate(user.dateOfBirth)}</p>
											</div>
										</div>
										
										<div className="space-y-2">
											<Label className="text-sm font-medium text-wood-700 flex items-center gap-2">
												<MapPin className="w-4 h-4" />
												Địa chỉ
											</Label>
											<p className="text-wood-900">{user.address || 'Chưa cập nhật'}</p>
										</div>
										
										<div className="space-y-2">
											<Label className="text-sm font-medium text-wood-700">Giới tính</Label>
											<p className="text-wood-900">{getGenderText(user.gender)}</p>
										</div>
									</div>
								) : (
									// Edit Mode
									<Form {...profileForm}>
										<form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<FormField
													control={profileForm.control}
													name="fullName"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Họ và tên *</FormLabel>
															<FormControl>
																<Input placeholder="Nhập họ và tên" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												
												<FormField
													control={profileForm.control}
													name="phone"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Số điện thoại</FormLabel>
															<FormControl>
																<Input placeholder="Nhập số điện thoại" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												
												<FormField
													control={profileForm.control}
													name="dateOfBirth"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Ngày sinh</FormLabel>
															<FormControl>
																<Input type="date" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												
												<FormField
													control={profileForm.control}
													name="gender"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Giới tính</FormLabel>
															<Select onValueChange={field.onChange} defaultValue={field.value}>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Chọn giới tính" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="male">Nam</SelectItem>
																	<SelectItem value="female">Nữ</SelectItem>
																	<SelectItem value="other">Khác</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											
											<FormField
												control={profileForm.control}
												name="address"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Địa chỉ *</FormLabel>
														<FormControl>
															<LocationSelector
																value={field.value}
																onChange={field.onChange}
																layout="column"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											
											<div className="flex gap-2 pt-4">
												<Button type="submit" disabled={isUpdating}>
													<Save className="w-4 h-4 mr-2" />
													{isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
												</Button>
												<Button
													type="button"
													variant="outline"
													onClick={() => {
														setIsEditingProfile(false)
														profileForm.reset()
													}}
													disabled={isUpdating}
												>
													<X className="w-4 h-4 mr-2" />
													Hủy
												</Button>
											</div>
										</form>
									</Form>
								)}
							</CardContent>
						</Card>

						{/* Change Password Card */}
						<Card className="mt-6">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<Lock className="w-5 h-5" />
											Đổi mật khẩu
										</CardTitle>
										<CardDescription>
											Cập nhật mật khẩu để bảo mật tài khoản
										</CardDescription>
									</div>
									{!isChangingPassword && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsChangingPassword(true)}
										>
											<Edit className="w-4 h-4 mr-2" />
											Đổi mật khẩu
										</Button>
									)}
								</div>
							</CardHeader>
							
							{isChangingPassword && (
								<CardContent>
									<Form {...passwordForm}>
										<form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
											<FormField
												control={passwordForm.control}
												name="currentPassword"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Mật khẩu hiện tại *</FormLabel>
														<FormControl>
															<div className="relative">
																<Input
																	type={showCurrentPassword ? 'text' : 'password'}
																	placeholder="Nhập mật khẩu hiện tại"
																	{...field}
																/>
																<button
																	type="button"
																	onClick={() => setShowCurrentPassword(!showCurrentPassword)}
																	className="absolute right-3 top-1/2 transform -translate-y-1/2 text-wood-400 hover:text-wood-600"
																>
																	{showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
																</button>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											
											<FormField
												control={passwordForm.control}
												name="newPassword"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Mật khẩu mới *</FormLabel>
														<FormControl>
															<div className="relative">
																<Input
																	type={showNewPassword ? 'text' : 'password'}
																	placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
																	{...field}
																/>
																<button
																	type="button"
																	onClick={() => setShowNewPassword(!showNewPassword)}
																	className="absolute right-3 top-1/2 transform -translate-y-1/2 text-wood-400 hover:text-wood-600"
																>
																	{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
																</button>
															</div>
														</FormControl>
														<FormDescription>
															Mật khẩu phải có ít nhất 6 ký tự
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
											
											<FormField
												control={passwordForm.control}
												name="confirmPassword"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Xác nhận mật khẩu mới *</FormLabel>
														<FormControl>
															<div className="relative">
																<Input
																	type={showConfirmPassword ? 'text' : 'password'}
																	placeholder="Nhập lại mật khẩu mới"
																	{...field}
																/>
																<button
																	type="button"
																	onClick={() => setShowConfirmPassword(!showConfirmPassword)}
																	className="absolute right-3 top-1/2 transform -translate-y-1/2 text-wood-400 hover:text-wood-600"
																>
																	{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
																</button>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											
											<div className="flex gap-2 pt-4">
												<Button type="submit" disabled={isUpdating}>
													<Save className="w-4 h-4 mr-2" />
													{isUpdating ? 'Đang lưu...' : 'Đổi mật khẩu'}
												</Button>
												<Button
													type="button"
													variant="outline"
													onClick={() => {
														setIsChangingPassword(false)
														passwordForm.reset()
													}}
													disabled={isUpdating}
												>
													<X className="w-4 h-4 mr-2" />
													Hủy
												</Button>
											</div>
										</form>
									</Form>
								</CardContent>
							)}
						</Card>
					</div>

					{/* Account Status Sidebar */}
					<div className="space-y-6">
						{/* Account Status Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="w-5 h-5" />
									Trạng thái tài khoản
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label className="text-sm font-medium text-wood-700">Vai trò</Label>
									<Badge variant="secondary">{getRoleText(user.role)}</Badge>
								</div>
								
								<div className="space-y-2">
									<Label className="text-sm font-medium text-wood-700">Trạng thái</Label>
									<Badge className={getStatusColor(user.status)}>
										{user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
									</Badge>
								</div>
								
								{user.employeeCode && (
									<div className="space-y-2">
										<Label className="text-sm font-medium text-wood-700">Mã nhân viên</Label>
										<p className="text-wood-900 font-mono">{user.employeeCode}</p>
									</div>
								)}
								
								<Separator />
								
								<div className="space-y-2">
									<Label className="text-sm font-medium text-wood-700">Ngày tạo tài khoản</Label>
									<p className="text-wood-900 text-sm">{formatDate(user.createdAt)}</p>
								</div>
								
								{user.hireDate && (
									<div className="space-y-2">
										<Label className="text-sm font-medium text-wood-700">Ngày tuyển dụng</Label>
										<p className="text-wood-900 text-sm">{formatDate(user.hireDate)}</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
