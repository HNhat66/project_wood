'use client'

import React, {
  useEffect,
  useState,
} from 'react';

import {
  AlertCircle,
  Package,
  Plus,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import APIClient from '@/lib/api';
import {
  Category,
  CreateProductWithVariantsRequest,
  Material,
  ProductFormData,
  Size,
} from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface ProductFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [sizes, setSizes] = useState<Size[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([])
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [defaultStockQuantity, setDefaultStockQuantity] = useState(10)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      categoryId: 0,
      isActive: true
    }
  })

  const watchedBasePrice = watch('basePrice')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const client = new APIClient()
      const [categoriesRes, materialsRes, sizesRes] = await Promise.all([
        client.category().getCategories({ limit: 100 }),
        client.material().getMaterials({ limit: 100 }),
        client.size().getSizes({ limit: 100 })
      ])

      setCategories(categoriesRes.data)
      setMaterials(materialsRes.data)
      setSizes(sizesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleMaterialChange = (materialId: number, checked: boolean) => {
    if (checked) {
      setSelectedMaterials(prev => [...prev, materialId])
    } else {
      setSelectedMaterials(prev => prev.filter(id => id !== materialId))
    }
  }

  const handleSizeChange = (sizeId: number, checked: boolean) => {
    if (checked) {
      setSelectedSizes(prev => [...prev, sizeId])
    } else {
      setSelectedSizes(prev => prev.filter(id => id !== sizeId))
    }
  }

  const calculateVariantCount = () => {
    return selectedMaterials.length * selectedSizes.length
  }

  const calculateVariantPrice = (materialId: number) => {
    const material = materials.find(m => m.id === materialId)
    const basePrice = watchedBasePrice || 0
    return material ? basePrice : basePrice
  }

  const getPreviewVariants = () => {
    const variants = []
    for (const materialId of selectedMaterials) {
      for (const sizeId of selectedSizes) {
        const material = materials.find(m => m.id === materialId)
        const size = sizes.find(s => s.id === sizeId)
        variants.push({
          materialId,
          sizeId,
          materialName: material?.name || '',
          sizeName: size?.name || '',
          price: calculateVariantPrice(materialId)
        })
      }
    }
    return variants
  }

  const onSubmit = async (data: ProductFormData) => {
    if (selectedMaterials.length === 0 || selectedSizes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 chất liệu và 1 kích thước')
      return
    }

    setIsLoading(true)
    try {
      const client = new APIClient()
      const requestData: CreateProductWithVariantsRequest = {
        product: data,
        variants: {
          materialIds: selectedMaterials,
          sizeIds: selectedSizes,
          stockQuantity: defaultStockQuantity,
          isAvailable: true
        }
      }

      await client.product().createProductWithVariants(requestData)
      
      reset()
      setSelectedMaterials([])
      setSelectedSizes([])
      setDefaultStockQuantity(10)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Có lỗi xảy ra khi tạo sản phẩm')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Thêm sản phẩm mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Tên sản phẩm là bắt buộc' })}
                  placeholder="Nhập tên sản phẩm"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Danh mục *</Label>
                <Select onValueChange={(value) => setValue('categoryId', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Vui lòng chọn danh mục
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">Giá cơ sở *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="1000"
                  {...register('basePrice', { 
                    required: 'Giá cơ sở là bắt buộc',
                    min: { value: 1000, message: 'Giá phải lớn hơn 1,000đ' }
                  })}
                  placeholder="Nhập giá cơ sở"
                />
                {errors.basePrice && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.basePrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Số lượng tồn kho mặc định</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={defaultStockQuantity}
                  onChange={(e) => setDefaultStockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Số lượng cho mỗi variant"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Nhập mô tả sản phẩm"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', !!checked)}
              />
              <Label htmlFor="isActive">Kích hoạt ngay sau khi tạo</Label>
            </div>

            {/* Chọn chất liệu */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chọn chất liệu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {materials?.map((material) => (
                    <div key={material.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={`material-${material.id}`}
                        checked={selectedMaterials.includes(material.id)}
                        onCheckedChange={(checked) => handleMaterialChange(material.id, !!checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`material-${material.id}`} className="text-sm font-medium">
                          {material.name}
                        </Label>
                        {watchedBasePrice > 0 && (
                          <p className="text-xs text-green-600">
                            {formatPrice(calculateVariantPrice(material.id))}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedMaterials.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Đã chọn: {selectedMaterials.length} chất liệu
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chọn kích thước */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chọn kích thước</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sizes?.map((size) => (
                    <div key={size.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={`size-${size.id}`}
                        checked={selectedSizes.includes(size.id)}
                        onCheckedChange={(checked) => handleSizeChange(size.id, !!checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`size-${size.id}`} className="text-sm font-medium">
                          {size.name}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {size.lengthCm} × {size.widthCm} × {size.heightCm} cm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSizes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Đã chọn: {selectedSizes.length} kích thước
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview variants */}
            {selectedMaterials.length > 0 && selectedSizes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Xem trước variants ({calculateVariantCount()} variants)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {getPreviewVariants().map((variant, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {variant.materialName} - {variant.sizeName}
                          </p>
                          <p className="text-sm text-green-600 font-medium">
                            {formatPrice(variant.price)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Tồn kho: {defaultStockQuantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Hủy
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isLoading || selectedMaterials.length === 0 || selectedSizes.length === 0}
                className="bg-wood-500 hover:bg-wood-600"
              >
                {isLoading ? 'Đang tạo...' : `Tạo sản phẩm (${calculateVariantCount()} variants)`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 