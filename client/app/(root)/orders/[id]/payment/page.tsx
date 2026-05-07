'use client'

import {
  useEffect,
  useState,
} from 'react';

import { ArrowLeft } from 'lucide-react';
import {
  useParams,
  useRouter,
} from 'next/navigation';
import { toast } from 'sonner';

import { PaymentSection } from '@/components/forms/PaymentSection';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import {
  useAuth,
  withUserAuth,
} from '@/lib/auth-context';
import {
  Order,
  OrderStatus,
} from '@/lib/types';
import { formatPrice } from '@/lib/utils';

function UploadPaymentPage() {
	const router = useRouter()
	const params = useParams()
	const { tokens } = useAuth()

	const [order, setOrder] = useState<Order | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const [depositAmount, setDepositAmount] = useState<number>(0)
	const [notes, setNotes] = useState('')

	const orderNumber = params.id as string

	// Fetch order details
	useEffect(() => {
		const fetchOrder = async () => {
			if (!orderNumber || !tokens.accessToken) return

			try {
				const api = new APIClient(tokens)
				const response = await api.order().trackOrder(orderNumber)
				setOrder(response.data)

				// Set initial deposit amount to minimum (30% of total)
				const minDeposit = Number(response.data.totalAmount) * 0.3
				setDepositAmount(Math.ceil(minDeposit))
			} catch (error: any) {
				const errorMessage = error.message || 'Không thể tải thông tin đơn hàng'
				toast.error(errorMessage)
				router.push('/orders')
			} finally {
				setIsLoading(false)
			}
		}

		fetchOrder()
	}, [orderNumber, tokens.accessToken, router])

	const handleCreatePaymentUrl = async () => {
		if (!order) return

		setUploadError('')

		// Validate inputs
		const minDeposit = Number(order.totalAmount) * 0.3
		const maxDeposit = Number(order.totalAmount)

		if (depositAmount < minDeposit || depositAmount > maxDeposit) {
			setUploadError(`Số tiền đặt cọc phải nằm trong khoảng ${formatPrice(minDeposit)} - ${formatPrice(maxDeposit)}`)
			return
		}

		setIsUploading(true)
		try {


			// Submit payment proof
			const api = new APIClient(tokens)
			const response = await api.order().createPaymentUrl(orderNumber, depositAmount)
			console.log(response, 'response.data.paymentUrl')
			window.location.href = response.data.paymentUrl
		} catch (error: any) {
			const errorMessage = error.message || 'Có lỗi xảy ra khi tạo link thanh toán'
			setUploadError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
		}
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-cream flex items-center justify-center">
				<div className="text-center">
					<LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
					<p className="text-walnut-600">Đang tải thông tin đơn hàng...</p>
				</div>
			</div>
		)
	}

	if (!order) {
		return (
			<div className="min-h-screen bg-cream flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-charcoal mb-4">Đơn hàng không tồn tại</h1>
					<Button onClick={() => router.push('/orders')}>Quay lại đơn hàng</Button>
				</div>
			</div>
		)
	}

	if (order.orderStatus !== OrderStatus.AWAITING_PAYMENT_PROOF) {
		return (
			<div className="min-h-screen bg-cream flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-charcoal mb-4">Đơn hàng không cần thanh toán</h1>
					<p className="text-walnut-600 mb-4">Đơn hàng này đã được thanh toán hoặc không ở trạng thái chờ thanh toán.</p>
					<Button onClick={() => router.push(`/tracking?order=${orderNumber}`)}>Xem chi tiết đơn hàng</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-cream">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					{/* Header */}
					<div className="flex items-center gap-4 mb-6">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.push('/orders')}
							className="flex items-center gap-2"
						>
							<ArrowLeft className="h-4 w-4" />
							Quay lại
						</Button>
						<div>
							<h1 className="text-2xl font-bold text-charcoal">Thanh toán đơn hàng</h1>
							<p className="text-walnut-600">Đơn hàng #{order.orderNumber}</p>
						</div>
					</div>

					{/* Order Summary */}
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Thông tin đơn hàng</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between">
								<span className="text-walnut-600">Tổng tiền hàng</span>
								<span className="font-medium">{formatPrice(Number(order.totalAmount))}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-walnut-600">Phí giao hàng</span>
								<span className="font-medium">{formatPrice(Number(order.finalAmount) - Number(order.totalAmount))}</span>
							</div>
							<Separator />
							<div className="flex justify-between text-lg font-bold">
								<span>Tổng cộng</span>
								<span className="text-wood-600">{formatPrice(Number(order.finalAmount))}</span>
							</div>
						</CardContent>
					</Card>

					{/* Payment Section */}
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Thông tin thanh toán</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<PaymentSection
								totalPrice={Number(order.totalAmount)}
								depositAmount={depositAmount}
								onDepositChange={setDepositAmount}
							/>

							<div className="space-y-2">
								<Label htmlFor="notes" className="block text-sm font-medium text-charcoal">
									Ghi chú thanh toán (tùy chọn)
								</Label>
								<Textarea
									id="notes"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder="Thêm ghi chú về thanh toán..."
									className="border-wood-300 focus:border-wood-500"
								/>
							</div>
						</CardContent>
					</Card>


					{/* Submit Button */}
					{!uploadError && !isUploading && <Button
						onClick={handleCreatePaymentUrl}
						disabled={isUploading || !depositAmount}
						className="w-full bg-wood-500 hover:bg-wood-600 disabled:opacity-50"
						size="lg"
					>
						{isUploading ? (
							<>
								<LoadingSpinner className="w-4 h-4 mr-2" />
								Đang xử lý...
							</>
						) : (
							'Xác nhận thanh toán'
						)}
					</Button>}
				</div>
			</div>
		</div>
	)
}

export default withUserAuth(UploadPaymentPage) 