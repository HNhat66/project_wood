'use client'

import React, { useEffect } from 'react';

import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Category,
  CategoryFormData,
} from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';

const categoryFormSchema = z.object({
	name: z.string().min(1, 'Tên danh mục là bắt buộc').max(255, 'Tên danh mục tối đa 255 ký tự'),
	description: z.string().optional(),
	parentId: z.number().optional(),
	sortOrder: z.coerce.number().min(0, 'Thứ tự phải >= 0').max(999, 'Thứ tự phải <= 999').optional(),
});

type CategoryFormType = z.infer<typeof categoryFormSchema>;

interface CategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: CategoryFormData) => Promise<void>;
	category?: Category | null;
	parentCategory?: Category | null;
	allCategories: Category[];
	isLoading?: boolean;
	mode: 'create' | 'edit' | 'create-child';
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	category,
	parentCategory,
	allCategories,
	isLoading = false,
	mode
}) => {
	const categoryForm = useForm<CategoryFormType>({
		resolver: zodResolver(categoryFormSchema),
		defaultValues: {
			name: '',
			description: '',
			parentId: undefined,
			sortOrder: 0,
		},
	});


	// Reset form when modal opens/closes or category changes
	useEffect(() => {
		if (isOpen) {
			if (mode === 'edit' && category) {
				categoryForm.reset({
					name: category.name,
					description: category.description || '',
					parentId: category.parentId || undefined,
					sortOrder: category.sortOrder || 0,
				});
			} else if (mode === 'create-child' && parentCategory) {
				categoryForm.reset({
					name: '',
					description: '',
					parentId: parentCategory.id,
					sortOrder: 0,
				});
			} else {
				categoryForm.reset({
					name: '',
					description: '',
					parentId: undefined,
					sortOrder: 0,
				});
			}
		}
	}, [isOpen, category, parentCategory, mode, categoryForm.reset]);

	const onFormSubmit = async (data: CategoryFormType) => {
		try {
			// Convert to CategoryFormData format for API
			const formData: CategoryFormData = {
				name: data.name,
				description: data.description || '',
				parentId: data.parentId,
				sortOrder: data.sortOrder,
			};
			await onSubmit(formData);
			onClose();
		} catch (error) {
			console.error('Error submitting form:', error);
		}
	};

	const getModalTitle = () => {
		switch (mode) {
			case 'edit':
				return `Chỉnh sửa danh mục: ${category?.name}`;
			case 'create-child':
				return `Thêm danh mục con cho: ${parentCategory?.name}`;
			default:
				return 'Thêm danh mục mới';
		}
	};

	// Filter available parent categories (exclude self and descendants)
	const getAvailableParentCategories = () => {
		if (mode === 'create-child' && parentCategory) {
			return []; // Parent is already set
		}

		if (mode === 'edit' && category) {
			// Exclude self and all descendants
			const excludeIds = new Set([category.id]);

			const addDescendants = (cat: Category) => {
				if (cat.children) {
					cat.children.forEach(child => {
						excludeIds.add(child.id);
						addDescendants(child);
					});
				}
			};

			addDescendants(category);

			return allCategories.filter(cat => !excludeIds.has(cat.id));
		}

		return allCategories;
	};

	const availableParentCategories = getAvailableParentCategories();

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{getModalTitle()}</DialogTitle>
				</DialogHeader>

				<Form {...categoryForm}>
					<form onSubmit={categoryForm.handleSubmit(onFormSubmit)} className="space-y-6">
						{/* Category Name */}
						<div className="space-y-2">
							<FormField
								control={categoryForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tên danh mục *</FormLabel>
										<FormControl>
											<Input placeholder="Nhập tên danh mục" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<FormField
								control={categoryForm.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mô tả</FormLabel>
										<FormControl>
											<Textarea
												id="description"
												{...field}
												placeholder="Nhập mô tả danh mục (tùy chọn)"
												rows={3}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Parent Category */}
						<div className="space-y-2">
							<Label htmlFor="parentId">Danh mục cha</Label>
							{mode === 'create-child' && parentCategory ? (
								<div className="p-3 bg-gray-50 rounded-lg border">
									<span className="text-sm font-medium text-gray-900">
										{parentCategory.name}
									</span>
									<p className="text-xs text-gray-500 mt-1">
										Danh mục con sẽ được tạo dưới danh mục này
									</p>
								</div>
							) : (
								<Select
									value={categoryForm.watch('parentId')?.toString() || 'root'}
									onValueChange={(value) => {
										categoryForm.setValue('parentId', value === 'root' ? undefined : parseInt(value));
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Chọn danh mục cha (tùy chọn)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="root">Danh mục gốc</SelectItem>
										{availableParentCategories.map((cat) => (
											<SelectItem key={cat.id} value={cat.id.toString()}>
												{cat.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						{/* Sort Order */}
						<div className="space-y-2">
							<FormField
								control={categoryForm.control}
								name="sortOrder"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Thứ tự sắp xếp</FormLabel>
										<FormControl>
											<Input
												id="sortOrder"
												type="number"
												min="0"
												max="999"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<p className="text-xs text-gray-500">
								Số nhỏ hơn sẽ hiển thị trước (0-999)
							</p>
						</div>


						{/* Form Actions */}
						<div className="flex justify-end space-x-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={isLoading}
							>
								Hủy
							</Button>
							<Button
								type="submit"
								className="bg-wood-500 hover:bg-wood-600"
								disabled={isLoading}
							>
								{isLoading ? (
									<div className="flex items-center space-x-2">
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										<span>Đang xử lý...</span>
									</div>
								) : mode === 'edit' ? (
									'Cập nhật'
								) : (
									'Tạo danh mục'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default CategoryModal; 