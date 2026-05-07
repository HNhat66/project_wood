'use client'

import { useState } from 'react';

import {
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import CategoryModal from '@/components/categories/CategoryModal';
import CategoryTreeView from '@/components/categories/CategoryTreeView';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import APIClient from '@/lib/api';
import {
  useAuth,
  withAdminAuth,
} from '@/lib/auth-context';
import {
  AdminCategoriesTableState,
  Category,
  CategoryFormData,
} from '@/lib/types';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

function AdminCategoriesPage() {
  const [tableState, setTableState] = useState<AdminCategoriesTableState>({
    page: 1,
    limit: 10,
    search: '',
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'create-child';
    category?: Category | null;
    parentCategory?: Category | null;
  }>({
    isOpen: false,
    mode: 'create',
    category: null,
    parentCategory: null,
  });
  const {tokens} = useAuth()
  const queryClient = useQueryClient();
  const client = new APIClient(tokens);

  // Query categories - get all categories without pagination for tree view
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await client.category().getCategories({
        search: tableState.search || undefined,
        limit: 1000, // Get all categories
      });
      return response.data;
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => client.category().createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setModalState({ isOpen: false, mode: 'create' });
    },
    onError: (error: any) => {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo danh mục');
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => 
      client.category().updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setModalState({ isOpen: false, mode: 'create' });
    },
    onError: (error: any) => {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật danh mục');
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => client.category().deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (error: any) => {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi xóa danh mục');
    }
  });

  const handleSearch = (value: string) => {
    setTableState(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleEdit = (category: Category) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      category,
      parentCategory: null,
    });
  };

  const handleAddChild = (parentCategory: Category) => {
    setModalState({
      isOpen: true,
      mode: 'create-child',
      category: null,
      parentCategory,
    });
  };

  const handleAddRoot = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      category: null,
      parentCategory: null,
    });
  };

  const handleModalSubmit = async (data: CategoryFormData) => {
    if (modalState.mode === 'edit' && modalState.category) {
      await updateCategoryMutation.mutateAsync({
        id: modalState.category.id,
        data,
      });
    } else {
      await createCategoryMutation.mutateAsync(data);
    }
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      category: null,
      parentCategory: null,
    });
  };

  // Deep search function that searches through all levels of category tree
  const deepSearchCategories = (categories: Category[], searchTerm: string): Category[] => {
    if (!searchTerm) return categories;
    
    const searchLower = searchTerm.toLowerCase();
    
    const searchInCategory = (category: Category): Category | null => {
      // Check if current category matches
      const nameMatch = category.name.toLowerCase().includes(searchLower);
      const descMatch = category.description?.toLowerCase().includes(searchLower);
      const currentMatches = nameMatch || descMatch;
      
      // Recursively search in children
      const matchingChildren: Category[] = [];
      if (category.children && category.children.length > 0) {
        category.children.forEach(child => {
          const matchingChild = searchInCategory(child);
          if (matchingChild) {
            matchingChildren.push(matchingChild);
          }
        });
      }
      
      // If current category matches OR has matching children, include it
      if (currentMatches || matchingChildren.length > 0) {
        return {
          ...category,
          children: matchingChildren.length > 0 ? matchingChildren : category.children || []
        };
      }
      
      return null;
    };
    
    const results: Category[] = [];
    categories.forEach(category => {
      const matchingCategory = searchInCategory(category);
      if (matchingCategory) {
        results.push(matchingCategory);
      }
    });
    
    return results;
  };

  // Filter categories based on search
  const filteredCategories = deepSearchCategories(categories || [], tableState.search);

  const totalCategories = filteredCategories.length;

  const isModalLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-charcoal">Quản lý danh mục</h1>
        <Button 
          className="bg-wood-500 hover:bg-wood-600"
          onClick={handleAddRoot}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-walnut-400" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={tableState.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Cây danh mục ({totalCategories})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CategoryTreeView
            categories={filteredCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onAddRoot={handleAddRoot}
            isLoading={isLoading || deleteCategoryMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        category={modalState.category}
        parentCategory={modalState.parentCategory}
        allCategories={categories || []}
        isLoading={isModalLoading}
        mode={modalState.mode}
      />
    </div>
  )
}
export default withAdminAuth(AdminCategoriesPage);