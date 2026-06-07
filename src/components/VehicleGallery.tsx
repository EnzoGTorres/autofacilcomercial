"use client";

import { useState } from "react";
import Image from "next/image";

interface VehicleGalleryProps {
  images: string[];
  alt: string;
}

export default function VehicleGallery({ images, alt }: VehicleGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const gallery = images.length > 0 ? images : [""];
  const mainImage = gallery[selectedIndex] ?? gallery[0];

  return (
    <div>
      {/* Imagen principal */}
      <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-gray-100 shadow-md">
        <Image
          src={mainImage}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {/* Miniaturas */}
      {gallery.length > 1 && (
        <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-3">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${alt}`}
              aria-current={index === selectedIndex}
              className={`relative h-16 sm:h-20 w-full rounded-lg overflow-hidden bg-gray-100 shadow-sm transition-all ${
                index === selectedIndex
                  ? "ring-2 ring-blue-600 opacity-100"
                  : "ring-1 ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={image}
                alt={`${alt} — miniatura ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 25vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
