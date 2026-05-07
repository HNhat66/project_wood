'use client'

import {
  useEffect,
  useState,
} from 'react';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar,
  DollarSign,
  Edit3,
  Eye,
  FileText,
  Package,
  Ruler,
  User,
} from 'lucide-react';

import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import {
  useAuth,
  withEmployeeAuth,
} from '@/lib/auth-context';
import {
  CustomRequest,
  CustomRequestStatus,
  ProvideQuotationData,
} from '@/lib/types';

interface CustomRequestDetailsModalProps {
  customRequest: CustomRequest | null
  isOpen: boolean
  onClose: () => void
}

function CustomRequestDetailsModal({ customRequest, isOpen, onClose }: CustomRequestDetailsModalProps) {
  if (!customRequest) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết yêu cầu #{customRequest.id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Thông tin khách hàng */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-wood-700">Tên:</span>
                <span className="ml-2">{customRequest.user?.fullName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-wood-700">Email:</span>
                <span className="ml-2">{customRequest.user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-wood-700">Số điện thoại:</span>
                <span className="ml-2">{customRequest.user?.phone || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin sản phẩm */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Thông tin sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-wood-700">Sản phẩm:</span>
                <span className="ml-2">{customRequest.product?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-wood-700">Danh mục:</span>
                <span className="ml-2">{customRequest.product?.category?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-wood-700">Chất liệu:</span>
                <span className="ml-2">{customRequest.material?.name || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Kích thước tùy chỉnh */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ruler className="h-5 w-5" />
                Kích thước tùy chỉnh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="font-medium text-wood-700">Rộng:</span>
                  <div className="text-2xl font-bold text-wood-600">{customRequest.customWidth} cm</div>
                </div>
                <div>
                  <span className="font-medium text-wood-700">Dài:</span>
                  <div className="text-2xl font-bold text-wood-600">{customRequest.customHeight} cm</div>
                </div>
                <div>
                  <span className="font-medium text-wood-700">Cao/Dày:</span>
                  <div className="text-2xl font-bold text-wood-600">{customRequest.customDepth} cm</div>
                </div>
              </div>
              {customRequest.specialRequirements && (
                <div>
                  <span className="font-medium text-wood-700">Yêu cầu đặc biệt:</span>
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {customRequest.specialRequirements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thông tin báo giá */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Thông tin báo giá
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-wood-700">Trạng thái:</span>
                <Badge
                  className="ml-2"
                  variant={customRequest.status === CustomRequestStatus.PENDING ? 'secondary' : 'default'}
                >
                  {customRequest.status === CustomRequestStatus.PENDING ? 'Chờ báo giá' : 'Đã báo giá'}
                </Badge>
              </div>

              {customRequest.status === CustomRequestStatus.QUOTED && (
                <>
                  <div>
                    <span className="font-medium text-wood-700">Giá báo:</span>
                    <div className="text-2xl font-bold text-green-600">
                      {customRequest.quotedPrice ? formatCurrency(customRequest.quotedPrice) : 'N/A'}
                    </div>
                  </div>

                  {customRequest.materialCost && (
                    <div>
                      <span className="font-medium text-wood-700">Chi phí vật liệu:</span>
                      <span className="ml-2 text-wood-600">{formatCurrency(customRequest.materialCost)}</span>
                    </div>
                  )}

                  {customRequest.laborCost && (
                    <div>
                      <span className="font-medium text-wood-700">Chi phí gia công:</span>
                      <span className="ml-2 text-wood-600">{formatCurrency(customRequest.laborCost)}</span>
                    </div>
                  )}

                  {customRequest.otherCosts && (
                    <div>
                      <span className="font-medium text-wood-700">Chi phí khác:</span>
                      <span className="ml-2 text-wood-600">{formatCurrency(customRequest.otherCosts)}</span>
                    </div>
                  )}

                  {customRequest.estimatedDays && (
                    <div>
                      <span className="font-medium text-wood-700">Thời gian hoàn thành:</span>
                      <span className="ml-2 text-wood-600">{customRequest.estimatedDays} ngày</span>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-wood-700">Báo giá bởi:</span>
                    <span className="ml-2">{customRequest.quotedBy?.fullName || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="font-medium text-wood-700">Thời gian báo giá:</span>
                    <span className="ml-2">{customRequest.quotedAt ? formatDate(customRequest.quotedAt) : 'N/A'}</span>
                  </div>

                  {customRequest.adminNotes && (
                    <div>
                      <span className="font-medium text-wood-700">Ghi chú admin:</span>
                      <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {customRequest.adminNotes}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Thông tin thời gian */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Thông tin thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-wood-700">Ngày tạo:</span>
                <span className="ml-2">{formatDate(customRequest.createdAt)}</span>
              </div>
              <div>
                <span className="font-medium text-wood-700">Cập nhật lần cuối:</span>
                <span className="ml-2">{formatDate(customRequest.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ProvideQuotationModalProps {
  customRequest: CustomRequest | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function ProvideQuotationModal({ customRequest, isOpen, onClose, onSuccess }: ProvideQuotationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    quotedPrice: '',
    estimatedDays: '',
    adminNotes: ''
  })
  const { tokens } = useAuth()
  const apiClient = new APIClient(tokens)

  useEffect(() => {
    if (customRequest) {
      setFormData({
        quotedPrice: customRequest.quotedPrice?.toString() || '',
        estimatedDays: customRequest.estimatedDays?.toString() || '',
        adminNotes: customRequest.adminNotes || ''
      })
    }
  }, [customRequest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customRequest) return

    try {
      setIsLoading(true)

      const quotationData: ProvideQuotationData = {
        quotedPrice: parseFloat(formData.quotedPrice),
        ...(formData.estimatedDays && { estimatedDays: parseInt(formData.estimatedDays) }),
        ...(formData.adminNotes && { adminNotes: formData.adminNotes })
      }

      const response = await apiClient.customRequest().provideQuotation(customRequest.id, quotationData)

      if (response.status === 200) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          quotedPrice: '',
          estimatedDays: '',
          adminNotes: ''
        })
      }
    } catch (error) {
      console.error('Error providing quotation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!customRequest) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cung cấp báo giá cho yêu cầu #{customRequest.id}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className='space-y-2'>
              <Label htmlFor="quotedPrice">Giá báo * (VND)</Label>
              <Input
                id="quotedPrice"
                type="number"
                value={formData.quotedPrice}
                onChange={(e) => handleInputChange('quotedPrice', e.target.value)}
                placeholder="Nhập giá báo"
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor="estimatedDays">Thời gian hoàn thành (ngày)</Label>
              <Input
                id="estimatedDays"
                type="number"
                value={formData.estimatedDays}
                onChange={(e) => handleInputChange('estimatedDays', e.target.value)}
                placeholder="Số ngày ước tính"
              />
            </div>

          </div>

          <div className='space-y-2'>
            <Label htmlFor="adminNotes">Ghi chú admin</Label>
            <Textarea
              id="adminNotes"
              value={formData.adminNotes}
              onChange={(e) => handleInputChange('adminNotes', e.target.value)}
              placeholder="Ghi chú nội bộ về báo giá..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang cập nhật...' : 'Cung cấp báo giá'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdminCustomRequestsPage() {
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedQuotationRequest, setSelectedQuotationRequest] = useState<CustomRequest | null>(null)
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false)
  const { tokens } = useAuth()
  const apiClient = new APIClient(tokens)

  const fetchCustomRequests = async (page: number = 1) => {
    try {
      setIsLoading(true)
      const response = await apiClient.customRequest().getAllCustomRequests({
        page,
        limit: 20
      })

      if (response.status === 200) {
        setCustomRequests(response.data.data)
        setTotalPages(response.data.totalPages)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching custom requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomRequests()
  }, [])

  const handlePageChange = (page: number) => {
    fetchCustomRequests(page)
  }

  const handleViewDetails = (customRequest: CustomRequest) => {
    setSelectedRequest(customRequest)
    setIsDetailsModalOpen(true)
  }

  const handleProvideQuotation = (customRequest: CustomRequest) => {
    setSelectedQuotationRequest(customRequest)
    setIsQuotationModalOpen(true)
  }

  const handleQuotationSuccess = () => {
    fetchCustomRequests(currentPage)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: vi })
  }

  const columns = [
    {
      id: 'id',
      header: 'ID',
      accessorKey: 'id',
    },
    {
      id: 'customer',
      header: 'Khách hàng',
      cell: ({ row }: { row: CustomRequest }) => (
        <div>
          <div className="font-medium">{row.user?.fullName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      id: 'product',
      header: 'Sản phẩm',
      cell: ({ row }: { row: CustomRequest }) => (
        <div>
          <div className="font-medium">{row.product?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.material?.name || 'N/A'}</div>
        </div>
      ),
    },
    {
      id: 'dimensions',
      header: 'Kích thước (cm)',
      cell: ({ row }: { row: CustomRequest }) => (
        <div className="text-sm">
          <div>{row.customWidth} × {row.customHeight} × {row.customDepth}</div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }: { row: CustomRequest }) => (
        <Badge
          variant={row.status === CustomRequestStatus.PENDING ? 'secondary' : 'default'}
        >
          {row.status === CustomRequestStatus.PENDING ? 'Chờ báo giá' : 'Đã báo giá'}
        </Badge>
      ),
    },
    {
      id: 'quotedPrice',
      header: 'Giá báo',
      cell: ({ row }: { row: CustomRequest }) => (
        <div>
          {row.quotedPrice ? (
            <span className="font-medium text-green-600">
              {formatCurrency(row.quotedPrice)}
            </span>
          ) : (
            <span className="text-gray-400">Chưa báo giá</span>
          )}
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }: { row: CustomRequest }) => formatDate(row.createdAt),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }: { row: CustomRequest }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </Button>
          {row.status === CustomRequestStatus.PENDING && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleProvideQuotation(row)}
              className="flex items-center gap-2 bg-wood-600 hover:bg-wood-700"
            >
              <Edit3 className="h-4 w-4" />
              Báo giá
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">Quản lý yêu cầu báo giá</h1>
          <p className="text-walnut-600 mt-1">
            Xử lý các yêu cầu báo giá từ khách hàng
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={customRequests}
            isLoading={isLoading}
            pagination={{
              page: currentPage,
              totalPages,
              onPageChange: handlePageChange,
            }}
          />
        </CardContent>
      </Card>

      <CustomRequestDetailsModal
        customRequest={selectedRequest}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      <ProvideQuotationModal
        customRequest={selectedQuotationRequest}
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onSuccess={handleQuotationSuccess}
      />
    </div>
  )
}
export default withEmployeeAuth(AdminCustomRequestsPage)