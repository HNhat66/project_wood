'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  Minus,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AddressSelector } from '@/components/forms/AddressSelector';
import { OrderSummary } from '@/components/forms/OrderSummary';
import {
  ShippingMethodSelector,
} from '@/components/forms/ShippingMethodSelector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Address,
  CustomRequestOrderDialogProps,
} from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export function CustomRequestOrderDialog({
	isOpen,
	onClose,
	selectedRequests,
	onSubmitOrder,
	isLoading = false
}: CustomRequestOrderDialogProps) {
	const router = useRouter()
	const [requestQuantities, setRequestQuantities] = useState<{
		[requestId: number]: {
			quantity: number,
			unitPrice: number
		}
	}>({})
	const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(undefined)
	const [shippingMethod, setShippingMethod] = useState('standard')
	const [notes, setNotes] = useState('')

	// Calculate totals
	const subtotal = Object.values(requestQuantities).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
	const shippingFee = shippingMethod === 'express' ? 50000 : 30000
	const totalItemCount = Object.values(requestQuantities).reduce((sum, item) => sum + item.quantity, 0)
	const totalAmount = subtotal + shippingFee

	// Handle quantity changes
	const handleQuantityChange = (requestId: number, newQuantity: number) => {
		if (newQuantity < 1) return

		setRequestQuantities(prev => ({
			...prev,
			[requestId]: {
				quantity: newQuantity,
				unitPrice: requestQuantities[requestId].unitPrice
			}
		}))
	}

	useEffect(() => {
		setRequestQuantities(selectedRequests.reduce<Record<number, { quantity: number; unitPrice: number }>>((acc, request) => {
			acc[request.id] = {
				quantity: 1,
				unitPrice: request.quotedPrice || 0
			}
			return acc
		}, {}))
	}, [selectedRequests])

	// Validate form
	const isFormValid = () => {
		return (
			selectedAddress &&
			Object.values(requestQuantities).every(item => item.quantity > 0)
		)
	}

	// Handle submit
	const handleSubmit = async () => {
		if (!isFormValid()) {
			toast.error('Vui lòng điền đầy đủ thông tin')
			return
		}

		try {
			const orderData = {
				customItems: selectedRequests.map(item => ({
					customRequestId: item.id,
					quantity: requestQuantities[item.id].quantity,
					unitPrice: requestQuantities[item.id].unitPrice,
					customWidth: item.customWidth,
					customHeight: item.customHeight,
					customDepth: item.customDepth,
					materialId: item.materialId,
					specialRequirements: item.specialRequirements,
					productId: item.productId
				})),
				notes,
				deliveryAddressId: selectedAddress?.id,
				deliveryType: shippingMethod
			}

			const response = await onSubmitOrder(orderData)
			if (response?.data) {
				toast.success('Đặt hàng thành công! Vui lòng thanh toán để xác nhận đơn hàng.')
				onClose()
				// Redirect to payment upload page
				router.push(`/orders/${response.data.orderNumber}/payment`)
			}
		} catch (error) {
			toast.error('Có lỗi xảy ra, vui lòng thử lại')
			console.error('Order submission error:', error)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose} >
			<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-wood-300">
				<DialogHeader>
					<DialogTitle>Đặt hàng yêu cầu tùy chỉnh</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-6">
					{/* Left Column - Order Items & Quantity */}
					<div className="space-y-6">
						{/* Selected Items */}
						<Card>
							<CardHeader>
								<CardTitle>Sản phẩm đã chọn</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{selectedRequests.map((request) => {
									const quantity = requestQuantities[request.id]?.quantity || 1
									const unitPrice = requestQuantities[request.id]?.unitPrice || 0
									return (
										<div key={request.id} className="border border-wood-200 rounded-lg p-4">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h4 className="font-medium text-charcoal mb-2">
														Yêu cầu #{request.id}
													</h4>
													<div className="text-sm text-walnut-600 space-y-1">
														<p><strong>Sản phẩm:</strong> {request.product?.name}</p>
														<p><strong>Vật liệu:</strong> {request.material?.name}</p>
														<p><strong>Kích thước:</strong> {request.customWidth} × {request.customHeight} × {request.customDepth} cm</p>
														{request.specialRequirements && (
															<p><strong>Yêu cầu đặc biệt:</strong> {request.specialRequirements}</p>
														)}
													</div>
												</div>
											</div>

											<Separator className="my-3" />

											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-3">
													<Label className="text-sm font-medium">Số lượng:</Label>
													<div className="flex items-center space-x-2">
														<Button
															size="sm"
															onClick={() => handleQuantityChange(request.id, quantity - 1)}
															disabled={quantity <= 1}
														>
															<Minus className="h-3 w-3" />
														</Button>
														<Input
															type="number"
															value={quantity}
															onChange={(e) => handleQuantityChange(request.id, parseInt(e.target.value) || 1)}
															className="w-20 text-center"
															min="1"
														/>
														<Button
															size="sm"
															onClick={() => handleQuantityChange(request.id, quantity + 1)}
														>
															<Plus className="h-3 w-3" />
														</Button>
													</div>
												</div>

												<div className="text-right">
													<div className="text-sm text-walnut-600">
														{formatPrice(unitPrice)} / cái
													</div>
													<div className="font-medium text-wood-600">
														{formatPrice(unitPrice * quantity)}
													</div>
												</div>
											</div>
										</div>
									)
								})}
							</CardContent>
						</Card>

						{/* Notes */}
						<Card>
							<CardHeader>
								<CardTitle>Ghi chú</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder="Yêu cầu đặc biệt cho đơn hàng..."
									className="border-wood-500"
									rows={3}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Checkout Form */}
					<div className="space-y-6">
						{/* Address Selection */}
						<AddressSelector
							selectedAddress={selectedAddress}
							onAddressChange={setSelectedAddress}
						/>

						{/* Shipping Method */}
						<ShippingMethodSelector
							shippingMethod={shippingMethod}
							onShippingMethodChange={setShippingMethod}
						/>

						{/* Order Summary */}
						<OrderSummary
							subtotal={subtotal}
							shippingFee={shippingFee}
							itemCount={totalItemCount}
							title="Tóm tắt đơn hàng"
						/>

						{/* Order Flow Info */}
						<Card className="bg-blue-50 border-blue-200">
							<CardContent className="pt-6">
								<div className="flex items-start gap-3">
									<div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
										i
									</div>
									<div>
										<h4 className="font-medium text-blue-900 mb-2">Quy trình đặt hàng</h4>
										<div className="text-sm text-blue-800 space-y-1">
											<p>1. Đặt hàng: Tạo đơn hàng với thông tin sản phẩm</p>
											<p>2. Thanh toán: Upload chứng từ thanh toán với số tiền đặt cọc (30-100%)</p>
											<p>3. Xác nhận: Chúng tôi sẽ xác nhận và bắt đầu sản xuất</p>
										</div>
										<div className="mt-3 p-3 bg-blue-100 rounded-lg">
											<p className="text-sm font-medium text-blue-900">
												Tổng tiền: {formatPrice(totalAmount)}
											</p>
											<p className="text-xs text-blue-700 mt-1">
												Bạn sẽ thanh toán từ {formatPrice(totalAmount * 0.3)} đến {formatPrice(totalAmount)} làm tiền đặt cọc
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Submit Button */}
						<Button
							onClick={handleSubmit}
							disabled={!isFormValid() || isLoading}
							className="w-full bg-wood-500 hover:bg-wood-600"
							size="lg"
						>
							{isLoading ? 'Đang xử lý...' : 'Đặt hàng'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
} 