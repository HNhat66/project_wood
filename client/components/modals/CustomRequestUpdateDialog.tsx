'use client'

import {
  useEffect,
  useState,
} from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CustomRequestUpdateDialogProps,
  Material,
  UpdateCustomRequestData,
} from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

export function CustomRequestUpdateDialog({
	isOpen,
	onClose,
	customRequest,
	onUpdateSuccess,
	isLoading = false
}: CustomRequestUpdateDialogProps) {
	const [formData, setFormData] = useState<UpdateCustomRequestData>({
		customWidth: 0,
		customHeight: 0,
		customDepth: 0,
		materialId: 0,
		specialRequirements: ''
	})
	const [errors, setErrors] = useState<Partial<UpdateCustomRequestData>>({})
	const { tokens } = useAuth()
	const apiClient = new APIClient(tokens)

	// Fetch materials for selection
	const { data: materialsData } = useQuery({
		queryKey: ['materials'],
		queryFn: async () => {
			const response = await apiClient.material().getMaterials()
			return response.data
		},
		staleTime: 10 * 60 * 1000, // 10 minutes
	})

	const materials = materialsData || []

	// Initialize form data when customRequest changes
	useEffect(() => {
		if (customRequest) {
			setFormData({
				customWidth: customRequest.customWidth,
				customHeight: customRequest.customHeight,
				customDepth: customRequest.customDepth,
				materialId: customRequest.materialId,
				specialRequirements: customRequest.specialRequirements || ''
			})
			setErrors({})
		}
	}, [customRequest])

	// Validation
	const validateForm = (): boolean => {
		const newErrors: Partial<UpdateCustomRequestData> = {}

		if (!formData.customWidth || formData.customWidth > 1000) {
			newErrors.customWidth = 1
		}
		if (!formData.customHeight || formData.customHeight > 1000) {
			newErrors.customHeight = 1
		}
		if (!formData.customDepth || formData.customDepth > 1000) {
			newErrors.customDepth = 1
		}
		if (!formData.materialId) {
			newErrors.materialId = 1
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Handle form submission
	const handleSubmit = () => {
		if (!validateForm()) {
			toast.error('Vui lòng kiểm tra lại thông tin nhập vào')
			return
		}

		// Only include changed fields
		const updateData: UpdateCustomRequestData = {}
		
		if (formData.customWidth !== customRequest?.customWidth) {
			updateData.customWidth = formData.customWidth
		}
		if (formData.customHeight !== customRequest?.customHeight) {
			updateData.customHeight = formData.customHeight
		}
		if (formData.customDepth !== customRequest?.customDepth) {
			updateData.customDepth = formData.customDepth
		}
		if (formData.materialId !== customRequest?.materialId) {
			updateData.materialId = formData.materialId
		}
		if (formData.specialRequirements !== customRequest?.specialRequirements) {
			updateData.specialRequirements = formData.specialRequirements
		}

		// Check if there are any changes
		if (Object.keys(updateData).length === 0) {
			toast.info('Không có thay đổi nào để cập nhật')
			return
		}

		onUpdateSuccess(updateData)
	}

	// Handle input changes
	const handleInputChange = (field: keyof UpdateCustomRequestData, value: string | number) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}))
		
		// Clear error for this field when user starts typing
		if (errors[field]) {
			setErrors(prev => ({
				...prev,
				[field]: undefined
			}))
		}
	}

	if (!customRequest) return null

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Chỉnh sửa yêu cầu #{customRequest.id}</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Product info (read-only) */}
					<div className="bg-wood-50 border border-wood-200 p-4 rounded-lg">
						<h4 className="font-medium text-charcoal mb-2">Thông tin sản phẩm</h4>
						<div className="text-sm text-walnut-600 space-y-1">
							<p><strong>Sản phẩm:</strong> {customRequest.product?.name}</p>
							<p><strong>Loại:</strong> {customRequest.product?.category?.name}</p>
						</div>
					</div>

					{/* Form fields */}
					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-4">
							{/* Custom Width */}
							<div className="space-y-2">
								<Label htmlFor="customWidth">
									Chiều rộng (cm) <span className="text-red-500">*</span>
								</Label>
								<Input
									id="customWidth"
									type="number"
									min="1"
									max="1000"
									step="0.1"
									value={formData.customWidth}
									onChange={(e) => handleInputChange('customWidth', parseFloat(e.target.value) || 0)}
									className={errors.customWidth ? 'border-red-500' : ''}
									disabled={isLoading}
								/>
								{errors.customWidth && (
									<p className="text-red-500 text-xs">{errors.customWidth}</p>
								)}
							</div>

							{/* Custom Height */}
							<div className="space-y-2">
								<Label htmlFor="customHeight">
									Chiều cao/Độ dày (cm) <span className="text-red-500">*</span>
								</Label>
								<Input
									id="customHeight"
									type="number"
									min="1"
									max="1000"
									step="0.1"
									value={formData.customHeight}
									onChange={(e) => handleInputChange('customHeight', parseFloat(e.target.value) || 0)}
									className={errors.customHeight ? 'border-red-500' : ''}
									disabled={isLoading}
								/>
								{errors.customHeight && (
									<p className="text-red-500 text-xs">Chiều cao phải từ 1-1000 cm</p>
								)}
							</div>

							{/* Custom Depth */}
							<div className="space-y-2">
								<Label htmlFor="customDepth">
									Chiều sâu (cm) <span className="text-red-500">*</span>
								</Label>
								<Input
									id="customDepth"
									type="number"
									min="1"
									max="1000"
									step="0.1"
									value={formData.customDepth}
									onChange={(e) => handleInputChange('customDepth', parseFloat(e.target.value) || 0)}
									className={errors.customDepth ? 'border-red-500' : ''}
									disabled={isLoading}
								/>
								{errors.customDepth && (
									<p className="text-red-500 text-xs">Chiều sâu phải từ 1-1000 cm</p>
								)}
							</div>
						</div>

						{/* Material Selection */}
						<div className="space-y-2">
							<Label htmlFor="material">
								Vật liệu <span className="text-red-500">*</span>
							</Label>
							<Select
								value={formData.materialId?.toString()}
								onValueChange={(value) => handleInputChange('materialId', parseInt(value))}
								disabled={isLoading}
							>
								<SelectTrigger className={errors.materialId ? 'border-red-500' : ''}>
									<SelectValue placeholder="Chọn vật liệu" />
								</SelectTrigger>
								<SelectContent>
									{materials.map((material: Material) => (
										<SelectItem key={material.id} value={material.id.toString()}>
											{material.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.materialId && (
								<p className="text-red-500 text-xs">Vui lòng chọn vật liệu</p>
							)}
						</div>

						{/* Special Requirements */}
						<div className="space-y-2">
							<Label htmlFor="specialRequirements">Yêu cầu đặc biệt</Label>
							<Textarea
								id="specialRequirements"
								placeholder="Nhập yêu cầu đặc biệt nếu có..."
								value={formData.specialRequirements}
								onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
								rows={3}
								disabled={isLoading}
							/>
						</div>
					</div>

					{/* Current vs New comparison */}
					<div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
						<h4 className="font-medium text-blue-800 mb-2">Thông tin hiện tại</h4>
						<div className="text-sm text-blue-600 space-y-1">
							<p><strong>Kích thước:</strong> {customRequest.customWidth} × {customRequest.customHeight} × {customRequest.customDepth} cm</p>
							<p><strong>Vật liệu:</strong> {customRequest.material?.name}</p>
							{customRequest.specialRequirements && (
								<p><strong>Yêu cầu đặc biệt:</strong> {customRequest.specialRequirements}</p>
							)}
						</div>
					</div>
				</div>

				<DialogFooter className="flex gap-2 pt-4">
					<Button 
						variant="outline" 
						onClick={onClose}
						disabled={isLoading}
					>
						Hủy
					</Button>
					<Button 
						onClick={handleSubmit}
						disabled={isLoading}
						className="bg-wood-500 hover:bg-wood-600"
					>
						{isLoading ? 'Đang cập nhật...' : 'Cập nhật yêu cầu'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
} 