'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

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

interface MobileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onImageChange: (index: number) => void;
  productName?: string;
}

export default function MobileImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onImageChange,
  productName = 'Product Image'
}: MobileImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        document.body.style.left = '';
      };
    }
  }, [isOpen]);

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

  // Keyboard navigation
  useEffect(() => {
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
  }, [isOpen, goToPrevious, goToNext, onClose]);

  // Touch/Mouse drag for panning when zoomed
  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (!images || images.length === 0 || !isOpen || !mounted) return null;

  const ModalContent = () => (
    <div 
      className="fixed inset-0 bg-black z-[9999] flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        zIndex: 9999,
        backgroundColor: '#000'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs p-1 z-50">
          Mobile Full Screen: {typeof window !== 'undefined' ? window.innerWidth : 'SSR'}px
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-2 left-0 right-0 z-20 flex justify-between items-center px-2">
        {/* Image counter */}
        <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            className="bg-black/70 hover:bg-black/80 text-white border-none h-8 w-8"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={zoom >= 3}
            className="bg-black/70 hover:bg-black/80 text-white border-none h-8 w-8"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetView}
            className="bg-black/70 hover:bg-black/80 text-white border-none h-8 w-8"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-black/70 hover:bg-black/80 text-white border-none h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main image display */}
      <div 
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: zoom > 1 ? 'none' : 'auto'
        }}
      >
        <div 
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
        >
          <div className="relative w-[95vw] h-[60vh] max-w-none">
            <Image
              src={images[currentIndex] || '/placeholder.svg'}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="95vw"
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
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-none h-10 w-10 z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white border-none h-10 w-10 z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Bottom thumbnail navigation */}
      {images.length > 1 && (
        <div className="bg-black/90 p-2 border-t border-white/10">
          <div className="flex justify-center">
            <div 
              className="flex gap-1 overflow-x-auto max-w-full scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => onImageChange(index)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
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
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(<ModalContent />, document.body);
} 