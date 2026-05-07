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
import {
  useParams,
  useRouter,
} from 'next/navigation';
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
import {
  Category,
  Material,
  Size,
} from '@/lib/types';
import { uploadImage } from '@/lib/utils';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

interface EditVariantFormData {
  id?: number;
  materialId: number;
  sizeId: number;
  price: string;
  stockQuantity: string;
  minStockLevel: number;
  sku: string;
  material?: Material;
  size?: Size;
  isNew?: boolean;
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

function EditProductPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);

  const [formData, setFormData] = useState({
    thumbnailUrl: '',
    name: '',
    description: '',
    basePrice: '',
    categoryId: '',
    isActive: true
  });
  const [cachedVariants, setCachedVariants] = useState<Record<string, { minStockLevel: number, price: number, stockQuantity: number, sku: string, isNew: boolean }>>({});
  const [materialSearch, setMaterialSearch] = useState('');
  const [sizeSearch, setSizeSearch] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Size[]>([]);
  const [variants, setVariants] = useState<EditVariantFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const { tokens } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const client = new APIClient(tokens);

  // Load product data
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await client.product().getProduct(productId);

      return response.data;
    },
    enabled: !!productId
  });

  // Load categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await client.category().getCategories();
      return response.data;
    }
  });

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
    queryKey: ['sizes', sizeSearch],
    queryFn: async () => {
      const response = await client.size().getSizes({
        search: sizeSearch
      });
      return response.data;
    }
  });

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        basePrice: product.basePrice.toString(),
        categoryId: product.categoryId.toString(),
        isActive: product.isActive,
        thumbnailUrl: product.thumbnailUrl || ''
      });

      // Convert existing variants to form data
      const existingVariants: EditVariantFormData[] = product.variants?.map(variant => ({
        id: variant.id,
        materialId: variant.materialId,
        sizeId: variant.sizeId,
        price: variant.price.toString(),
        stockQuantity: variant.stockQuantity.toString(),
        minStockLevel: variant.minStockLevel,
        sku: variant.sku,
        material: variant.material,
        size: variant.size,
        isNew: false
      })) || [];

      setVariants(existingVariants);
      if (product.variants) {
        setCachedVariants(product.variants.reduce((acc, variant) => {
          acc[`${variant.materialId}-${variant.sizeId}`] = {
            minStockLevel: variant.minStockLevel,
            price: Number(variant.price),
            stockQuantity: variant.stockQuantity,
            sku: variant.sku,
            isNew: false
          };
          return acc;
        }, {} as Record<string, { minStockLevel: number, price: number, stockQuantity: number, sku: string, isNew: boolean }>));
      }
      // Set selected materials and sizes based on existing variants
      const usedMaterials = product.variants?.reduce((acc, v) => {
        if (v.materialId && v.material) {
          acc[v.materialId] = v.material;
        }
        return acc;
      }, {} as Record<number, Material>) || {};
      const usedSizes = product.variants?.reduce((acc, v) => {
        if (v.sizeId && v.size) {
          acc[v.sizeId] = v.size;
        }
        return acc;
      }, {} as Record<number, Size>) || {};
      setSelectedMaterials(Object.values(usedMaterials));
      setSelectedSizes(Object.values(usedSizes));
    }
  }, [product]);

  // Expand category path when categories are loaded and product category is known
  useEffect(() => {
    if (categories.length > 0 && formData.categoryId) {
      const expandPathToCategory = (cats: Category[], targetId: string, path: number[] = []): number[] | null => {
        for (const cat of cats) {
          const currentPath = [...path, cat.id];
          if (cat.id.toString() === targetId) {
            return currentPath.slice(0, -1); // Don't include the target category itself
          }
          if (cat.children && cat.children.length > 0) {
            const found = expandPathToCategory(cat.children, targetId, currentPath);
            if (found) return found;
          }
        }
        return null;
      };

      const pathToExpand = expandPathToCategory(categories, formData.categoryId);
      if (pathToExpand) {
        setExpandedCategories(new Set(pathToExpand));
      }
    }
  }, [categories, formData.categoryId]);

  const handleMaterialToggle = (material: Material) => {
    setSelectedMaterials(prev => {
      const exists = prev.find(m => m.id === material.id);

      if (exists) {
        // Remove material and its variants
        setVariants(current => current.filter(v => v.materialId !== material.id));
        return prev.filter(m => m.id !== material.id);
      } else {
        // Add material and create new variants
        const updatedMaterials = [...prev, material];

        setVariants(current => {
          const newVariants = selectedSizes
            .filter(size => {
              return !current.some(v => v.materialId === material.id && v.sizeId === size.id);
            })
            .map(size => ({
              materialId: material.id,
              sizeId: size.id,
              price: cachedVariants[`${material.id}-${size.id}`]?.price.toString() || '0',
              stockQuantity: cachedVariants[`${material.id}-${size.id}`]?.stockQuantity.toString() || '0',
              minStockLevel: cachedVariants[`${material.id}-${size.id}`]?.minStockLevel || 0,
              sku: cachedVariants[`${material.id}-${size.id}`]?.sku || '',
              material,
              size,
              isNew: cachedVariants[`${material.id}-${size.id}`]?.isNew || true,
            }));
          return [...current, ...newVariants];
        });

        return updatedMaterials;
      }
    });
  };


  const handleSizeToggle = (size: Size) => {
    setSelectedSizes(prev => {
      const exists = prev.find(s => s.id === size.id);

      if (exists) {
        // Remove size and its variants
        setVariants(current => current.filter(v => v.sizeId !== size.id));
        return prev.filter(s => s.id !== size.id);
      } else {
        // Add size and create new variants
        const updatedSizes = [...prev, size];

        setVariants(current => {
          const newVariants = selectedMaterials
            .filter(material => {
              return !current.some(v => v.materialId === material.id && v.sizeId === size.id);
            })
            .map(material => {
              return ({
                materialId: material.id,
                sizeId: size.id,
                price: cachedVariants[`${material.id}-${size.id}`]?.price.toString() || '0',
                stockQuantity: cachedVariants[`${material.id}-${size.id}`]?.stockQuantity.toString() || '0',
                minStockLevel: cachedVariants[`${material.id}-${size.id}`]?.minStockLevel || 0,
                sku: cachedVariants[`${material.id}-${size.id}`]?.sku || '',
                material,
                size,
                isNew: cachedVariants[`${material.id}-${size.id}`]?.isNew || true,
              })
            });
          return [...current, ...newVariants];
        });

        return updatedSizes;
      }
    });
  };


  const handleVariantChange = (index: number, field: 'price' | 'stockQuantity', value: string) => {
    setVariants(prev => prev.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    ));
  };


  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await client.product().updateProduct(productId, data);
      return response.data;
    }
  });

  const createVariantMutation = useMutation({
    mutationFn: async (variantData: any) => {
      const response = await client.productVariant().createProductVariant(variantData);
      return response.data;
    }
  });

  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await client.productVariant().updateProductVariant(id, data);
      return response.data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (variants.length === 0) {
      toast.error('Vui lòng có ít nhất một variant');
      return;
    }

    const invalidVariants = variants.filter(v =>
      !v.price || parseFloat(v.price) <= 0
    );

    if (invalidVariants.length > 0) {
      toast.error('Vui lòng nhập giá hợp lệ cho tất cả variants');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalThumbnailUrl = formData.thumbnailUrl;

      // Upload image if file is selected
      if (selectedImageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedImageFile);
        const result = await uploadImage(formDataUpload);
        if (result?.secure_url) {
          finalThumbnailUrl = result.secure_url;
        }
      }

      // Update product with variants
      await updateProductMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        categoryId: parseInt(formData.categoryId),
        basePrice: parseFloat(formData.basePrice),
        isActive: formData.isActive,
        thumbnailUrl: finalThumbnailUrl,
        variants: variants.map(variant => ({
          materialId: variant.materialId,
          sizeId: variant.sizeId,
          price: parseFloat(variant.price),
          stockQuantity: parseInt(variant.stockQuantity) || 0,
          minStockLevel: variant.minStockLevel || 0,
          sku: variant.sku || `${formData.name}-${variant.material?.name}-${variant.size?.name}`,
        }))
      });

      toast.success('Cập nhật sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      router.push('/dashboard/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (productLoading) {
    return <div className="p-6">Đang tải...</div>;
  }

  if (!product) {
    return <div className="p-6">Không tìm thấy sản phẩm</div>;
  }
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
        <h1 className="text-3xl font-bold text-charcoal">Chỉnh sửa sản phẩm: {product.name}</h1>
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

            {/* Image Upload Section */}
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
                      }}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
              </div>

              {/* URL Input */}
              <div className="text-center text-sm text-gray-500 my-2">hoặc</div>
              <Input
                id="thumbnailUrl"
                placeholder="Nhập URL hình ảnh"
                value={formData.thumbnailUrl}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }));
                  if (e.target.value) {
                    setSelectedImageFile(null);
                  }
                }}
              />
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
                  {selectedMaterials.map(material => {
                    const isUsedInExistingVariants = variants.some(v => v.materialId === material.id && !v.isNew);
                    return (
                      <Badge 
                        key={material.id} 
                        variant={isUsedInExistingVariants ? "default" : "secondary"} 
                        className={`cursor-pointer ${isUsedInExistingVariants ? 'opacity-75' : ''}`} 
                        onClick={() => !isUsedInExistingVariants && handleMaterialToggle(material)}
                      >
                        {material.name}
                        {!isUsedInExistingVariants && <Trash2 className="w-3 h-3 ml-1" />}
                        {isUsedInExistingVariants && <span className="ml-1 text-xs">(đang sử dụng)</span>}
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {materialsData?.map((material: Material) => {
                  const isSelected = selectedMaterials.some(m => m.id === material.id);
                  const isUsedInExistingVariants = variants.some(v => v.materialId === material.id && !v.isNew);
                  
                  return (
                    <div key={material.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0">
                      {!isUsedInExistingVariants ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleMaterialToggle(material)}
                        />
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className={`font-medium ${isUsedInExistingVariants ? 'text-gray-600' : ''}`}>
                          {material.name}
                          {isUsedInExistingVariants && <span className="ml-2 text-xs text-green-600">(đang sử dụng)</span>}
                        </div>
                        <div className="text-sm text-gray-500">{material.description}</div>
                      </div>
                    </div>
                  );
                })}
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
                  {selectedSizes.map(size => {
                    const isUsedInExistingVariants = variants.some(v => v.sizeId === size.id && !v.isNew);
                    return (
                      <Badge 
                        key={size.id} 
                        variant={isUsedInExistingVariants ? "default" : "secondary"} 
                        className={`cursor-pointer ${isUsedInExistingVariants ? 'opacity-75' : ''}`} 
                        onClick={() => !isUsedInExistingVariants && handleSizeToggle(size)}
                      >
                        {size.name}
                        {!isUsedInExistingVariants && <Trash2 className="w-3 h-3 ml-1" />}
                        {isUsedInExistingVariants && <span className="ml-1 text-xs">(đang sử dụng)</span>}
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {sizesData?.map((size: Size) => {
                  const isSelected = selectedSizes.some(s => s.id === size.id);
                  const isUsedInExistingVariants = variants.some(v => v.sizeId === size.id && !v.isNew);
                  
                  return (
                    <div key={size.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0">
                      {!isUsedInExistingVariants ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSizeToggle(size)}
                        />
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className={`font-medium ${isUsedInExistingVariants ? 'text-gray-600' : ''}`}>
                          {size.name}
                          {isUsedInExistingVariants && <span className="ml-2 text-xs text-green-600">(đang sử dụng)</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {size.lengthCm}×{size.widthCm}×{size.heightCm} cm
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Số lượng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant, index) => (
                      <TableRow key={`${variant.materialId}-${variant.sizeId}-${index}`}>
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
                          <Badge variant={variant.isNew ? "secondary" : "default"}>
                            {variant.isNew ? 'Mới' : 'Hiện có'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {variant.isNew ? (
                            <Input
                              type="number"
                              value={variant.stockQuantity}
                              onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                              className="w-32"
                              min="0"
                              step="1"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-gray-600">{variant.stockQuantity}</span>
                          )}
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
            {isSubmitting ? 'Đang cập nhật...' : `Cập nhật sản phẩm (${variants.length} variants)`}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default withEmployeeAuth(EditProductPage)