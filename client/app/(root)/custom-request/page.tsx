'use client'

import { useState } from 'react';

import {
  Edit,
  MoreHorizontal,
  Settings,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import CustomRequestCancelDialog
  from '@/components/modals/CustomRequestCancelDialog';
import {
  CustomRequestOrderDialog,
} from '@/components/modals/CustomRequestOrderDialog';
import {
  CustomRequestUpdateDialog,
} from '@/components/modals/CustomRequestUpdateDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import APIClient from '@/lib/api';
import {
  useAuth,
  usePermissions,
  withUserAuth,
} from '@/lib/auth-context';
import { queryKeys } from '@/lib/react-query';
import {
  CustomRequest,
  CustomRequestStatus,
  PaginatedResponse,
  UpdateCustomRequestData,
} from '@/lib/types';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const statusColors: Record<CustomRequestStatus, string> = {
	[CustomRequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
	[CustomRequestStatus.QUOTED]: 'bg-green-100 text-green-800',
}

const statusLabels: Record<CustomRequestStatus, string> = {
	[CustomRequestStatus.PENDING]: 'Đang chờ',
	[CustomRequestStatus.QUOTED]: 'Đã được báo giá',
}

function CustomRequestPage() {
	const [selectedRows, setSelectedRows] = useState<number[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('')
	const [showOrderDialog, setShowOrderDialog] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [deletingRequestId, setDeletingRequestId] = useState<number | null>(null)
	const [showUpdateDialog, setShowUpdateDialog] = useState(false)
	const [updatingRequest, setUpdatingRequest] = useState<CustomRequest | null>(null)
	const { tokens } = useAuth()
	const { canAccessUserFeatures } = usePermissions()
	const apiClient = new APIClient(tokens)
	const queryClient = useQueryClient()

	// Real API call with caching - User's own custom requests
	const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<CustomRequest>>({
		queryKey: queryKeys.customRequests.list({
			page: currentPage,
			limit: rowsPerPage,
			search: searchTerm,
			status: statusFilter,
		}),
		queryFn: async () => {
			const response = await apiClient.customRequest().getMyCustomRequests({
				page: currentPage,
				limit: rowsPerPage,
				status: statusFilter || undefined,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
		gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (was cacheTime)
		refetchOnWindowFocus: false, // Don't refetch when window gains focus
		retry: 3, // Retry failed requests 3 times
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
		enabled: !!tokens?.accessToken, // Only run query if user is authenticated
	})

	// Mutation for creating order from custom requests
	const createOrderMutation = useMutation({
		mutationFn: (orderData: {
			notes?: string,
			deliveryAddressId: number,
			deliveryType: string,
			customItems: {
				productId: number,
				customRequestId: number,
				customWidth: number,
				customHeight: number,
				customDepth: number,
				materialId: number,
				quantity: number,
				specialRequirements: string,
					unitPrice: number,
				estimatedDays?: number
			}[]
		}) => {
			return apiClient.order().createOnlineOrder(orderData)
		},
		onSuccess: () => {
			toast.success('Đơn hàng đã được tạo thành công!')
			setShowOrderDialog(false)
			setSelectedRows([])
			queryClient.invalidateQueries({
				queryKey: queryKeys.customRequests.list({
					page: currentPage,
					limit: rowsPerPage,
					search: searchTerm,
					status: statusFilter,
				})
			})
			queryClient.invalidateQueries({
				queryKey: queryKeys.orders.all
			})
		},
		onError: (error: any) => {
			console.error('Create order error:', error)
			toast.error('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.')
		}
	})

	// Mutation for deleting custom request
	const deleteCustomRequestMutation = useMutation({
		mutationFn: (requestId: number) => {
			return apiClient.customRequest().cancelCustomRequest(requestId)
		},
		onSuccess: () => {
			toast.success('Yêu cầu đã được hủy thành công!')
			setShowDeleteDialog(false)
			setDeletingRequestId(null)
			// Refetch the data to update the list
			queryClient.invalidateQueries({
				queryKey: queryKeys.customRequests.list({
					page: currentPage,
					limit: rowsPerPage,
					search: searchTerm,
					status: statusFilter,
				})
			})
		},
		onError: (error: any) => {
			console.error('Delete custom request error:', error)
			toast.error('Có lỗi xảy ra khi hủy yêu cầu. Vui lòng thử lại.')
		}
	})

	// Mutation for updating custom request
	const updateCustomRequestMutation = useMutation({
		mutationFn: ({ id, updateData }: { id: number, updateData: UpdateCustomRequestData }) => {
			return apiClient.customRequest().updateCustomRequest(id, updateData)
		},
		onSuccess: () => {
			toast.success('Yêu cầu đã được cập nhật thành công!')
			setShowUpdateDialog(false)
			setUpdatingRequest(null)
			// Refetch the data to update the list
			queryClient.invalidateQueries({
				queryKey: queryKeys.customRequests.list({
					page: currentPage,
					limit: rowsPerPage,
					search: searchTerm,
					status: statusFilter,
				})
			})
		},
		onError: (error: any) => {
			console.error('Update custom request error:', error)
			toast.error('Có lỗi xảy ra khi cập nhật yêu cầu. Vui lòng thử lại.')
		}
	})

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			// Only select requests that have been quoted
			const quotedRequests = data?.data?.filter(request => request.status === CustomRequestStatus.QUOTED) || []
			setSelectedRows(quotedRequests.map((request) => request.id))
		} else {
			setSelectedRows([])
		}
	}

	const handleSelectRow = (id: number, checked: boolean) => {
		if (checked) {
			setSelectedRows(prev => [...prev, id])
		} else {
			setSelectedRows(prev => prev.filter(rowId => rowId !== id))
		}
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND'
		}).format(amount)
	}

	const formatDate = (date: Date | string) => {
		return new Intl.DateTimeFormat('vi-VN', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date))
	}

	const formatDimensions = (width: number, height: number, depth: number) => {
		return `${width} × ${height} × ${depth} cm`
	}

	// Handle filter changes
	const handleStatusFilterChange = (value: string) => {
		setStatusFilter(value === 'all' ? '' : value)
		setCurrentPage(1) // Reset to first page when filtering
	}

	const handleRowsPerPageChange = (value: string) => {
		setRowsPerPage(Number(value))
		setCurrentPage(1) // Reset to first page when changing page size
	}

	// Handle order button click
	const handleOrderClick = () => {
		if (selectedRows.length === 0) {
			toast.error('Vui lòng chọn ít nhất một yêu cầu để đặt hàng')
			return
		}

		// Check if all selected requests have been quoted
		const selectedRequests = data?.data?.filter(request => selectedRows.includes(request.id)) || []
		const unquotedRequests = selectedRequests.filter(request => request.status !== CustomRequestStatus.QUOTED)

		if (unquotedRequests.length > 0) {
			toast.error('Chỉ có thể đặt hàng cho các yêu cầu đã được báo giá')
			return
		}

		setShowOrderDialog(true)
	}

	// Handle order submission
	const handleOrderSubmit = (orderData: {
		notes?: string,
		deliveryAddressId: number,
		deliveryType: string,
		customItems: {
			productId: number,
			customRequestId: number,
			customWidth: number,
			customHeight: number,
			customDepth: number,
			materialId: number,
			quantity: number,
			specialRequirements: string,
			unitPrice: number,
			estimatedDays?: number
		}[]
	}) => {
		return createOrderMutation.mutateAsync({
			...orderData,
			customItems: orderData.customItems.map(item => ({
				...item,
				customDepth: parseFloat(item.customDepth.toString()),
				customHeight: parseFloat(item.customHeight.toString()),
				customWidth: parseFloat(item.customWidth.toString()),
				quantity: parseInt(item.quantity.toString()),
				unitPrice: parseFloat(item.unitPrice.toString()),
				specialRequirements: item.specialRequirements || '',
				materialId: parseInt(item.materialId.toString()),
			}))
		})
	}

	// Get selected requests for dialog
	const getSelectedRequests = (): CustomRequest[] => {
		return data?.data?.filter(request => selectedRows.includes(request.id)) || []
	}

	// Handle delete button click
	const handleDeleteClick = (requestId: number) => {
		setDeletingRequestId(requestId)
		setShowDeleteDialog(true)
	}

	// Handle delete confirmation
	const handleDeleteConfirm = () => {
		if (deletingRequestId) {
			deleteCustomRequestMutation.mutate(deletingRequestId)
		}
	}

	// Handle delete dialog close
	const handleDeleteCancel = () => {
		setShowDeleteDialog(false)
		setDeletingRequestId(null)
	}

	// Get the request being deleted for dialog display
	const getDeletingRequest = (): CustomRequest | null => {
		if (!deletingRequestId) return null
		return data?.data?.find(request => request.id === deletingRequestId) || null
	}

	// Handle update button click
	const handleUpdateClick = (request: CustomRequest) => {
		setUpdatingRequest(request)
		setShowUpdateDialog(true)
	}

	// Handle update confirmation
	const handleUpdateSubmit = (updateData: UpdateCustomRequestData) => {
		if (updatingRequest) {
			updateCustomRequestMutation.mutate({ id: updatingRequest.id, updateData })
		}
	}

	// Handle update dialog close
	const handleUpdateCancel = () => {
		setShowUpdateDialog(false)
		setUpdatingRequest(null)
	}

	// Show authentication required message
	if (!tokens?.accessToken) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex flex-col items-center justify-center h-64 gap-4">
					<div className="text-lg text-walnut-600">Đăng nhập để xem yêu cầu của bạn</div>
					<Button onClick={() => window.location.href = '/login'}>
						Đăng nhập
					</Button>
				</div>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex items-center justify-center h-64">
					<div className="flex items-center gap-2">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wood-500"></div>
						<div className="text-lg text-walnut-600">Đang tải dữ liệu...</div>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex flex-col items-center justify-center h-64 gap-4">
					<div className="text-lg text-red-600">Lỗi tải dữ liệu</div>
					<div className="text-sm text-walnut-600">{error.message}</div>
					<Button onClick={() => refetch()} variant="outline">
						Thử lại
					</Button>
				</div>
			</div>
		)
	}

	const requests = data?.data || []
	const totalItems = data?.total || 0
	const totalPages = data?.totalPages || 1

	// Count quoted requests among selected
	const selectedQuotedRequests = requests.filter(request =>
		selectedRows.includes(request.id) && request.status === CustomRequestStatus.QUOTED
	)

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-charcoal">Yêu cầu của tôi</h1>
					<p className="text-walnut-600">
						Theo dõi yêu cầu đồ nội thất của bạn ({totalItems} tổng)
					</p>
				</div>
				{canAccessUserFeatures() && (
					<Button
						className='bg-wood-500 hover:bg-wood-600 text-white'
						onClick={handleOrderClick}
						disabled={selectedRows.length === 0 || selectedQuotedRequests.length === 0}
					>
						Đặt hàng ({selectedQuotedRequests.length})
					</Button>
				)}
			</div>


			{/* Table */}
			<Card className='border-wood-200'>
				<CardHeader>
					<div className="flex justify-end gap-4 w-full">

						{/* Status Filter */}
						<div>
							<Select value={statusFilter} onValueChange={handleStatusFilterChange}>
								<SelectTrigger>
									<SelectValue placeholder="Tất cả trạng thái" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tất cả trạng thái</SelectItem>
									<SelectItem value={CustomRequestStatus.PENDING}>Đang chờ</SelectItem>
									<SelectItem value={CustomRequestStatus.QUOTED}>Đã được báo giá</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-2">
							<Button variant="default" size="sm" className='text-white' onClick={() => refetch()}>
								<Settings className="h-4 w-4 mr-2" />
								Làm mới
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-3">
					<div className="overflow-x-auto scrollbar-thin scrollbar-thumb-wood-300 scrollbar-track-wood-100 hover:scrollbar-thumb-wood-400"
						style={{
							scrollbarWidth: 'thin',
							scrollbarColor: '#d4844f #f1ddc7'
						}}>
						<Table className='border-collapse'>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">
										<Checkbox
											checked={selectedRows.length === requests.filter(r => r.status === CustomRequestStatus.QUOTED).length && requests.filter(r => r.status === CustomRequestStatus.QUOTED).length > 0}
											onCheckedChange={handleSelectAll}
										/>
									</TableHead>
									<TableHead>Yêu cầu</TableHead>
									<TableHead>Kích thước</TableHead>
									<TableHead>Yêu cầu đặc biệt</TableHead>
									<TableHead>Ngày tạo</TableHead>
									<TableHead>Trạng thái</TableHead>
									<TableHead>Báo giá</TableHead>
									<TableHead>Ngày dự kiến</TableHead>
									<TableHead>Người báo giá</TableHead>
									<TableHead className="w-12"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{requests.map((request) => (
									<TableRow key={request.id}>
										<TableCell>
											<Checkbox
												checked={selectedRows.includes(request.id)}
												onCheckedChange={(checked) => handleSelectRow(request.id, checked as boolean)}
												disabled={request.status !== CustomRequestStatus.QUOTED}
											/>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="w-12 h-12 bg-wood-100 rounded-lg flex items-center justify-center">
													<span className="text-wood-600 font-medium">
														#{request.id}
													</span>
												</div>
												<Link href={`/products/${request.product?.id}`}>
													<div className="font-medium text-charcoal">
														{request.product?.name || 'Custom Product'}
													</div>
													<div className="text-sm text-walnut-600">
														{request.material?.name || 'Material TBD'}
													</div>
												</Link>
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm font-mono">
												{formatDimensions(request.customWidth, request.customHeight, request.customDepth)}
											</span>
										</TableCell>
										<TableCell>
											<div className="text-sm text-walnut-600 max-w-xs">
												{request.specialRequirements ? (
													<span className="truncate block" title={request.specialRequirements}>
														{request.specialRequirements}
													</span>
												) : (
													<span className="text-walnut-400">Không có yêu cầu đặc biệt</span>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm text-walnut-600">
												{formatDate(request.createdAt)}
											</div>
										</TableCell>
										<TableCell>
											<Badge className={statusColors[request.status]}>
												{statusLabels[request.status]}
											</Badge>
										</TableCell>
										<TableCell>
											{request.status === CustomRequestStatus.QUOTED && request.quotedPrice ? (
												<div className="text-sm">
													<div className="font-medium text-charcoal">
														{formatCurrency(request.quotedPrice)}
													</div>
												</div>
											) : request.status === CustomRequestStatus.PENDING ? (
												<span className="text-walnut-400 text-sm">Đang chờ báo giá</span>
											) : (
												<span className="text-walnut-400 text-sm">Chưa được báo giá</span>
											)}
										</TableCell>
										<TableCell>
											{request.estimatedDays && (
												<div className="text-walnut-600">
													{request.estimatedDays} ngày
												</div>
											)}
										</TableCell>
										<TableCell>
											{request.quotedBy?.fullName}
										</TableCell>
										{/* Only show actions for users */}
										{canAccessUserFeatures() && request.status === CustomRequestStatus.PENDING && (
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="sm">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => handleUpdateClick(request)}>
															<Edit className="h-4 w-4 mr-2" />
															Chỉnh sửa yêu cầu
														</DropdownMenuItem>
														<DropdownMenuItem 
															className="text-red-600"
															onClick={() => handleDeleteClick(request.id)}
														>
															<Trash2 className="h-4 w-4 mr-2" />
															Hủy bỏ yêu cầu
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{requests.length === 0 && !isLoading && (
						<div className="text-center py-12">
							<div className="text-walnut-600 mb-4">
								{searchTerm || statusFilter ? 'Không tìm thấy yêu cầu phù hợp' : 'Bạn chưa tạo yêu cầu đầu tiên'}
							</div>
						</div>
					)}
				</CardContent>
				{/* Pagination */}
				<CardFooter>
					<div className="flex items-center justify-between flex-1">
						<div className="flex items-center gap-2 text-sm text-walnut-600">
							<span>Số dòng trên trang:</span>
							<Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
								<SelectTrigger className="w-20">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="20">20</SelectItem>
									<SelectItem value="50">50</SelectItem>
									<SelectItem value="100">100</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-4">
							<span className="text-sm text-walnut-600">
								{totalItems > 0 ? `${((currentPage - 1) * rowsPerPage) + 1}-${Math.min(currentPage * rowsPerPage, totalItems)} của ${totalItems}` : '0 mặt hàng'}
							</span>

							<div className="flex items-center gap-2">
								<Button
									className='size-8'
									onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
									disabled={currentPage === 1}
								>
									‹
								</Button>
								<Button
									className='size-8'
									onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
									disabled={currentPage === totalPages}
								>
									›
								</Button>
							</div>
						</div>
					</div>
				</CardFooter>
			</Card>

			{/* Only show dialogs for users */}
			{canAccessUserFeatures() && (
				<>
					<CustomRequestOrderDialog
						isOpen={showOrderDialog}
						onClose={() => setShowOrderDialog(false)}
						selectedRequests={getSelectedRequests()}
						onSubmitOrder={handleOrderSubmit}
						isLoading={createOrderMutation.isPending}
					/>

					{/* Update Dialog */}
					<CustomRequestUpdateDialog
						isOpen={showUpdateDialog}
						onClose={handleUpdateCancel}
						customRequest={updatingRequest}
						onUpdateSuccess={handleUpdateSubmit}
						isLoading={updateCustomRequestMutation.isPending}
					/>

					<CustomRequestCancelDialog
						isOpen={showDeleteDialog}
						onClose={handleDeleteCancel}
						customRequest={getDeletingRequest()}
						onCancelSuccess={handleDeleteConfirm}
						isLoading={deleteCustomRequestMutation.isPending}
					/>
				</>
			)}
		</div>
	)
}

export default withUserAuth(CustomRequestPage)
