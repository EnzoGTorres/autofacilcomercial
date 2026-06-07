"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Vehicle } from "@/types/vehicle";
import { getWhatsAppUrl } from "@/lib/whatsapp";

interface VehicleCardProps {
  vehicle: Vehicle;
}

const SWIPE_THRESHOLD = 40; // px mínimos para considerar un swipe

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L.057 23.5l5.797-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.006-1.376l-.36-.213-3.714.933.983-3.618-.234-.372A9.78 9.78 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { brand, model, year, price, mileage, images, is_available, slug } = vehicle;

  const galleryImages = Array.isArray(images) ? images.filter(Boolean) : images ? [images] : [];
  const hasMultipleImages = galleryImages.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const imageUrl = galleryImages[currentIndex] ?? "";
  const whatsappUrl = getWhatsAppUrl({ brand, model, year, price });

  // ─── Navegación con flechas ─────────────────────────────────────────────
  const goToPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  // ─── Swipe táctil ───────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!hasMultipleImages || touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 10) isSwiping.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultipleImages || touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      // Evita que el "tap" navegue al detalle cuando en realidad fue un swipe
      e.preventDefault();
      if (delta < 0) {
        setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
      } else {
        setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
      }
    }

    touchStartX.current = null;
    isSwiping.current = false;
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">

      {/* Imagen */}
      <Link
        href={`/catalogo/${slug ?? ""}`}
        className="group block relative h-52 bg-gray-100 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={imageUrl}
          alt={`${brand} ${model}`}
          fill
          className="object-cover hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Badge disponibilidad */}
        <span
          className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${
            is_available
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {is_available ? "Disponible" : "Vendido"}
        </span>

        {/* Flechas de navegación (solo si hay más de una imagen) */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRightIcon />
            </button>

            {/* Indicador de posición */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {galleryImages.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </Link>

      {/* Info */}
      <Link href={`/catalogo/${slug ?? ""}`} className="block px-5 pt-4 pb-2 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#1565C0" }}>
          {brand}
        </p>
        <h3 className="text-xl font-extrabold text-[#121212] mt-0.5">
          {model}{" "}
          <span className="text-base font-normal text-gray-400">{year}</span>
        </h3>

        {mileage !== null && mileage > 0 && (
          <p className="text-xs text-gray-400 mt-1">{mileage.toLocaleString("es-AR")} km</p>
        )}

        {/* Precio */}
        <p className="mt-3 text-2xl font-extrabold" style={{ color: "#F57C00" }}>
          $ {price.toLocaleString("es-AR")}
        </p>
      </Link>

      {/* Botón WhatsApp */}
      <div className="px-5 pb-5 pt-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-3 rounded-xl transition-colors"
        >
          <WhatsAppIcon />
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
