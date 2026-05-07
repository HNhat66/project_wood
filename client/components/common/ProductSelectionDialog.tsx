'use client';

import React, { useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
} from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import APIClient from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface ProductSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  title?: string;
}

export default function ProductSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  title = "Chọn sản phẩm"
}: ProductSelectionDialogProps) {
  const { tokens } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const apiClient = new APIClient(tokens);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', currentPage, searchTerm],
    queryFn: () => apiClient.product().getProducts({
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      statusFilter: 'active'
    }),
    enabled: isOpen,
  });

  const products = productsData?.data?.data || [];
  const totalPages = productsData?.data?.totalPages || 1;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleProductSelect = (product: Product) => {
    onSelect(product);
    onClose();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Grid */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.thumbnailUrl ? (
                          <Image
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            width={64}
                            height={64}
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-blue-600">
                            {formatCurrency(product.basePrice)}
                          </span>
                          <div className="flex items-center gap-2">
                            {product.category && (
                              <Badge variant="outline" className="text-xs">
                                {product.category.name}
                              </Badge>
                            )}
                            <Badge 
                              variant={product.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {product.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 