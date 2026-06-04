import Image from "next/image";
import Link from "next/link";
import { Vehicle } from "@/types/vehicle";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { id, brand, model, year, price, images, is_available } = vehicle;

  // images puede ser un array o una URL directa
  const imageUrl = Array.isArray(images) ? images[0] : images;

  return (
    <Link href={`/catalogo/${id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {/* Imagen */}
        <div className="relative h-52 w-full bg-gray-100">
          <Image
            src={imageUrl}
            alt={`${brand} ${model}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badge estado */}
          <span
            className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${
              is_available
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {is_available ? "Disponible" : "Vendido"}
          </span>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{brand}</p>
          <h3 className="text-lg font-bold text-gray-900 mt-0.5">
            {model} <span className="text-gray-500 font-normal">{year}</span>
          </h3>
          <p className="mt-3 text-2xl font-extrabold text-blue-600">
            USD {price.toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    </Link>
  );
}
