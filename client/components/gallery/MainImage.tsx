'use client'

import Image from 'next/image';

interface MainImageProps {
  src: string;
  alt: string;
  onImageClick: () => void;
  className?: string;
}

export default function MainImage({ 
  src, 
  alt, 
  onImageClick, 
  className = '' 
}: MainImageProps) {
  return (
    <div 
      className={`relative aspect-square w-full overflow-hidden rounded-lg bg-white border border-gray-200 cursor-pointer group transition-all duration-300 hover:border-gray-400 hover:shadow-lg ${className}`}
      onClick={onImageClick}
    >
      <Image
        src={src || '/placeholder.svg'}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
      />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
          Bấm để phóng to
        </div>
      </div>
    </div>
  );
} 