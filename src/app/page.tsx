import Link from "next/link";
import Image from "next/image";
import VehicleCard from "@/components/VehicleCard";
import { supabase } from "@/lib/supabaseClient";
import { Vehicle } from "@/types/vehicle";

async function getVehiclesDestacados(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_available", true)
    .limit(3);

  if (error) {
    console.error("Error fetching vehicles:", error.message);
    return [];
  }

  return data;
}

const pillars = [
  {
    icon: "✓",
    titulo: "Sin letra chica",
    desc: "Todo claro desde el primer momento. Precios reales, sin sorpresas.",
  },
  {
    icon: "$",
    titulo: "Financiación real",
    desc: "Cuotas accesibles para cada bolsillo. Te asesoramos sin presión.",
  },
  {
    icon: "→",
    titulo: "Entrega inmediata",
    desc: "Lo elegís hoy, lo tenés hoy. Sin esperas ni burocracia.",
  },
];

export default async function HomePage() {
  const vehicles = await getVehiclesDestacados();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "520px" }}>
        {/* Imagen de fondo */}
        <Image
          src="/hero.jpg"
          alt="Auto Fácil MZA showroom"
          fill
          className="object-cover object-center"
          priority
        />

        {/* Overlay: gradiente azul oscuro más denso a la izquierda/centro para leer el texto */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(13,40,100,0.92) 0%, rgba(13,40,100,0.80) 50%, rgba(13,40,100,0.50) 100%)",
          }}
        />

        {/* Contenido */}
        <div className="relative z-10 flex items-center" style={{ minHeight: "520px" }}>
          <div className="max-w-6xl mx-auto px-4 py-20 w-full">
            <div className="max-w-xl">
              <span
                className="inline-block text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
                style={{ backgroundColor: "#F57C00" }}
              >
                Mendoza · Sin vueltas · Sin letra chica
              </span>

              <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-5 drop-shadow-lg">
                Tu auto, fácil.
              </h1>

              <p className="text-blue-100 text-lg sm:text-xl mb-10 leading-relaxed">
                Encontrá el vehículo que necesitás con financiación clara y entrega inmediata.{" "}
                <span className="font-semibold text-white">Te lo hacemos fácil.</span>
              </p>

              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 text-white font-bold px-10 py-4 rounded-full shadow-xl transition-colors text-base bg-[#F57C00] hover:bg-[#E65100]"
              >
                Ver autos disponibles
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {pillars.map(({ icon, titulo, desc }) => (
            <div key={titulo} className="flex items-start gap-4 px-8 py-8 sm:py-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-extrabold text-sm"
                style={{ backgroundColor: "#1565C0" }}
              >
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-[#121212] mb-1">{titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Autos disponibles */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[#121212]">Autos disponibles</h2>
            <p className="text-gray-400 text-sm mt-0.5">Los mejores de esta semana</p>
          </div>
          <Link
            href="/catalogo"
            className="text-sm font-semibold transition-colors hover:underline"
            style={{ color: "#F57C00" }}
          >
            Ver todos →
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No hay vehículos disponibles por el momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
