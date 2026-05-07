'use client'

import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

import { Badge } from '@/components/ui/badge';
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
import { queryClient } from '@/lib/react-query';
import {
  Category,
  Material,
  Size,
} from '@/lib/types';
import {
  formatPrice,
  uploadImage,
} from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface VariantFormData {
  materialId: number;
  sizeId: number;
  sku: string;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  material: Material;
  size: Size;
}

// Component for rendering hierarchical category options
function CategoryOption({
  category,
  level = 0,
  selectedCategoryId,
  onCategorySelect,
  expandedCategories,
  setExpandedCategories
}: {
  category: Category;
  level?: number;
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  expandedCategories: Set<number>;
  setExpandedCategories: (categories: Set<number>) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategoryId === category.id.toString();
  const paddingClass = level === 0 ? 'pl-3' : level === 1 ? 'pl-7' : level === 2 ? 'pl-11' : 'pl-15';

  const handleClick = () => {
    if (hasChildren) {
      const newExpanded = new Set(expandedCategories);
      if (isExpanded) {
        newExpanded.delete(category.id);
      } else {
        newExpanded.add(category.id);
      }
      setExpandedCategories(newExpanded);
    } else {
      onCategorySelect(category.id.toString(), category.name);
    }
  };

  return (
    <>
      <div
        className={`${paddingClass} flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 transition-colors rounded-md ${isSelected ? 'bg-wood-100 text-wood-800 font-medium' : 'text-gray-700 hover:text-gray-800'
          }`}
        onClick={handleClick}
      >
        {hasChildren && (
          <span className="mr-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        <span className={`text-sm ${hasChildren ? 'font-medium' : ''}`}>
          {category.name}
          {hasChildren && ` (${category.children?.length} danh mục con)`}
        </span>
      </div>

      {hasChildren && isExpanded && category.children?.map(child => (
        <CategoryOption
          key={child.id}
          category={child}
          level={level + 1}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={onCategorySelect}
          expandedCategories={expandedCategories}
          setExpandedCategories={setExpandedCategories}
        />
      ))}
    </>
  );
}

function CreateProductPage() {
  const [formData, setFormData] = useState({
    thumbnailUrl: '',
    name: '',
    description: '',
    basePrice: '',
    categoryId: '',
    isActive: true
  });

  const [materialSearch, setMaterialSearch] = useState('');
  const [sizeSearch, setSizeSearch] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Size[]>([]);
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const { tokens } = useAuth();
  const router = useRouter();
  const client = new APIClient(tokens);

  // Load categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await client.category().getCategories();
      return response.data;
    }
  });

  // Helper function to find category by ID recursively
  const findCategoryById = (categories: Category[], id: string): Category | null => {
    for (const category of categories) {
      if (category.id.toString() === id) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Get selected category name
  const selectedCategory = formData.categoryId ? findCategoryById(categories, formData.categoryId) : null;

  // Load materials
  const { data: materialsData } = useQuery({
    queryKey: ['materials', useDebounce(materialSearch, 500)],
    queryFn: async () => {
      const response = await client.material().getMaterials({
        search: materialSearch
      });
      return response.data;
    },
  });

  // Load sizes
  const { data: sizesData } = useQuery({
    queryKey: ['sizes', useDebounce(sizeSearch, 500)],
    queryFn: async () => {
      const response = await client.size().getSizes({
        search: sizeSearch
      });
      return response.data;
    }
  });

  // Update variants when materials or sizes change
  useEffect(() => {
    const newVariants: VariantFormData[] = [];
    selectedMaterials.forEach(material => {
      selectedSizes.forEach(size => {
        const existingVariant = variants.find(v => v.materialId === material.id && v.sizeId === size.id);
        newVariants.push({
          materialId: material.id,
          sizeId: size.id,
          price: existingVariant?.price || 0,
          stockQuantity: existingVariant?.stockQuantity || 0,
          sku: `${formData.name}-${material.name}-${size.name}`,
          minStockLevel: existingVariant?.minStockLevel || 0,
          material: material,
          size: size
        });
      });
    });
    setVariants(newVariants);
  }, [selectedMaterials, selectedSizes, formData.basePrice]);

  const handleMaterialToggle = (material: Material) => {
    setSelectedMaterials(prev => {
      const exists = prev.find(m => m.id === material.id);
      if (exists) {
        return prev.filter(m => m.id !== material.id);
      }
      return [...prev, material];
    });
  };

  const handleSizeToggle = (size: Size) => {
    setSelectedSizes(prev => {
      const exists = prev.find(s => s.id === size.id);
      if (exists) {
        return prev.filter(s => s.id !== size.id);
      }
      return [...prev, size];
    });
  };

  const handleVariantChange = (index: number, field: 'price' | 'stockQuantity', value: string) => {
    setVariants(prev => prev.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (variants.length === 0) {
      toast.error('Vui lòng chọn ít nhất một vật liệu và kích thước');
      return;
    }

    const invalidVariants = variants.filter(v =>
      !v.price || v.price <= 0 ||
      !v.stockQuantity || v.stockQuantity < 0
    );

    if (invalidVariants.length > 0) {
      toast.error('Vui lòng nhập giá và số lượng hợp lệ cho tất cả variants');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement image upload when API is ready
      if (!selectedImageFile) {
        toast.error('Vui lòng chọn hình ảnh sản phẩm');
        return;
      }
      const formDataImage = new FormData();
      formDataImage.append('file', selectedImageFile);
      const response = await uploadImage(formDataImage);
      if (response.secure_url) {
        // Create product
        const productResponse = await client.product().createProduct({
          name: formData.name,
          description: formData.description,
          categoryId: parseInt(formData.categoryId),
          basePrice: parseFloat(formData.basePrice),
          thumbnailUrl: response.secure_url,
          variants: variants.map(variant => ({
            materialId: variant.materialId,
            sizeId: variant.sizeId,
            stockQuantity: variant.stockQuantity,
            price: variant.price,
            minStockLevel: variant?.minStockLevel || 5,
            sku: variant.sku || `${formData.name}-${variant.material.name}-${variant.size.name}`
          }))
        });
        if (productResponse.status === 201) {
          toast.success('Tạo sản phẩm thành công!');
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          router.push('/dashboard/admin/products');
        } else {
          toast.error('Có lỗi xảy ra khi tạo sản phẩm');
          return;
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo sản phẩm');
        return;
      }



    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi tạo sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/admin/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-charcoal">Tạo sản phẩm mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className='space-y-2'>
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor="basePrice">Giá cơ sở *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Danh mục *</Label>

              {/* Selected category display */}
              {selectedCategory && (
                <div className="mb-2 p-2 bg-wood-50 border border-wood-200 rounded-md">
                  <span className="text-sm font-medium text-wood-800">
                    Đã chọn: {selectedCategory.name}
                  </span>
                </div>
              )}

              {/* Category picker */}
              <div className="border border-gray-300 rounded-md bg-white">
                <div className="max-h-60 overflow-y-auto p-2">
                  {categories.map(category => (
                    <CategoryOption
                      key={category.id}
                      category={category}
                      selectedCategoryId={formData.categoryId}
                      onCategorySelect={(categoryId, categoryName) => {
                        setFormData(prev => ({ ...prev, categoryId }));
                      }}
                      expandedCategories={expandedCategories}
                      setExpandedCategories={setExpandedCategories}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Lưu ý: Chỉ có thể chọn danh mục không có danh mục con (danh mục lá)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả sản phẩm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Hình ảnh sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Hình ảnh sản phẩm</Label>

              {/* Image Preview */}
              {(formData.thumbnailUrl || selectedImageFile) && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <Image
                    src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : formData.thumbnailUrl}
                    alt="Product thumbnail"
                    className="w-full h-full object-cover"
                    width={128}
                    height={128}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageFile(null);
                      setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Kéo thả file vào đây hoặc{' '}
                  <label className="text-wood-600 hover:text-wood-700 cursor-pointer font-medium">
                    chọn file
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedImageFile(file);
                        if (file) {
                          setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
                        }
                      }}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
              </div>

            </div>
          </CardContent>
        </Card>
        {/* Materials Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn vật liệu ({selectedMaterials.length} đã chọn)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm vật liệu..."
                    value={materialSearch}
                    onChange={(e) => {
                      setMaterialSearch(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {selectedMaterials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMaterials.map(material => (
                    <Badge key={material.id} variant="secondary" className="cursor-pointer" onClick={() => handleMaterialToggle(material)}>
                      {material.name}
                      <Trash2 className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {materialsData?.map((material: Material) => (
                  <div key={material.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0">
                    <Checkbox
                      checked={selectedMaterials.some(m => m.id === material.id)}
                      onCheckedChange={() => handleMaterialToggle(material)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-gray-500">{material.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sizes Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn kích thước ({selectedSizes.length} đã chọn)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm kích thước..."
                    value={sizeSearch}
                    onChange={(e) => setSizeSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {selectedSizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSizes.map(size => (
                    <Badge key={size.id} variant="secondary" className="cursor-pointer" onClick={() => handleSizeToggle(size)}>
                      {size.name}
                      <Trash2 className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {sizesData?.map((size: Size) => (
                  <div key={size.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0">
                    <Checkbox
                      checked={selectedSizes.some(s => s.id === size.id)}
                      onCheckedChange={() => handleSizeToggle(size)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{size.name}</div>
                      <div className="text-sm text-gray-500">
                        {size.lengthCm}×{size.widthCm}×{size.heightCm} cm
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants Table */}
        {variants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Biến thể sản phẩm ({variants.length} variants)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vật liệu</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Giá bán (VNĐ)</TableHead>
                      <TableHead>Số lượng tồn</TableHead>
                      <TableHead>Tổng giá trị</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant, index) => (
                      <TableRow key={`${variant.materialId}-${variant.sizeId}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{variant.material?.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{variant.size?.name}</div>
                            <div className="text-sm text-gray-500">
                              {variant.size?.lengthCm}×{variant.size?.widthCm}×{variant.size?.heightCm} cm
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="w-32"
                            min="0"
                            step="1000"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={variant.stockQuantity}
                            onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                            className="w-24"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatPrice(variant.price * variant.stockQuantity)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/admin/products">
            <Button type="button" variant="outline">
              Hủy
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || variants.length === 0}
            className="bg-wood-500 hover:bg-wood-600"
          >
            {isSubmitting ? 'Đang tạo...' : `Tạo sản phẩm (${variants.length} variants)`}
          </Button>
        </div>
      </form>
    </div>
  );
}
export default withEmployeeAuth(CreateProductPage)