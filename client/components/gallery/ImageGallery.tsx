'use client'

import { useState } from 'react';

import ImageModal from './ImageModal';
import MainImage from './MainImage';
import ThumbnailList from './ThumbnailList';

interface ImageGalleryProps {
  images: string[];
  productName?: string;
  className?: string;
}

export default function ImageGallery({ 
  images, 
  productName = 'Product Image',
  className = '' 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter out invalid images and provide fallback
  const validImages = images.filter(img => img && img.trim() !== '');
  const galleryImages = validImages.length > 0 ? validImages : ['/placeholder.svg'];

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleMainImageClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalImageChange = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image */}
      <MainImage
        src={galleryImages[currentIndex]}
        alt={`${productName} - Main Image`}
        onImageClick={handleMainImageClick}
      />

      {/* Thumbnail List */}
      <ThumbnailList
        images={galleryImages}
        currentIndex={currentIndex}
        onThumbnailClick={handleThumbnailClick}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        images={galleryImages}
        currentIndex={currentIndex}
        onImageChange={handleModalImageChange}
        productName={productName}
      />
    </div>
  );
} 