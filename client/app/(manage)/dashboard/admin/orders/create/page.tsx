	'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  Loader2,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import ProductSelectionDialog from '@/components/common/ProductSelectionDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import {
  useAuth,
  withEmployeeAuth,
} from '@/lib/auth-context';
import {
  Customer,
  Product,
} from '@/lib/types';
import {
  cn,
  formatCurrency,
} from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Zod Schemas
const customerInfoSchema = z.object({
	name: z.string().min(1, 'Họ và tên là bắt buộc').min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
	phone: z.string().min(1, 'Số điện thoại là bắt buộc').regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
	email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
	address: z.string().min(1, 'Địa chỉ giao hàng là bắt buộc').min(10, 'Địa chỉ phải có ít nhất 10 ký tự'),
	deliveryType: z.enum(['standard', 'express']),
	estimatedDeliveryDays: z.string().optional(),
});

const standardFormSchema = z.object({
	productId: z.number().min(1, 'Vui lòng chọn sản phẩm'),
	variantId: z.string().min(1, 'Vui lòng chọn biến thể'),
	quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
	notes: z.string().optional(),
});

const customFormSchema = z.object({
	productId: z.number().min(1, 'Vui lòng chọn sản phẩm'),
	customWidth: z.string().min(1, 'Chiều rộng là bắt buộc').refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Chiều rộng phải là số dương'),
	customHeight: z.string().min(1, 'Chiều cao là bắt buộc').refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Chiều cao phải là số dương'),
	customDepth: z.string().min(1, 'Chiều sâu là bắt buộc').refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Chiều sâu phải là số dương'),
	materialId: z.string().min(1, 'Vui lòng chọn chất liệu'),
	quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
	unitPrice: z.string().min(1, 'Đơn giá là bắt buộc').refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Đơn giá phải là số dương'),
	specialRequirements: z.string().optional(),
	estimatedDays: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), 'Số ngày phải là số dương'),
});

const orderSummarySchema = z.object({
	depositAmount: z.string().optional(),
	orderNotes: z.string().optional(),
	totalAmount: z.number().min(1, 'Tổng tiền hàng là bắt buộc'),
}).refine((data) => {
  if (!data.depositAmount || data.depositAmount === '') {
    return true; // Allow empty deposit amount
  }
  
  const depositAmount = parseFloat(data.depositAmount);
  if (isNaN(depositAmount)) {
    return false;
  }
  
  if (depositAmount < 0) {
    return false;
  }
  
  if (depositAmount > 0) {
    const minAmount = 0.3 * data.totalAmount;
    const maxAmount = data.totalAmount;
    return depositAmount >= minAmount && depositAmount <= maxAmount;
  }
  
  return depositAmount === 0; // Allow 0 deposit
}, {
  message: 'Số tiền đặt cọc phải từ 30% đến 100% tổng tiền hàng hoặc bằng 0',
  path: ['depositAmount'],
});

interface StandardOrderItem {
	id: string;
	type: 'standard';
	productId: number;
	productName: string;
	variantId: number;
	variantSku: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	notes?: string;
}

interface CustomOrderItem {
	id: string;
	type: 'custom';
	productId: number;
	productName: string;
	customWidth: number;
	customHeight: number;
	customDepth: number;
	materialId: number;
	materialName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialRequirements?: string;
	estimatedDays?: number;
}

type OrderItem = StandardOrderItem | CustomOrderItem;

