import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { Vehicle } from "@/types/vehicle";

// En Next.js 15+, params es una Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  if (!vehicle) return { title: "Auto no encontrado" };
  return { title: `${vehicle.brand} ${vehicle.model} ${vehicle.year} — AutoFácil` };
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L.057 23.5l5.797-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.006-1.376l-.36-.213-3.714.933.983-3.618-.234-.372A9.78 9.78 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}

export default async function AutoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) notFound();

  const { brand, model, year, price, mileage, description, images, is_available } = vehicle;
  const imageUrl = Array.isArray(images) ? images[0] : images;

  const whatsappURL = getWhatsAppUrl({ brand, model, year, price });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/catalogo" className="hover:text-blue-600 transition-colors">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600 font-medium">{brand} {model}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Imagen */}
        <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-gray-100 shadow-md">
          <Image
            src={imageUrl}
            alt={`${brand} ${model}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Detalle */}
        <div>
          <span
            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
              is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}
          >
            {is_available ? "Disponible" : "Vendido"}
          </span>

          <p className="text-sm text-gray-400 uppercase tracking-wide font-medium">{brand}</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
            {model} <span className="text-gray-500 font-semibold">{year}</span>
          </h1>

          <p className="text-4xl font-extrabold text-blue-600 mt-4">
            $ {price.toLocaleString("es-AR")}
          </p>

          {mileage > 0 && (
            <p className="text-sm text-gray-500 mt-1">{mileage.toLocaleString("es-AR")} km</p>
          )}

          <p className="text-gray-600 mt-5 leading-relaxed">{description}</p>

          {is_available && (
            <a
              href={whatsappURL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-md text-base w-full sm:w-auto"
            >
              <WhatsAppIcon />
              Consultar por WhatsApp
            </a>
          )}

          <Link
            href="/catalogo"
            className="mt-4 block text-sm text-center text-gray-400 hover:text-blue-600 transition-colors"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
