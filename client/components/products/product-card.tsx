'use client'

import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Product } from '@/lib/types';

interface ProductCardProps {
	product: Product
	variant?: 'default' | 'compact' | 'featured'
}

export function ProductCard({
	product,
	variant = 'default',
}: ProductCardProps) {

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND',
		}).format(price)
	}



	const baseClasses = "group relative overflow-hidden transition-all duration-300 hover:shadow-wood-lg"
	const compactClasses = variant === 'compact' ? 'max-w-xs' : ''
	const featuredClasses = variant === 'featured' ? 'md:max-w-sm' : ''

	// Since we don't have variants data, we'll show the base price
	const hasStock = product.isActive
	const displayPrice = product.basePrice

	return (
		<Card className={`${baseClasses} ${compactClasses} ${featuredClasses} w-full mx-auto border-walnut-200 bg-cream p-0`}>
			<Link href={`/products/${product.id}`} className='flex flex-col h-full'>
				<div className="relative aspect-square overflow-hidden">
					<Image
						src={product.thumbnailUrl?.split(';')[0] ?? '/placeholder.svg'}
						alt={product.name}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					/>

					{/* Overlay with actions */}
					<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

					{/* Discount badge - if applicable */}
					{variant === 'featured' && (
						<Badge
							className="absolute top-4 left-4 bg-wood-500 hover:bg-wood-600"
						>
							Nổi bật
						</Badge>
					)}
				</div>

				<CardContent className="p-4 flex-1">
					<div className="space-y-2 flex flex-col h-full">
						<h3 className="font-semibold text-charcoal line-clamp-2 group-hover:text-wood-600 transition-colors">
							{product.name}
						</h3>

						<p className="text-sm text-walnut-600 line-clamp-2">
							{product.description}
						</p>

						<div className="flex items-center justify-between mt-auto">
							<Badge variant="outline" className="text-xs">
								{product.category.name}
							</Badge>

							{product.variantCount && (
								<span className="text-xs text-walnut-500">
									{product.variantCount} biến thể
								</span>
							)}
						</div>
					</div>
				</CardContent>

				<CardFooter className="p-4 pt-0 mt-auto">
					<div className="flex items-center justify-between w-full">
						<div className="flex flex-col">
							<span className="text-lg font-bold text-wood-600">
								{formatPrice(displayPrice)}
							</span>
						</div>

						<Button
							size="sm"
							className="bg-wood-500 hover:bg-wood-600"
							disabled={!hasStock}
						>
							<ShoppingCart className="h-4 w-4 mr-1" />
							Xem chi tiết
						</Button>
					</div>
				</CardFooter>
			</Link>
		</Card>
	)
} 