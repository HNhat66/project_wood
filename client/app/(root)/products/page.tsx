'use client'

import React, {
  useEffect,
  useState,
} from 'react';

import {
  ChevronDown,
  ChevronRight,
  Search,
  TreePine,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';

import { ProductCard } from '@/components/products/product-card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import APIClient from '@/lib/api';
import { Category } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

const sortOptions = [
	{ value: 'name', label: 'Tên A-Z' , sortOrder: 'asc'},
	{ value: 'name', label: 'Tên Z-A' , sortOrder: 'desc'},
	{ value: 'basePrice', label: 'Giá thấp đến cao' , sortOrder: 'asc'},
	{ value: 'basePrice', label: 'Giá cao đến thấp' , sortOrder: 'desc'},
	{ value: 'createdAt', label: 'Mới nhất' , sortOrder: 'desc'},
	{ value: 'createdAt', label: 'Cũ nhất' , sortOrder: 'asc'},
]

// Zod schema for search and filter form
const filterSchema = z.object({
  searchTerm: z.string().optional(),
  category: z.string().optional(),
  sort: z.string().optional(),
})

type FilterFormData = z.infer<typeof filterSchema>

// Component for rendering multi-level category menu
function CategoryMenuItem({ 
  category, 
  selectedCategory, 
  setSelectedCategory, 
  level = 0 
}: { 
  category: Category, 
  selectedCategory: string, 
  setSelectedCategory: (id: string) => void,
  level?: number 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  
  return (
    <div>
      <div 
        className={`flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-wood-100 transition-colors ${
          selectedCategory === category.id.toString() 
            ? 'bg-wood-200 text-wood-800 font-medium' 
            : 'text-wood-700 hover:text-wood-800'
        }`}
        style={{ paddingLeft: `${12 + level * 20}px` }}
        onClick={() => {
					if (hasChildren) {
						setIsOpen(!isOpen);
          }else{
						setSelectedCategory(category.id.toString());

					}
        }}
      >
        {hasChildren && (
          isOpen ? 
            <ChevronDown className="w-4 h-4 mr-2 text-wood-600" /> : 
            <ChevronRight className="w-4 h-4 mr-2 text-wood-600" />
        )}
        <span className="text-sm">{category.name}</span>
      </div>
      
      {hasChildren && isOpen && (
        <div className="mt-1">
          {category.children.map(child => (
            <CategoryMenuItem
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
	const [selectedCategory, setSelectedCategory] = useState("-1")
	const [currentPage, setCurrentPage] = useState(1)
	const [productsPerPage] = useState(9) // Fixed products per page
	
	const form = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      searchTerm: '',
      category: '-1',
      sort: 'createdAt-asc',
    },
  })

  const watchedValues = form.watch()
  const debouncedSearchTerm = useDebounce(watchedValues.searchTerm || '', 500)

	// Reset to first page when filters change
	const resetToFirstPage = () => {
		if (currentPage !== 1) {
			setCurrentPage(1)
		}
	}

	// Reset page when search term or category changes
	useEffect(() => {
		resetToFirstPage()
	}, [debouncedSearchTerm[0], selectedCategory, watchedValues.sort])

	const { data: products, isLoading: isLoadingProducts } = useQuery({
		queryKey: ['products', { 
      searchTerm: debouncedSearchTerm[0], 
      selectedCategory: selectedCategory !== "-1" ? selectedCategory : undefined,
      sort: watchedValues.sort,
			page: currentPage,
			limit: productsPerPage,
    }],
		queryFn: () => new APIClient().product().getProducts({
			search: debouncedSearchTerm[0],
			...(selectedCategory !== "-1" && { categoryFilter: selectedCategory }),
			...(watchedValues.sort && { sort: watchedValues.sort as 'name-asc' | 'name-desc' | 'basePrice-asc' | 'basePrice-desc' | 'createdAt-asc' | 'createdAt-desc'  }),
			statusFilter: 'active',
			page: currentPage,
			limit: productsPerPage,
		}),
		enabled: !!debouncedSearchTerm[0] || !!selectedCategory || currentPage === 1,
	})
	
	const { data: categories } = useQuery({
		queryKey: ['categories'],
		queryFn: () => new APIClient().category().getCategories(),
	})

	// Filter root categories (categories without parent)
	const rootCategories = categories?.data.filter(cat => !cat.parentId) || [];

	// Calculate pagination info
	const totalProducts = products?.data?.total || 0
	const totalPages = products?.data?.totalPages || 1

	// Handle page change
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		// Scroll to top when page changes
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	// Generate page numbers for pagination
	const generatePageNumbers = () => {
		const pages = []
		const delta = 2 // Number of pages to show on each side of current page
		
		// Always show first page
		if (currentPage > delta + 1) {
			pages.push(1)
			if (currentPage > delta + 2) {
				pages.push('...')
			}
		}

		// Show pages around current page
		for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
			pages.push(i)
		}

		// Always show last page
		if (currentPage < totalPages - delta) {
			if (currentPage < totalPages - delta - 1) {
				pages.push('...')
			}
			pages.push(totalPages)
		}

		return pages
	}

	return (
		<div className="min-h-screen bg-cream">
			{/* Main Content with Sidebar */}
			<div className="container mx-auto px-4 py-8">
				<div className="flex gap-8">
					{/* Left Sidebar - Filters */}
					<aside className="w-80 flex-shrink-0">
						<div className="bg-white rounded-xl shadow-sm border border-wood-200 p-6">
							<h3 className="text-lg font-semibold text-wood-900 mb-6">Bộ lọc</h3>
							
							<Form {...form}>
								<form className="space-y-6">
									{/* Search */}
									<FormField
										control={form.control}
										name="searchTerm"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-wood-800 font-medium">Tìm kiếm</FormLabel>
												<FormControl>
													<div className="relative">
														<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wood-400 w-4 h-4" />
														<Input
															placeholder="Tìm kiếm sản phẩm..."
															{...field}
															className="pl-10 border-wood-300 focus:border-wood-500 text-wood-900 placeholder:text-wood-400"
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Categories */}
									<div>
										<FormLabel className="text-wood-800 font-medium mb-3 block">Danh mục</FormLabel>
										<div className="space-y-1 max-h-64 overflow-y-auto">
											{/* All categories option */}
											<div 
												className={`flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-wood-100 transition-colors ${
													selectedCategory === "-1" 
														? 'bg-wood-200 text-wood-800 font-medium' 
														: 'text-wood-700 hover:text-wood-800'
												}`}
												onClick={() => setSelectedCategory("-1")}
											>
												<span className="text-sm">Tất cả danh mục</span>
											</div>
											
											{/* Multi-level categories */}
											{rootCategories.map(category => (
												<CategoryMenuItem
													key={category.id}
													category={category}
													selectedCategory={selectedCategory}
													setSelectedCategory={setSelectedCategory}
												/>
											))}
										</div>
									</div>

									{/* Sort */}
									<FormField
										control={form.control}
										name="sort"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-wood-800 font-medium">Sắp xếp</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger className="border-wood-300 text-wood-900 w-full">
															<SelectValue placeholder="Chọn cách sắp xếp" />
														</SelectTrigger>
													</FormControl>
													<SelectContent className='w-full border-wood-300'>
														{sortOptions.map(option => (
															<SelectItem key={`${option.value}-${option.sortOrder}`} value={`${option.value}-${option.sortOrder}`}>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</form>
							</Form>
						</div>
					</aside>

					{/* Right Content - Products */}
					<main className="flex-1">
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-wood-900 mb-2">
								Sản phẩm ({totalProducts})
							</h2>
							<p className="text-wood-600">
								Khám phá bộ sưu tập đồ gỗ cao cấp của chúng tôi
							</p>
							{currentPage > 1 && (
								<p className="text-sm text-wood-500 mt-1">
									Trang {currentPage} của {totalPages}
								</p>
							)}
						</div>

						{isLoadingProducts ? (
							<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
								{Array.from({ length: productsPerPage }).map((_, index) => (
									<div key={index} className="bg-white rounded-xl shadow-sm border border-wood-200 p-4">
										<div className="animate-pulse">
											<div className="bg-wood-200 h-48 rounded-lg mb-4"></div>
											<div className="bg-wood-200 h-4 rounded mb-2"></div>
											<div className="bg-wood-200 h-3 rounded w-3/4 mb-2"></div>
											<div className="bg-wood-200 h-4 rounded w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						) : products?.data?.data.length === 0 ? (
							<div className="text-center py-12">
								<TreePine className="w-16 h-16 text-wood-300 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-wood-900 mb-2">
									Không tìm thấy sản phẩm
								</h3>
								<p className="text-wood-600">
									Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
								</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
									{products?.data?.data.map(product => (
										<ProductCard
											key={product.id}
											product={product}
										/>
									))}
								</div>

								{/* Pagination */}
								{totalPages > 1 && (
									<div className="mt-12 flex justify-center">
										<Pagination>
											<PaginationContent>
												<PaginationItem>
													<PaginationPrevious 
														href="#"
														onClick={(e) => {
															e.preventDefault()
															if (currentPage > 1) {
																handlePageChange(currentPage - 1)
															}
														}}
														className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
													/>
												</PaginationItem>

												{generatePageNumbers().map((page, index) => (
													<PaginationItem key={index}>
														{page === '...' ? (
															<span className="flex h-9 w-9 items-center justify-center text-wood-600">...</span>
														) : (
															<PaginationLink
																href="#"
																onClick={(e) => {
																	e.preventDefault()
																	handlePageChange(page as number)
																}}
																isActive={currentPage === page}
																className="cursor-pointer"
															>
																{page}
															</PaginationLink>
														)}
													</PaginationItem>
												))}

												<PaginationItem>
													<PaginationNext
														href="#"
														onClick={(e) => {
															e.preventDefault()
															if (currentPage < totalPages) {
																handlePageChange(currentPage + 1)
															}
														}}
														className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
													/>
												</PaginationItem>
											</PaginationContent>
										</Pagination>
									</div>
								)}
							</>
						)}
					</main>
				</div>
			</div>
		</div>
	)
} 