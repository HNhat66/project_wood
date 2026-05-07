'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  CheckCircle,
  Edit,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
  withAdminAuth,
} from '@/lib/auth-context';
import { PaymentQR } from '@/lib/types';
import { uploadImage } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Zod validation schemas
const paymentQRSchema = z.object({
  qrCodeUrl: z.string().optional(),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  description: z.string().optional().or(z.literal('')),
})

type PaymentQRFormData = z.infer<typeof paymentQRSchema>

// API data types that match the API client expectations
interface CreatePaymentQRData {
  qrCodeUrl: string
  bankName: string
  accountNumber: string
  accountName: string
  description?: string
}

interface UpdatePaymentQRData {
  qrCodeUrl?: string
  bankName: string
  accountNumber: string
  accountName: string
  description?: string
}

interface QRDialogProps {
  qr?: PaymentQR | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
}

function QRDialog({ qr, open, onOpenChange, mode }: QRDialogProps) {
  const { tokens } = useAuth()
  const api = new APIClient(tokens)
  const queryClient = useQueryClient()
  const [imagePreview, setImagePreview] = useState<string | null>(
    qr?.qrCodeUrl || null
  )
	const [file, setFile] = useState<File | null>(null)

  const form = useForm<PaymentQRFormData>({
    resolver: zodResolver(paymentQRSchema),
    defaultValues: {
      qrCodeUrl: qr?.qrCodeUrl || '',
      bankName: qr?.bankName || '',
      accountNumber: qr?.accountNumber || '',
      accountName: qr?.accountName || '',
      description: qr?.description || '',
    },
  })

  // Reset form and states when dialog props change
  useEffect(() => {
    if (open) {
      form.reset({
        qrCodeUrl: qr?.qrCodeUrl || '',
        bankName: qr?.bankName || '',
        accountNumber: qr?.accountNumber || '',
        accountName: qr?.accountName || '',
        description: qr?.description || '',
      })
      setImagePreview(qr?.qrCodeUrl || null)
      setFile(null)
    } else {
      // Reset when dialog closes
      setImagePreview(null)
      setFile(null)
    }
  }, [open, qr, mode, form])

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentQRData) =>
      api.paymentQRManagement().createPaymentQR(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-qrs'] })
      toast.success('QR code đã được tạo thành công')
      onOpenChange(false)
      form.reset()
      setImagePreview(null)
      setFile(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi tạo QR code')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePaymentQRData) =>
      api.paymentQRManagement().updatePaymentQR(qr!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-qrs'] })
      toast.success('QR code đã được cập nhật thành công')
      onOpenChange(false)
      setFile(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi cập nhật QR code')
    },
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh phải nhỏ hơn 5MB')
        return
      }
			setImagePreview(URL.createObjectURL(file))
			setFile(file)
    }
  }

  const onSubmit = async (data: PaymentQRFormData) => {
    try {
      let finalQrCodeUrl: string = data.qrCodeUrl || '';

      if (mode === 'create') {
        // For create: file must exist and should be uploaded
        if (!file) {
          toast.error('Vui lòng chọn ảnh QR code');
          return;
        }

        // Upload the image
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadResult = await uploadImage(formDataUpload);

        if (uploadResult?.secure_url) {
          finalQrCodeUrl = uploadResult.secure_url;
        } else {
          toast.error('Lỗi khi tải lên ảnh');
          return;
        }
      } else {
        // For update: check if file exists
        if (file) {
          // New file selected, upload it
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          const uploadResult = await uploadImage(formDataUpload);

          if (uploadResult?.secure_url) {
            finalQrCodeUrl = uploadResult.secure_url;
          } else {
            toast.error('Lỗi khi tải lên ảnh');
            return;
          }
        } else {
          // No new file, keep the old URL
          finalQrCodeUrl = qr?.qrCodeUrl || '';
        }
      }

      if (mode === 'create') {
        // Prepare create data with required qrCodeUrl
        const createData: CreatePaymentQRData = {
          qrCodeUrl: finalQrCodeUrl,
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountName: data.accountName || '',
          description: data.description,
        };

        createMutation.mutate(createData);
      } else {
        // Prepare update data
        const updateData: UpdatePaymentQRData = {
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountName: data.accountName || '',
          description: data.description,
        };

        // Only include qrCodeUrl if it's different from the original
        if (file || finalQrCodeUrl !== qr?.qrCodeUrl) {
          updateData.qrCodeUrl = finalQrCodeUrl;
        }

        updateMutation.mutate(updateData);
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error('Lỗi khi xử lý yêu cầu');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tạo QR Code' : 'Cập nhật QR Code'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Thêm mới một QR code thanh toán cho khách hàng quét trong quá trình thanh toán.'
              : 'Cập nhật thông tin QR code thanh toán.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="qrCodeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ảnh QR Code</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>
                      {imagePreview && (
                        <div className="border rounded-lg p-2">
                          <Image
                            src={imagePreview}
                            alt="QR Code Preview"
                            width={200}
                            height={200}
                            className="mx-auto rounded"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Tải lên ảnh QR code (JPG, PNG, max 5MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ngân hàng</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vietcombank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tài khoản</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tài khoản</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., NGUYEN VAN A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Thêm mô tả cho QR code này..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? mode === 'create'
                    ? 'Đang tạo...'
                    : 'Đang cập nhật...'
                  : mode === 'create'
                    ? 'Tạo QR Code'
                    : 'Cập nhật QR Code'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function QrCodesPage() {
  const { tokens } = useAuth()
  const api = new APIClient(tokens)
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedQR, setSelectedQR] = useState<PaymentQR | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [qrToDelete, setQrToDelete] = useState<PaymentQR | null>(null)

  // Fetch QR codes
  const { data: qrResponse, isLoading: isLoadingQRs } = useQuery({
    queryKey: ['payment-qrs'],
    queryFn: () => api.paymentQRManagement().getAllPaymentQRs(),
  })

  const qrCodes = qrResponse?.data?.data || []

  // Set active mutation
  const setActiveMutation = useMutation({
    mutationFn: (id: number) =>
      api.paymentQRManagement().setActivePaymentQR(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-qrs'] })
      toast.success('QR code đã được đặt làm hoạt động')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi đặt QR code làm hoạt động')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.paymentQRManagement().deletePaymentQR(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-qrs'] })
      toast.success('QR code đã được xóa thành công')
      setDeleteDialogOpen(false)
      setQrToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi xóa QR code')
    },
  })

  const handleCreateQR = () => {
    setSelectedQR(null)
    setDialogMode('create')
    setDialogOpen(true)
  }

  const handleEditQR = (qr: PaymentQR) => {
    setSelectedQR(qr)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleDeleteQR = (qr: PaymentQR) => {
    setQrToDelete(qr)
    setDeleteDialogOpen(true)
  }

  const handleSetActive = (qr: PaymentQR) => {
    setActiveMutation.mutate(qr.id)
  }

  const confirmDelete = () => {
    if (qrToDelete) {
      deleteMutation.mutate(qrToDelete.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">	QR Code Thanh Toán</h1>
          <p className="text-muted-foreground">
            Quản lý QR code thanh toán
          </p>
        </div>
        <Button onClick={handleCreateQR} className='bg-wood-500 hover:bg-wood-600'>
          <Plus className="h-4 w-4 mr-2" />
          Thêm QR Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách QR Code</CardTitle>
          <CardDescription>
            Tất cả QR code thanh toán trong hệ thống. Chỉ có một QR code có thể hoạt động.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingQRs ? (
            <div className="text-center py-8">Đang tải QR code...</div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không tìm thấy QR code</p>
              <Button
                onClick={handleCreateQR}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm QR Code
              </Button>
            </div>
          ) : (
            <div className='overflow-x-auto scrollbar-thin scrollbar-thumb-wood-300 scrollbar-track-wood-100 hover:scrollbar-thumb-wood-400'
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d4844f #f1ddc7'
              }}>
							<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Thông tin ngân hàng</TableHead>
                  <TableHead>Tài khoản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật bởi</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.map((qr: PaymentQR) => (
                  <TableRow key={qr.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={qr.qrCodeUrl}
                          alt="QR Code"
                          width={60}
                          height={60}
                          className="rounded border"
                        />
                        <div className='overflow-hidden'>
                          <p className="font-medium overflow-hidden text-ellipsis whitespace-nowrap">{qr.description || 'Không có mô tả'}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {qr.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{qr.bankName}</p>
                        <p className="text-sm text-muted-foreground">
                          {qr.accountNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono">{qr.accountName}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={qr.status === 'active' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {qr.status === 'active' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {qr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{qr.updatedBy.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(qr.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQR(qr)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {qr.status === 'inactive' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActive(qr)}
                            disabled={setActiveMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQR(qr)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
						</div>
          )}
        </CardContent>
      </Card>

      <QRDialog
        qr={selectedQR}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa QR Code</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa QR code này? Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default withAdminAuth(QrCodesPage)
