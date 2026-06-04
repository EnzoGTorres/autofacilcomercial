import Link from "next/link";
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

export default async function HomePage() {
  const vehicles = await getVehiclesDestacados();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            Tu próximo auto<br />está a un clic de distancia
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
            Explorá nuestro catálogo de vehículos seleccionados. Financiación disponible. Entrega inmediata.
          </p>
          <Link
            href="/catalogo"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-full shadow-lg hover:bg-blue-50 transition-colors text-base"
          >
            Ver catálogo completo →
          </Link>
        </div>
      </section>

      {/* Autos destacados */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900">Autos destacados</h2>
          <Link href="/catalogo" className="text-sm font-semibold text-blue-600 hover:underline">
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
