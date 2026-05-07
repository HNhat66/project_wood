'use client'

import React, {
  useEffect,
  useState,
} from 'react';

import {
  Edit,
  Home,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { LocationSelector } from '@/components/forms/LocationSelector';
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
  DialogDescription,
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
import APIClient from '@/lib/api';
import {
  useAuth,
  withUserAuth,
} from '@/lib/auth-context';
import { Address } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';

const addressFormSchema = z.object({
  name: z.string().min(1, "Tên địa chỉ không được để trống").max(100, "Tên địa chỉ tối đa 100 ký tự"),
  fullName: z.string().min(1, "Họ tên không được để trống").max(255, "Họ tên tối đa 255 ký tự"),
  phone: z.string().min(10, "Số điện thoại phải có ít nhất 10 số").max(15, "Số điện thoại tối đa 15 số").regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa số"),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  isDefault: z.boolean(),
})

type AddressFormData = z.infer<typeof addressFormSchema>

function AddressPage() {
  const { tokens } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Address | null>(null)
  const [settingDefault, setSettingDefault] = useState<number | null>(null)

  // Initialize form
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: '',
      fullName: '',
      phone: '',
      address: '',
      isDefault: false,
    },
  })

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const api = new APIClient(tokens)
      const response = await api.address().getAddresses()
      if (response.status === 200) {
        setAddresses(response.data)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      toast.error('Không thể tải danh sách địa chỉ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  // Open create dialog
  const handleCreate = () => {
    setEditingAddress(null)
    form.reset({
      name: '',
      fullName: '',
      phone: '',
      address: '',
      isDefault: false,
    })
    setIsDialogOpen(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        handleCreate()
      }
      if (e.key === 'Escape' && isDialogOpen) {
        setIsDialogOpen(false)
      }
      if (e.key === 'Escape' && confirmDelete) {
        setConfirmDelete(null)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isDialogOpen, confirmDelete])

  // Open edit dialog
  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    form.reset({
      name: address.name,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      isDefault: address.isDefault
    })
    setIsDialogOpen(true)
  }

  // Handle form submission
  const onSubmit = async (data: AddressFormData) => {
    try {
      const api = new APIClient(tokens)
      
      const addressData = {
        name: data.name,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        isDefault: data.isDefault,
      }

      if (editingAddress) {
        // Update existing address
        const response = await api.address().updateAddress(editingAddress.id, addressData)
        if (response.status === 200) {
          toast.success('Cập nhật địa chỉ thành công')
          setIsDialogOpen(false)
          fetchAddresses()
        }
      } else {
        // Create new address
        const response = await api.address().createAddress(addressData)
        if (response.status === 201) {
          toast.success(addresses.length === 0 ? 'Thêm địa chỉ đầu tiên thành công' : 'Thêm địa chỉ thành công')
          setIsDialogOpen(false)
          fetchAddresses()
        }
      }
    } catch (error) {
      console.error('Error saving address:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      toast.error(editingAddress ? `Không thể cập nhật địa chỉ: ${errorMessage}` : `Không thể thêm địa chỉ: ${errorMessage}`)
    }
  }

  // Set default address
  const handleSetDefault = async (address: Address) => {
    if (address.isDefault) return

    try {
      setSettingDefault(address.id)
      const api = new APIClient(tokens)
      const response = await api.address().setDefaultAddress(address.id)
      if (response.status === 200) {
        toast.success(`Đã đặt ${address.name} làm địa chỉ mặc định`)
        fetchAddresses()
      }
    } catch (error) {
      console.error('Error setting default address:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      toast.error(`Không thể đặt làm địa chỉ mặc định: ${errorMessage}`)
    } finally {
      setSettingDefault(null)
    }
  }

  // Delete address
  const handleDelete = async (address: Address) => {
    try {
      const api = new APIClient(tokens)
      await api.address().deleteAddress(address.id)
      toast.success(`Đã xóa địa chỉ ${address.name}`)
      setConfirmDelete(null)
      fetchAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      toast.error(`Không thể xóa địa chỉ: ${errorMessage}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <MapPin className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-amber-700">Đang tải danh sách địa chỉ...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 mb-2">Quản lý địa chỉ</h1>
            <p className="text-amber-700">Quản lý địa chỉ giao hàng của bạn</p>
          </div>
          <Button 
            onClick={handleCreate}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            title="Thêm địa chỉ mới (Ctrl+N)"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm địa chỉ mới
          </Button>
        </div>

        {/* Address List */}
        {addresses.length === 0 ? (
          <Card className="border-amber-200 shadow-lg">
            <CardContent className="text-center py-12">
              <MapPin className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">Chưa có địa chỉ nào</h3>
              <p className="text-amber-600 mb-6">Thêm địa chỉ đầu tiên để thuận tiện cho việc giao hàng</p>
              <Button 
                onClick={handleCreate}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm địa chỉ
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {addresses.map((address) => (
              <Card key={address.id} className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Home className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                          {address.name}
                          {address.isDefault && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                              <Star className="w-3 h-3 mr-1" />
                              Mặc định
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(address)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(address)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-700">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{address.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-700">
                      <Phone className="w-4 h-4" />
                      <span>{address.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-amber-700">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span className="text-sm leading-relaxed">{address.address}</span>
                    </div>
                  </div>
                  
                  {!address.isDefault && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address)}
                        disabled={settingDefault === address.id}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {settingDefault === address.id ? 'Đang đặt...' : 'Đặt làm mặc định'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-amber-900">
                {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress ? 'Cập nhật thông tin địa chỉ của bạn' : 'Thêm một địa chỉ giao hàng mới'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên địa chỉ *</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Nhà riêng, Văn phòng..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ tên người nhận *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nguyễn Văn A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại *</FormLabel>
                      <FormControl>
                        <Input placeholder="0912345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <LocationSelector
                  value={form.getValues('address')}
                  onChange={(location) => {
                    form.setValue('address', location)
                  }}
                  layout="column"
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={form.formState.isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {form.formState.isSubmitting ? 'Đang lưu...' : (editingAddress ? 'Cập nhật' : 'Thêm mới')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        {confirmDelete && (
          <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xóa địa chỉ</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn xóa địa chỉ {confirmDelete.name}? Hành động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(null)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => handleDelete(confirmDelete)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Xóa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default withUserAuth(AddressPage)
