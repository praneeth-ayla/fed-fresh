"use client";

import { useState } from "react";
import Image from "next/image";
import { Image as ImageType } from "@prisma/client";

export default function ImagesCarousel({ images }: { images: ImageType[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md text-gray-500">
        No images available
      </div>
    );
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden group">
      {/* Image display */}
      <Image
        src={images[currentIndex].url}
        alt={images[currentIndex].metadata || `Image ${currentIndex + 1}`}
        fill
        unoptimized
        className="object-cover transition-transform duration-500"
        sizes="(max-width: 768px) 100vw, 33vw"
        priority={currentIndex === 0}
      />

      {/* Left/Right navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
          >
            ◀
          </button>
          <button
            onClick={nextImage}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
          >
            ▶
          </button>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition ${
                i === currentIndex ? "bg-white" : "bg-gray-400/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
