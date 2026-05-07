'use client'

import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Address } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { LocationSelector } from './LocationSelector';

interface AddressSelectorProps {
  selectedAddress?: Address
  onAddressChange: (address: Address) => void
}

export function AddressSelector({ selectedAddress, onAddressChange }: AddressSelectorProps) {
  const { tokens } = useAuth()
  const api = new APIClient(tokens)
  const queryClient = useQueryClient()

  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [showAddressList, setShowAddressList] = useState(false)
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    fullName: '',
    phone: '',
    address: '',
    isDefault: false
  })

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.address().getAddresses()
      if (res.data && !selectedAddress) {
        const defaultAddress = res.data.find(addr => addr.isDefault)
        if (defaultAddress) {
          onAddressChange(defaultAddress)
        }
      }
      return res
    }
  })

  // Mutation for creating new address with automatic cache invalidation
  const createAddressMutation = useMutation({
    mutationFn: (newAddressData: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) =>
      api.address().createAddress(newAddressData),
    onSuccess: (response) => {
      onAddressChange(response.data)
      // Invalidate and refetch addresses
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      // Close form and reset
      setShowNewAddressForm(false)
      setNewAddress({
        name: '',
        fullName: '',
        phone: '',
        address: '',
        isDefault: false
      })
      toast.success('Địa chỉ mới đã được thêm thành công!')
    },
    onError: (error) => {
      console.error("Error creating address:", error)
      toast.error('Có lỗi xảy ra khi thêm địa chỉ. Vui lòng thử lại.')
    }
  })

  // Handle address selection
  const handleAddressSelect = (addressId: string) => {
    const selectedAddr = addresses?.data.find(addr => addr.id === parseInt(addressId))
    if (selectedAddr) {
      onAddressChange(selectedAddr)
      setShowAddressList(false)
    }
  }

  // Toggle address list
  const toggleAddressList = () => {
    setShowAddressList(!showAddressList)
  }

  // Handle location change from LocationSelector
  const handleLocationChange = (location: string) => {
    setNewAddress({
      ...newAddress,
      address: location
    })
  }

  // Handle adding new address
  const handleAddNewAddress = async () => {
    if (newAddress.name && newAddress.fullName && newAddress.phone && newAddress.address) {
      const newAddressData: Omit<Address, 'id' | 'createdAt' | 'updatedAt'> = {
        ...newAddress
      }
      createAddressMutation.mutate(newAddressData)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Địa chỉ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <Label>Địa chỉ giao hàng *</Label>

          {/* Selected address card */}
          <div
            onClick={toggleAddressList}
            className="w-full p-4 border-2 border-wood-500 rounded-lg cursor-pointer hover:bg-wood-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {selectedAddress ? (
                  <>
                    <div className="font-medium text-charcoal">{selectedAddress.name}</div>
                    <div className="text-sm text-walnut-600 mt-1">
                      {selectedAddress.fullName} - {selectedAddress.phone}
                    </div>
                    <div className="text-sm text-walnut-600">
                      {selectedAddress.address}
                    </div>
                    {selectedAddress.isDefault && (
                      <span className="inline-block px-2 py-1 text-xs bg-wood-500 text-white rounded mt-2">
                        Mặc định
                      </span>
                    )}
                  </>
                ) : (
                  <div className="text-walnut-500">Chọn địa chỉ giao hàng</div>
                )}
              </div>
              <div className="ml-4">
                <svg
                  className={`w-5 h-5 transition-transform ${showAddressList ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Address list */}
          {showAddressList && addresses?.data && addresses.data.length > 0 && (
            <div className="border border-wood-200 rounded-lg overflow-hidden">
              <div className="max-h-40 overflow-y-auto scrollbar-hide py-3">
                <RadioGroup value={selectedAddress?.id?.toString()} onValueChange={handleAddressSelect}>
                  {addresses.data.map((address) => (
                    <div key={address.id} className="border-b border-wood-100 last:border-b-0 hover:bg-wood-50">
                      <div className='px-3'>
                        <RadioGroupItem value={address.id.toString()} id={address.id.toString()} className="mt-1" hidden />
                        <Label htmlFor={address.id.toString()} className={cn("flex-1 cursor-pointer")}>
                          <div className={cn("space-y-1 border border-wood-200 rounded-lg p-2 w-full", selectedAddress?.id === address.id && "bg-wood-400 text-white")}>
                            <div className="font-medium">{address.name}</div>
                            <div className="text-sm mt-1">
                              {address.fullName} - {address.phone}
                            </div>
                            <div className="text-sm">
                              {address.address}
                            </div>
                            {address.isDefault && (
                              <span className={cn("inline-block px-2 py-1 text-xs rounded mt-2 bg-wood-500 text-white", selectedAddress?.id === address.id && "bg-white text-wood-500")}>
                                Mặc định
                              </span>
                            )}
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Add new address button */}
          <Button
            type="button"
            variant="default"
            onClick={() => setShowNewAddressForm(!showNewAddressForm)}
            className="w-full"
          >
            Thêm địa chỉ mới
          </Button>

          {/* New address form */}
          {showNewAddressForm && (
            <Card className="border-wood-200 bg-wood-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Thêm địa chỉ mới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className='space-y-2'>
                  <Label htmlFor="new-address-name">Tên địa chỉ *</Label>
                  <Input
                    id="new-address-name"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    placeholder="Ví dụ: Nhà riêng, Văn phòng..."
                    className='border-wood-500'
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className='space-y-2'>
                    <Label htmlFor="new-full-name">Họ và tên *</Label>
                    <Input
                      id="new-full-name"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className='border-wood-500'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor="new-phone">Số điện thoại *</Label>
                    <Input
                      id="new-phone"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="0912345678"
                      className='border-wood-500'
                    />
                  </div>
                </div>



                <LocationSelector
                  value={newAddress.address}
                  onChange={handleLocationChange}
                  layout="column"
                />

                <div className='flex items-center gap-2'>
                  <Label htmlFor="new-address-default">Đặt làm địa chỉ mặc định</Label>
                  <Checkbox
                    className='border-wood-500'
                    id="new-address-default"
                    checked={newAddress.isDefault}
                    onCheckedChange={(checked) => setNewAddress({ ...newAddress, isDefault: checked as boolean })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleAddNewAddress}
                    disabled={
                      !newAddress.name ||
                      !newAddress.fullName ||
                      !newAddress.phone ||
                      !newAddress.address ||
                      createAddressMutation.isPending
                    }
                    className="bg-wood-500 hover:bg-wood-600"
                  >
                    {createAddressMutation.isPending ? 'Đang thêm...' : 'Thêm địa chỉ'}
                  </Button>
                  <Button
                    type="button"
                    variant={'default'}
                    className='bg-red-500 text-white hover:bg-red-600'
                    onClick={() => {
                      setShowNewAddressForm(false)
                      setNewAddress({
                        name: '',
                        fullName: '',
                        phone: '',
                        address: '',
                        isDefault: false
                      })
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 