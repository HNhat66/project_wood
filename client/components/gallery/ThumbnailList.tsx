'use client'

import {
  useEffect,
  useRef,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';

interface ThumbnailListProps {
  images: string[];
  currentIndex: number;
  onThumbnailClick: (index: number) => void;
  className?: string;
}

export default function ThumbnailList({ 
  images, 
  currentIndex, 
  onThumbnailClick, 
  className = '' 
}: ThumbnailListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto scroll to active thumbnail
  useEffect(() => {
    const activeThumb = thumbnailRefs.current[currentIndex];
    if (activeThumb && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const thumbRect = activeThumb.getBoundingClientRect();
      
      const isVisible = thumbRect.left >= containerRect.left && 
                       thumbRect.right <= containerRect.right;
      
      if (!isVisible) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  if (images.length <= 1) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Navigation buttons */}
      {images.length > 4 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white/80 hover:bg-white shadow-md border"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white/80 hover:bg-white shadow-md border"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Thumbnails container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide touch-scroll px-8 md:px-0"
      >
        {images.map((image, index) => (
          <button
            key={index}
            ref={(el) => { thumbnailRefs.current[index] = el; }}
            onClick={() => onThumbnailClick(index)}
            className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 touch-manipulation ${
              index === currentIndex
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <Image
              src={image || '/placeholder.svg'}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
            
            {/* Active indicator */}
            {index === currentIndex && (
              <div className="absolute inset-0 bg-blue-500/20" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 