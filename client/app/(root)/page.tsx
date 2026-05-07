'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import APIClient from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
  const productApi = new APIClient().product();
  
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sample images for the slider - you can replace these with your actual images
  const sliderImages = [
    '/hero.jpg',
    '/hero2.webp', // Replace with actual images
    '/hero3.webp', // Replace with actual images
  ];

  // Function to start/restart auto slide
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
  }, [sliderImages.length]);

  // Auto slide functionality
  useEffect(() => {
    startAutoSlide();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startAutoSlide]);

  // Navigation handlers
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    startAutoSlide(); // Reset timer
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
    startAutoSlide(); // Reset timer
  };

  // Fetch featured products
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productApi.getProducts({
      page: 1,
      limit: 4,
      statusFilter: 'active',
      sort: 'createdAt-desc',
    })
  })

  

  return (
    <div className="min-h-screen bg-cream">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-wood-50 via-cream to-wood-100 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">

              <h1 className="text-4xl lg:text-6xl font-bold text-charcoal leading-tight">
                Đồ gỗ
                <span className="text-wood-500"> thủ công</span>
                <br />
                cho ngôi nhà
                <span className="text-wood-600"> hoàn hảo</span>
              </h1>

              <p className="text-lg text-walnut-700 leading-relaxed max-w-lg">
                Khám phá bộ sưu tập đồ gỗ cao cấp được chế tác bởi những nghệ nhân
                tài ba, mang đến sự sang trọng và ấm cúng cho không gian sống của bạn.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-wood-500 hover:bg-wood-600">
                    Khám phá sản phẩm
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

              </div>

            </div>

            {/* Image Slider */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-wood-200 to-wood-300 rounded-3xl flex items-center justify-center shadow-wood-lg overflow-hidden">
                <div className="relative w-full h-full">
                  {sliderImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Image 
                        src={image} 
                        alt={`Slide ${index + 1}`} 
                        fill 
                        className="object-cover rounded-3xl" 
                      />
                    </div>
                  ))}
                  
                  {/* Navigation Buttons */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-wood-600 p-2 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-wood-600 p-2 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Slide Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {sliderImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentSlide 
                            ? 'bg-white w-6' 
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Featured Products Section */}
      <section className="py-16 bg-wood-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-charcoal mb-4">
              Sản phẩm nổi bật
            </h2>
            <p className="text-walnut-600 max-w-2xl mx-auto">
              Những sản phẩm được yêu thích nhất từ bộ sưu tập đồ gỗ cao cấp của chúng tôi.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 items-center justify-center">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-wood-100 rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts?.data?.data?.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="featured"
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline" className="border-wood-500 text-wood-500 hover:bg-wood-500">
                Xem tất cả sản phẩm
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
