'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

import MobileImageModal from './MobileImageModal';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onImageChange: (index: number) => void;
  productName?: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onImageChange,
  productName = 'Product Image'
}: ImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onImageChange(newIndex);
  }, [currentIndex, images.length, onImageChange]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onImageChange(newIndex);
  }, [currentIndex, images.length, onImageChange]);

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard navigation for desktop
  useEffect(() => {
    if (isMobile) return; // Let mobile modal handle its own keyboard events
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '=':
        case '+':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetView();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose, isMobile]);

  // Mouse drag for panning when zoomed (desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!images || images.length === 0) return null;

  // Use custom mobile modal for mobile devices
  if (isMobile) {
    return (
      <MobileImageModal
        isOpen={isOpen}
        onClose={onClose}
        images={images}
        currentIndex={currentIndex}
        onImageChange={onImageChange}
        productName={productName}
      />
    );
  }

  // Desktop modal using shadcn Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">{productName}</DialogTitle>
      <DialogContent 
        className="max-w-[95vw] w-full h-[95vh] p-0 bg-black border-none overflow-hidden m-4"
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Top controls */}
          <div className="absolute top-4 left-0 right-0 z-20 flex justify-between items-center px-4">
            {/* Image counter */}
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                className="bg-black/70 hover:bg-black/80 text-white border-none h-10 w-10"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="bg-black/70 hover:bg-black/80 text-white border-none h-10 w-10"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetView}
                className="bg-black/70 hover:bg-black/80 text-white border-none h-10 w-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-black/70 hover:bg-black/80 text-white border-none h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main image display */}
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          >
            <div 
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
            >
              <div className="relative w-[80vw] h-[70vh] max-w-4xl">
                <Image
                  src={images[currentIndex] || '/placeholder.svg'}
                  alt={`${productName} - Image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="80vw"
                  priority
                />
              </div>
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-none h-12 w-12 z-10"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-none h-12 w-12 z-10"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>

          {/* Bottom thumbnail navigation */}
          {images.length > 1 && (
            <div className="bg-black/90 p-4 border-t border-white/10">
              <div className="flex justify-center">
                <div 
                  className="flex gap-2 overflow-x-auto max-w-full scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => onImageChange(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                        index === currentIndex
                          ? 'border-white shadow-lg'
                          : 'border-white/30 hover:border-white/60'
                      }`}
                    >
                      <Image
                        src={image || '/placeholder.svg'}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions overlay */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-xs text-center">
            Sử dụng phím mũi tên, +/- để phóng to, 0 để reset, ESC để đóng
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 