function CreateOrderPage() {
	const { tokens } = useAuth();
	const queryClient = useQueryClient();
	const apiClient = new APIClient(tokens);
	const router = useRouter();

	// Dialog states
	const [isStandardProductDialogOpen, setIsStandardProductDialogOpen] = useState(false);
	const [isCustomProductDialogOpen, setIsCustomProductDialogOpen] = useState(false);

	// Customer state
	const [customerStatus, setCustomerStatus] = useState<'new' | 'existing' | null>(null);
	const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

	// Order items state
	const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
	const [currentItemType, setCurrentItemType] = useState<'standard' | 'custom'>('standard');

	// Selected products for forms
	const [selectedStandardProduct, setSelectedStandardProduct] = useState<Product | null>(null);
	const [selectedCustomProduct, setSelectedCustomProduct] = useState<Product | null>(null);

	// Form instances
	const customerForm = useForm<z.infer<typeof customerInfoSchema>>({
		resolver: zodResolver(customerInfoSchema),
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			address: '',
			deliveryType: 'standard',
			estimatedDeliveryDays: '',
		},
	});

	const standardForm = useForm<z.infer<typeof standardFormSchema>>({
		resolver: zodResolver(standardFormSchema),
		defaultValues: {
			productId: 0,
			variantId: '',
			quantity: 1,
			notes: '',
		},
	});

	const customForm = useForm<z.infer<typeof customFormSchema>>({
		resolver: zodResolver(customFormSchema),
		defaultValues: {
			productId: 0,
			customWidth: '',
			customHeight: '',
			customDepth: '',
			materialId: '',
			quantity: 1,
			unitPrice: '',
			specialRequirements: '',
			estimatedDays: '',
		},
	});

	const orderSummaryForm = useForm<z.infer<typeof orderSummarySchema>>({
		resolver: zodResolver(orderSummarySchema),
		defaultValues: {
			depositAmount: '',
			orderNotes: '',
			totalAmount: 0,
		},
	});

	// Watch phone number for customer check
	const watchedPhone = customerForm.watch('phone');
	
	// Load variants for selected product
	const { data: variantsData } = useQuery({
		queryKey: ['product-variants', selectedStandardProduct?.id],
		queryFn: () => apiClient.productVariant().getProductVariants({
			productId: selectedStandardProduct?.id
		}),
		enabled: !!selectedStandardProduct?.id,
	});

	// Load materials
	const { data: materialsData } = useQuery({
		queryKey: ['materials'],
		queryFn: () => apiClient.material().getMaterials({
			active: 'active'
		}),
	});

	const variants = variantsData?.data || [];
	const materials = materialsData?.data || [];

	// Check customer by phone with debounce
	const { data: customerCheckData } = useQuery({
		queryKey: ['customer-check', watchedPhone],
		queryFn: () => apiClient.customer().checkByPhone(watchedPhone),
		enabled: Boolean(watchedPhone && watchedPhone.length >= 10),
		staleTime: 30000, // 30 seconds
	});

	// Update customer status when check data changes
	useEffect(() => {
		if (customerCheckData?.data) {
			if (customerCheckData.data.exists && customerCheckData.data.customer) {
				setCustomerStatus('existing');
				setExistingCustomer(customerCheckData.data.customer);
				customerForm.setValue('name', customerCheckData.data.customer?.fullName || '');
				customerForm.setValue('email', customerCheckData.data.customer?.email || '');
			} else {
				setCustomerStatus('new');
				setExistingCustomer(null);
			}
		}
	}, [customerCheckData, customerForm]);

	// Create offline order mutation
	const createOrderMutation = useMutation({
		mutationFn: (orderData: any) => apiClient.order().createOfflineOrder(orderData),
		onSuccess: (data) => {
			toast.success('Đơn hàng đã được tạo thành công!');
			// Reset forms
			customerForm.reset();
			standardForm.reset();
			customForm.reset();
			orderSummaryForm.reset();
			setOrderItems([]);
			setSelectedStandardProduct(null);
			setSelectedCustomProduct(null);
			queryClient.invalidateQueries({ queryKey: ['orders'] });
			router.push(`/tracking?order=${data.data.orderNumber}`);
		},
		onError: (error: any) => {
			toast.error(`Lỗi tạo đơn hàng: ${error.message}`);
		}
	});

	// Handle product selection for standard items
	const handleStandardProductSelect = (product: Product) => {
		setSelectedStandardProduct(product);
		standardForm.setValue('productId', product.id);
		standardForm.setValue('variantId', ''); // Reset variant when product changes
	};

	// Handle product selection for custom items
	const handleCustomProductSelect = (product: Product) => {
		setSelectedCustomProduct(product);
		customForm.setValue('productId', product.id);
	};

	// Add standard item
	const onStandardFormSubmit = (data: z.infer<typeof standardFormSchema>) => {
		const variant = variants.find(v => v.id === parseInt(data.variantId));

		if (!selectedStandardProduct || !variant) {
			toast.error('Vui lòng chọn sản phẩm và biến thể');
			return;
		}

		const newItem: StandardOrderItem = {
			id: Date.now().toString(),
			type: 'standard',
			productId: selectedStandardProduct.id,
			productName: selectedStandardProduct.name,
			variantId: variant.id,
			variantSku: variant.sku,
			quantity: data.quantity,
			unitPrice: parseFloat(variant.price),
			totalPrice: parseFloat(variant.price) * data.quantity,
			notes: data.notes
		};

		setOrderItems(prev => [...prev, newItem]);
		standardForm.reset();
		setSelectedStandardProduct(null);
		toast.success('Đã thêm sản phẩm chuẩn vào đơn hàng');
	};

	// Add custom item
	const onCustomFormSubmit = (data: z.infer<typeof customFormSchema>) => {
		const material = materials.find(m => m.id === parseInt(data.materialId));

		if (!selectedCustomProduct || !material) {
			toast.error('Vui lòng chọn sản phẩm và chất liệu');
			return;
		}

		const unitPrice = parseFloat(data.unitPrice);
		const newItem: CustomOrderItem = {
			id: Date.now().toString(),
			type: 'custom',
			productId: selectedCustomProduct.id,
			productName: selectedCustomProduct.name,
			customWidth: parseFloat(data.customWidth),
			customHeight: parseFloat(data.customHeight),
			customDepth: parseFloat(data.customDepth),
			materialId: material.id,
			materialName: material.name,
			quantity: data.quantity,
			unitPrice: unitPrice,
			totalPrice: unitPrice * data.quantity,
			specialRequirements: data.specialRequirements,
			estimatedDays: data.estimatedDays ? parseInt(data.estimatedDays) : undefined
		};

		setOrderItems(prev => [...prev, newItem]);
		customForm.reset();
		setSelectedCustomProduct(null);
		toast.success('Đã thêm sản phẩm tùy chỉnh vào đơn hàng');
	};

	// Remove item
	const removeItem = (id: string) => {
		setOrderItems(prev => prev.filter(item => item.id !== id));
		toast.success('Đã xóa sản phẩm khỏi đơn hàng');
	};

	// Calculate totals
	const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
	const deliveryType = customerForm.watch('deliveryType');
	const deliveryFee = deliveryType === 'express' ? 50000 : 30000;
	const finalAmount = totalAmount + deliveryFee;

	// Update totalAmount in form when orderItems change
	useEffect(() => {
		orderSummaryForm.setValue('totalAmount', totalAmount);
		// Trigger validation for depositAmount when totalAmount changes
		if (orderSummaryForm.getValues('depositAmount')) {
			orderSummaryForm.trigger('depositAmount');
		}
	}, [totalAmount, orderSummaryForm]);

	// Submit order
	const onSubmitOrder = async () => {
		// Validate customer form
		const customerValidation = await customerForm.trigger();
		if (!customerValidation) {
			toast.error('Vui lòng kiểm tra lại thông tin khách hàng');
			return;
		}

		// Validate order summary form (including deposit amount validation)
		const orderSummaryValidation = await orderSummaryForm.trigger();
		if (!orderSummaryValidation) {
			toast.error('Vui lòng kiểm tra lại thông tin đặt cọc');
			return;
		}

		if (orderItems.length === 0) {
			toast.error('Vui lòng thêm ít nhất một sản phẩm');
			return;
		}

		const customerData = customerForm.getValues();
		const orderSummaryData = orderSummaryForm.getValues();
		const depositAmount = orderSummaryData.depositAmount ? parseFloat(orderSummaryData.depositAmount) : 0;

		const orderData = {
			customerName: customerData.name,
			customerPhone: customerData.phone,
			customerEmail: customerData.email,
			deliveryAddress: customerData.address,
			deliveryType: customerData.deliveryType,
			estimatedDeliveryDays: customerData.estimatedDeliveryDays,
			standardItems: orderItems.filter(item => item.type === 'standard').map(item => ({
				productVariantId: (item as StandardOrderItem).variantId,
				quantity: item.quantity
			})),
			customItems: orderItems.filter(item => item.type === 'custom').map(item => {
				const customItem = item as CustomOrderItem;
				return {
					productId: customItem.productId,
					customWidth: customItem.customWidth,
					customHeight: customItem.customHeight,
					customDepth: customItem.customDepth,
					materialId: customItem.materialId,
					quantity: customItem.quantity,
					unitPrice: customItem.unitPrice,
					specialRequirements: customItem.specialRequirements,
					estimatedDays: customItem.estimatedDays
				};
			}),
			depositAmount: depositAmount,
			notes: orderSummaryData.orderNotes
		};

		createOrderMutation.mutate(orderData);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center gap-2 mb-6">
				<ShoppingCart className="h-6 w-6" />
				<h1 className="text-2xl font-bold">Tạo đơn hàng offline</h1>
			</div>

			<div className="grid xl:grid-cols-3 gap-6">
				{/* Customer Information */}
				<Card className="xl:col-span-1">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Thông tin khách hàng
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Form {...customerForm}>
							<div className="space-y-4">
								<FormField
									control={customerForm.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Họ và tên *</FormLabel>
											<FormControl>
												<Input placeholder="Nhập họ và tên khách hàng" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={customerForm.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Số điện thoại *</FormLabel>
											<FormControl>
												<Input placeholder="Nhập số điện thoại" {...field} />
											</FormControl>
											<FormMessage />
											{customerStatus === 'existing' && (
												<Badge variant="secondary" className="mt-2">
													Khách hàng cũ - đã mua hàng lần trước
												</Badge>
											)}
											{customerStatus === 'new' && (
												<Badge variant="outline" className="mt-2">
													Khách hàng mới - sẽ tạo mới khi đặt hàng
												</Badge>
											)}
										</FormItem>
									)}
								/>

								<FormField
									control={customerForm.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input type="email" placeholder="Nhập email (tùy chọn)" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={customerForm.control}
									name="address"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Địa chỉ giao hàng *</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Nhập địa chỉ giao hàng"
													rows={3}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={customerForm.control}
									name="deliveryType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Loại giao hàng</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger className='w-full'>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="standard">Tiêu chuẩn (+30,000đ)</SelectItem>
													<SelectItem value="express">Nhanh (+50,000đ)</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={customerForm.control}
									name="estimatedDeliveryDays"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Thời gian giao hàng dự kiến</FormLabel>
											<FormControl>
												<Input placeholder="Ví dụ: 2-3 ngày làm việc" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</Form>
					</CardContent>
				</Card>

				{/* Product Selection */}
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Danh sách sản phẩm
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Product Type Selector */}
						<div className="flex gap-2">
							<Button
								type="button"
								variant={currentItemType === 'standard' ? 'default' : 'outline'}
								onClick={() => setCurrentItemType('standard')}
								className="flex-1"
							>
								Sản phẩm chuẩn
							</Button>
							<Button
								type="button"
								variant={currentItemType === 'custom' ? 'default' : 'outline'}
								onClick={() => setCurrentItemType('custom')}
								className="flex-1"
							>
								Sản phẩm tùy chỉnh
							</Button>
						</div>

						{/* Standard Product Form */}
						{currentItemType === 'standard' && (
							<div className="p-4 border rounded-lg bg-blue-50 space-y-4">
								<h3 className="font-medium text-blue-900">Thêm sản phẩm chuẩn</h3>

								<Form {...standardForm}>
									<form onSubmit={standardForm.handleSubmit(onStandardFormSubmit)} className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<FormLabel>Sản phẩm</FormLabel>
												<Button
													type="button"
													variant="outline"
													className="w-full justify-start"
													onClick={() => setIsStandardProductDialogOpen(true)}
												>
													{selectedStandardProduct ? selectedStandardProduct.name : 'Chọn sản phẩm'}
												</Button>
											</div>

											<FormField
												control={standardForm.control}
												name="variantId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Biến thể</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
															disabled={!selectedStandardProduct}
														>
															<FormControl>
																<SelectTrigger className='w-full overflow-hidden'>
																	<SelectValue placeholder="Chọn biến thể" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{variants.map(variant => (
																	<SelectItem key={variant.id} value={variant.id.toString()}>
																		{variant.sku} - {variant.material?.name} - {variant.size?.name} - {parseFloat(variant.price).toLocaleString()}đ
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
														{(() => {
															const selectedVariant = variants?.find(v => v.id === parseInt(field.value));
															const stockQuantity = selectedVariant?.stockQuantity ?? 0;
															const minStockLevel = selectedVariant?.minStockLevel ?? 0;
															const isLowStock = stockQuantity < minStockLevel;

															return field.value && (
																<div className={cn(
																	'text-xs text-gray-500',
																	isLowStock && 'text-red-500'
																)}>
																	{stockQuantity} sản phẩm còn lại
																</div>
															);
														})()}
													</FormItem>
												)}
											/>

											<FormField
												control={standardForm.control}
												name="quantity"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Số lượng</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="1"
																max={variants?.find(v => v.id === parseInt(standardForm.watch('variantId')))?.stockQuantity || 1}
																{...field}
																onChange={(e) => {
																	if (e.target.value === '') {
																		field.onChange(1);
																		return;
																	}
																	const quantity = parseInt(e.target.value);
																	const maxStock = variants?.find(v => v.id === parseInt(standardForm.watch('variantId')))?.stockQuantity || 1;
																	if (quantity > maxStock) {
																		toast.error('Số lượng vượt quá số lượng có sẵn');
																		return;
																	}
																	field.onChange(quantity);
																}}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={standardForm.control}
												name="notes"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Ghi chú</FormLabel>
														<FormControl>
															<Input placeholder="Ghi chú ngắn" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<Button
											type="submit"
											disabled={!selectedStandardProduct}
											className="w-full"
										>
											<Plus className="h-4 w-4 mr-2" />
											Thêm sản phẩm chuẩn
										</Button>
									</form>
								</Form>
							</div>
						)}

						{/* Custom Product Form */}
						{currentItemType === 'custom' && (
							<div className="p-4 border rounded-lg bg-green-50 space-y-4">
								<h3 className="font-medium text-green-900">Thêm sản phẩm tùy chỉnh</h3>

								<Form {...customForm}>
									<form onSubmit={customForm.handleSubmit(onCustomFormSubmit)} className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="col-span-2 space-y-2">
												<FormLabel>Sản phẩm gốc</FormLabel>
												<Button
													type="button"
													variant="outline"
													className="w-full justify-start"
													onClick={() => setIsCustomProductDialogOpen(true)}
												>
													{selectedCustomProduct ? selectedCustomProduct.name : 'Chọn sản phẩm gốc'}
												</Button>
											</div>

											<FormField
												control={customForm.control}
												name="customWidth"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Chiều rộng (cm)</FormLabel>
														<FormControl>
															<Input type="number" placeholder="100" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={customForm.control}
												name="customHeight"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Chiều cao/Độ dày (cm)</FormLabel>
														<FormControl>
															<Input type="number" placeholder="100" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={customForm.control}
												name="customDepth"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Chiều sâu (cm)</FormLabel>
														<FormControl>
															<Input type="number" placeholder="100" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={customForm.control}
												name="materialId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Chất liệu</FormLabel>
														<Select onValueChange={field.onChange} value={field.value}>
															<FormControl>
																<SelectTrigger className='w-full'>
																	<SelectValue placeholder="Chọn chất liệu" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{materials.map(material => (
																	<SelectItem key={material.id} value={material.id.toString()}>
																		{material.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={customForm.control}
												name="quantity"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Số lượng</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="1"
																{...field}
																onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={customForm.control}
												name="unitPrice"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Đơn giá (đ)</FormLabel>
														<FormControl>
															<Input type="number" placeholder="1500000" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={customForm.control}
												name="specialRequirements"
												render={({ field }) => (
													<FormItem className="col-span-2">
														<FormLabel>Yêu cầu đặc biệt</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Ví dụ: Làm góc bo tròn, sơn màu đặc biệt..."
																rows={2}
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={customForm.control}
												name="estimatedDays"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Số ngày sản xuất ước tính</FormLabel>
														<FormControl>
															<Input type="number" placeholder="14" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<Button
											type="submit"
											disabled={!selectedCustomProduct}
											className="w-full"
										>
											<Plus className="h-4 w-4 mr-2" />
											Thêm sản phẩm tùy chỉnh
										</Button>
									</form>
								</Form>
							</div>
						)}

						{/* Order Items List */}
						{orderItems.length > 0 && (
							<div className="space-y-4">
								<Separator />
								<h3 className="font-medium">Sản phẩm đã thêm ({orderItems.length})</h3>

								<div className="space-y-3">
									{orderItems.map((item) => (
										<div key={item.id} className="flex justify-between items-start p-3 border rounded-lg">
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<Badge variant={item.type === 'standard' ? 'default' : 'secondary'}>
														{item.type === 'standard' ? 'Chuẩn' : 'Tùy chỉnh'}
													</Badge>
													<span className="font-medium">{item.productName}</span>
												</div>

												{item.type === 'standard' ? (
													<div className="text-sm text-gray-600 mt-1">
														SKU: {(item as StandardOrderItem).variantSku} |
														SL: {item.quantity} |
														Giá: {item.unitPrice.toLocaleString()}đ
														{item.notes && <div>Ghi chú: {item.notes}</div>}
													</div>
												) : (
													<div className="text-sm text-gray-600 mt-1">
														Kích thước: {(item as CustomOrderItem).customWidth}x{(item as CustomOrderItem).customHeight}x{(item as CustomOrderItem).customDepth}cm |
														Chất liệu: {(item as CustomOrderItem).materialName} |
														SL: {item.quantity} |
														Giá: {item.unitPrice.toLocaleString()}đ
														{(item as CustomOrderItem).specialRequirements && (
															<div>Yêu cầu: {(item as CustomOrderItem).specialRequirements}</div>
														)}
														{(item as CustomOrderItem).estimatedDays && (
															<div>Thời gian SX: {(item as CustomOrderItem).estimatedDays} ngày</div>
														)}
													</div>
												)}

												<div className="font-medium mt-1">
													Thành tiền: {item.totalPrice.toLocaleString()}đ
												</div>
											</div>

											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeItem(item.id)}
												className="text-red-600 hover:text-red-800"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Order Summary */}
				<Card className="xl:col-span-3">
					<CardHeader>
						<CardTitle className='text-lg font-bold'>Tổng quan đơn hàng</CardTitle>
					</CardHeader>
					<CardContent>
						<Form {...orderSummaryForm}>
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<FormField
											control={orderSummaryForm.control}
											name="depositAmount"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Số tiền đặt cọc (đ)
														{totalAmount > 0 && (
															<span className='text-sm text-gray-500 ml-2'>
																(Từ {formatCurrency(totalAmount * 0.3)} đến {formatCurrency(totalAmount)})
															</span>
														)}
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder="0"
															{...field}
															onChange={(e) => {
																field.onChange(e.target.value);
																// Trigger validation on change
																setTimeout(() => {
																	orderSummaryForm.trigger('depositAmount');
																}, 100);
															}}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={orderSummaryForm.control}
											name="orderNotes"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Ghi chú đơn hàng</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Ghi chú chung cho đơn hàng..."
															rows={3}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="space-y-4">
										<div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
											<div className="flex justify-between">
												<span>Tổng tiền hàng:</span>
												<span className="font-medium">{totalAmount.toLocaleString()}đ</span>
											</div>
											<div className="flex justify-between">
												<span>Phí giao hàng ({deliveryType}):</span>
												<span className="font-medium">{deliveryFee.toLocaleString()}đ</span>
											</div>
											<Separator />
											<div className="flex justify-between text-lg font-bold">
												<span>Tổng cộng:</span>
												<span className="text-blue-600">{finalAmount.toLocaleString()}đ</span>
											</div>
											{orderSummaryForm.watch('depositAmount') && (
												<>
													<div className="flex justify-between text-green-600">
														<span>Đặt cọc:</span>
														<span>-{parseFloat(orderSummaryForm.watch('depositAmount') || '0').toLocaleString()}đ</span>
													</div>
													<div className="flex justify-between text-orange-600 font-medium">
														<span>Còn lại:</span>
														<span>{(finalAmount - parseFloat(orderSummaryForm.watch('depositAmount') || '0')).toLocaleString()}đ</span>
													</div>
												</>
											)}
										</div>

										<Button
											onClick={onSubmitOrder}
											className="w-full"
											size="lg"
											disabled={orderItems.length === 0 || createOrderMutation.isPending}
										>
											{createOrderMutation.isPending ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Đang tạo đơn...
												</>
											) : (
												'Xác nhận & tạo đơn hàng'
											)}
										</Button>
									</div>
								</div>
							</div>
						</Form>
					</CardContent>
				</Card>
			</div>

			{/* Product Selection Dialogs */}
			<ProductSelectionDialog
				isOpen={isStandardProductDialogOpen}
				onClose={() => setIsStandardProductDialogOpen(false)}
				onSelect={handleStandardProductSelect}
				title="Chọn sản phẩm chuẩn"
			/>

			<ProductSelectionDialog
				isOpen={isCustomProductDialogOpen}
				onClose={() => setIsCustomProductDialogOpen(false)}
				onSelect={handleCustomProductSelect}
				title="Chọn sản phẩm gốc"
			/>
		</div>
	);
}

export default withEmployeeAuth(CreateOrderPage)