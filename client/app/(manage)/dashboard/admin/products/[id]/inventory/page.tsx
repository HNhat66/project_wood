'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  Minus,
  Package,
  Plus,
  Save,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  withEmployeeAuth,
} from '@/lib/auth-context';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

interface InventoryAdjustment {
	productVariantId: number
	quantity: number
	currentStock: number
	newStock: number
	reason: string
}

function InventoryPage() {
	const params = useParams()
	const productId = parseInt(params.id as string)
	const queryClient = useQueryClient()
	const { tokens } = useAuth()

	const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
	const [globalReason, setGlobalReason] = useState('')
	const [notes, setNotes] = useState('')

	// Fetch product with variants
	const { data: product, isLoading, error } = useQuery({
		queryKey: ['product', productId],
		queryFn: async () => {
			const api = new APIClient(tokens)
			const response = await api.product().getProduct(productId)
			return response.data
		},
		enabled: !!productId,
	})

	// Initialize adjustments when product data loads
	useEffect(() => {
		if (product?.variants) {
			setAdjustments(
				product.variants.map((variant: any) => ({
					productVariantId: variant.id,
					quantity: 0,
					currentStock: variant.stockQuantity,
					newStock: variant.stockQuantity,
					reason: '',
				}))
			)
		}
	}, [product])

	// Bulk inventory adjustment mutation
	const bulkAdjustmentMutation = useMutation({
		mutationFn: async (data: {
			productId: number
			adjustments: { productVariantId: number; quantity: number; reason?: string }[]
			globalReason: string
			notes?: string
		}) => {
			const api = new APIClient(tokens)
			const response = await api.product().bulkInventoryAdjustment(data)
			return response.data
		},
		onSuccess: (data) => {
			if (data.success) {
				toast.success(`Đã cập nhật thành công ${data.updated.length} phiên bản`)
				// Reset form
				setAdjustments(prev =>
					prev.map(adj => ({
						...adj,
						quantity: 0,
						currentStock: adj.newStock,
						newStock: adj.newStock,
						reason: '',
					}))
				)
				setGlobalReason('')
				setNotes('')
				// Refresh product data
				queryClient.invalidateQueries({ queryKey: ['product', productId] })
			} else {
				toast.error(`Hoàn thành điều chỉnh với lỗi: ${data.errors.join(', ')}`)
			}
		},
		onError: (error: any) => {
			toast.error(error.message || 'Không thể điều chỉnh kho')
		},
	})

	const updateAdjustment = (variantId: number, quantity: number) => {
		setAdjustments(prev =>
			prev.map(adj => {
				if (adj.productVariantId === variantId) {
					const newStock = adj.currentStock + quantity
					return {
						...adj,
						quantity,
						newStock: newStock >= 0 ? newStock : 0,
					}
				}
				return adj
			})
		)
	}

	const updateVariantReason = (variantId: number, reason: string) => {
		setAdjustments(prev =>
			prev.map(adj => {
				if (adj.productVariantId === variantId) {
					return {
						...adj,
						reason,
					}
				}
				return adj
			})
		)
	}

	const incrementStock = (variantId: number) => {
		const current = adjustments.find(adj => adj.productVariantId === variantId)
		if (current) {
			updateAdjustment(variantId, current.quantity + 1)
		}
	}

	const decrementStock = (variantId: number) => {
		const current = adjustments.find(adj => adj.productVariantId === variantId)
		if (current) {
			updateAdjustment(variantId, current.quantity - 1)
		}
	}

	const handleSubmit = async () => {
		const changedAdjustments = adjustments.filter(adj => adj.quantity !== 0)
		
		if (changedAdjustments.length === 0) {
			toast.warning('Không có thay đổi để lưu')
			return
		}

		if (!globalReason.trim()) {
			toast.error('Vui lòng cung cấp lý do chung cho việc điều chỉnh')
			return
		}

		bulkAdjustmentMutation.mutate({
			productId,
			adjustments: changedAdjustments.map(adj => ({
				productVariantId: adj.productVariantId,
				quantity: adj.quantity,
				reason: adj.reason.trim() || undefined, // Use undefined if empty, will fallback to globalReason
			})),
			globalReason: globalReason.trim(),
			notes: notes.trim() || undefined,
		})
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Package className="w-8 h-8 animate-spin" />
			</div>
		)
	}

	if (error || !product) {
		return (
			<div className="flex items-center justify-center min-h-[400px] text-red-500">
				<AlertTriangle className="w-8 h-8 mr-2" />
				Failed to load product data
			</div>
		)
	}

	const hasChanges = adjustments.some(adj => adj.quantity !== 0)
	const totalVariants = adjustments.length
	const changedVariants = adjustments.filter(adj => adj.quantity !== 0).length

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
					<p className="text-gray-600 mt-1">
						Manage stock levels for {product.name}
					</p>
				</div>
				<Badge variant="outline" className="text-lg px-3 py-1">
					{totalVariants} Variants
				</Badge>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="w-5 h-5" />
						Quản lý kho
					</CardTitle>
					<CardDescription>
						Điều chỉnh số lượng kho cho các phiên bản sản phẩm. Số dương tăng số lượng, số âm giảm số lượng.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto scrollbar-thin scrollbar-thumb-wood-300 scrollbar-track-wood-100 hover:scrollbar-thumb-wood-400"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d4844f #f1ddc7'
              }}>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>SKU</TableHead>
									<TableHead>Vật liệu</TableHead>
									<TableHead>Kích thước</TableHead>
									<TableHead className="text-center">Số lượng hiện tại</TableHead>
									<TableHead className="text-center">Điều chỉnh</TableHead>
									<TableHead className="text-center">Số lượng mới</TableHead>
									<TableHead className="text-center">Hành động</TableHead>
									<TableHead className="min-w-[200px]">Lý do riêng (tùy chọn)</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{product.variants?.map((variant: any, index: number) => {
									const adjustment = adjustments[index]
									const isLowStock = variant.stockQuantity <= variant.minStockLevel
									const isOutOfStock = variant.stockQuantity === 0
									const wouldBeNegative = adjustment?.newStock < 0

									return (
										<TableRow key={variant.id}>
											<TableCell className="font-medium">{variant.sku}</TableCell>
											<TableCell>{variant.material?.name}</TableCell>
											<TableCell>
												{variant.size?.name} ({variant.size?.lengthCm}×{variant.size?.widthCm}×{variant.size?.heightCm}cm)
											</TableCell>
											<TableCell className="text-center">
												<div className="flex items-center justify-center gap-2">
													<span className={`font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
														{variant.stockQuantity}
													</span>
													{isOutOfStock && <Badge variant="destructive" className="text-xs">Out</Badge>}
													{isLowStock && !isOutOfStock && <Badge variant="secondary" className="text-xs">Low</Badge>}
												</div>
											</TableCell>
											<TableCell className="text-center">
												<Input
													type="number"
													value={adjustment?.quantity || 0}
													onChange={(e) => updateAdjustment(variant.id, parseInt(e.target.value) || 0)}
													className={`w-20 text-center ${adjustment?.quantity > 0 ? 'border-green-500' : adjustment?.quantity < 0 ? 'border-red-500' : ''}`}
												/>
											</TableCell>
											<TableCell className="text-center">
												<span className={`font-medium ${wouldBeNegative ? 'text-red-600' : adjustment?.newStock > variant.stockQuantity ? 'text-green-600' : 'text-gray-900'}`}>
													{adjustment?.newStock || variant.stockQuantity}
												</span>
												{wouldBeNegative && <div className="text-xs text-red-500 mt-1">Invalid</div>}
											</TableCell>
											<TableCell className="text-center">
												<div className="flex items-center justify-center gap-1">
													<Button
														size="icon"
														variant="outline"
														onClick={() => decrementStock(variant.id)}
														disabled={bulkAdjustmentMutation.isPending}
													>
														<Minus className="w-3 h-3" />
													</Button>
													<Button
														size="icon"
														variant="outline"
														onClick={() => incrementStock(variant.id)}
														disabled={bulkAdjustmentMutation.isPending}
													>
														<Plus className="w-3 h-3" />
													</Button>
												</div>
											</TableCell>
											<TableCell>
												<Input
													type="text"
													placeholder="Để trống sẽ dùng lý do chung"
													value={adjustment?.reason || ''}
													onChange={(e) => updateVariantReason(variant.id, e.target.value)}
													className="min-w-[180px]"
													disabled={adjustment?.quantity === 0}
												/>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</div>

					{hasChanges && (
						<div className="mt-6 border-t pt-6 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="globalReason">Lý do chung cho việc điều chỉnh *</Label>
									<Input
										id="globalReason"
										placeholder="e.g., Nhập hàng tháng 12, Kiểm kê định kỳ"
										value={globalReason}
										onChange={(e) => setGlobalReason(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="notes">Ghi chú (Tùy chọn)</Label>
									<Textarea
										id="notes"
										placeholder="Any additional information..."
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										rows={1}
									/>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-600">
									{changedVariants} trong {totalVariants} phiên bản sẽ được cập nhật
								</div>
								<Button
									onClick={handleSubmit}
									disabled={!globalReason.trim() || bulkAdjustmentMutation.isPending}
									className="flex items-center gap-2"
								>
									{bulkAdjustmentMutation.isPending ? (
										<Package className="w-4 h-4 animate-spin" />
									) : (
										<Save className="w-4 h-4" />
									)}
									Lưu thay đổi
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

export default withEmployeeAuth(InventoryPage)