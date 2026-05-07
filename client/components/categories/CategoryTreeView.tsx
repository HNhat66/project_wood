'use client'

import React, { useState } from 'react';

import {
  ChevronDown,
  ChevronRight,
  Edit,
  Folder,
  FolderPlus,
  FolderTree,
  MoreHorizontal,
  Plus,
  Trash,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Category } from '@/lib/types';

interface CategoryTreeViewProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: number) => void;
  onAddChild: (parentCategory: Category) => void;
  onAddRoot: () => void;
  isLoading?: boolean;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: number) => void;
  onAddChild: (parentCategory: Category) => void;
  isLoading?: boolean;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  onEdit,
  onDelete,
  onAddChild,
  isLoading
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const hasChildren = category.children && category.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
        Hoạt động
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">
        Ngừng
      </Badge>
    );
  };

  return (
    <div className="w-full">
      <div 
        className="flex items-center justify-between py-2 px-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        style={{ paddingLeft: `${12 + level * 24}px` }}
      >
        <div className="flex items-center space-x-2 flex-1">
          {/* Expand/Collapse Button */}
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          {/* Category Icon */}
          {level === 0 ? (
            <FolderTree className="h-5 w-5 text-wood-600 flex-shrink-0" />
          ) : (
            <Folder className="h-5 w-5 text-wood-500 flex-shrink-0" />
          )}

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-charcoal truncate">
                {category.name}
              </span>
              {getStatusBadge(category.isActive)}
              {category.sortOrder !== null && category.sortOrder !== undefined && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  #{category.sortOrder}
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-walnut-500 truncate mt-1">
                {category.description}
              </p>
            )}
          </div>

          {/* Children Count */}
          {hasChildren && (
            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded flex-shrink-0">
              {category.children.length} danh mục con
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
          {/* Add Child Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(category)}
            className="text-green-600 hover:text-green-900 hover:bg-green-50"
            disabled={isLoading}
            title="Thêm danh mục con"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-wood-600 hover:text-wood-900"
                disabled={isLoading}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(category)}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddChild(category)}
                className="flex items-center space-x-2 text-green-600"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Thêm danh mục con</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(category.id)}
                className="flex items-center space-x-2 text-red-600"
                disabled={hasChildren}
              >
                <Trash className="w-4 h-4" />
                <span>Xóa</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-0">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  categories,
  onEdit,
  onDelete,
  onAddChild,
  onAddRoot,
  isLoading
}) => {
  // Filter root categories (categories without parent)
  const rootCategories = categories.filter(cat => !cat.parentId);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderTree className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có danh mục nào
        </h3>
        <p className="text-gray-500 mb-6">
          Bắt đầu bằng cách tạo danh mục đầu tiên
        </p>
        <Button
          onClick={onAddRoot}
          className="bg-wood-500 hover:bg-wood-600"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo danh mục đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Add Root Category Button */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <FolderTree className="h-5 w-5 text-wood-600" />
          <span className="font-medium text-charcoal">
            Cây danh mục ({categories.length})
          </span>
        </div>
        <Button
          onClick={onAddRoot}
          size="sm"
          className="bg-wood-500 hover:bg-wood-600"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục gốc
        </Button>
      </div>

      {/* Category Tree */}
      <div className="bg-white">
        {rootCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có danh mục gốc nào
          </div>
        ) : (
          rootCategories.map((category) => (
            <CategoryNode
              key={category.id}
              category={category}
              level={0}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              isLoading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryTreeView; 