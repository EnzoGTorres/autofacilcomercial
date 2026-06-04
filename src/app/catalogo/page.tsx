import { Metadata } from "next";
import VehicleCard from "@/components/VehicleCard";
import { supabase } from "@/lib/supabaseClient";
import { Vehicle } from "@/types/vehicle";

export const metadata: Metadata = {
  title: "Catálogo — Auto Fácil MZA",
  description: "Explorá todos los vehículos disponibles en Auto Fácil MZA.",
};

async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_available", true)
    .order("id", { ascending: false });

  if (error) {
    console.error("Error fetching vehicles:", error.message);
    return [];
  }

  return data;
}

export default async function CatalogoPage() {
  const vehicles = await getVehicles();

  return (
    <>
      {/* Header de sección */}
      <section style={{ backgroundColor: "#1565C0" }} className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-blue-300 text-sm font-medium mb-1">Auto Fácil MZA</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Catálogo de autos</h1>
          <p className="text-blue-200 mt-2 text-sm">
            {vehicles.length === 0
              ? "No hay vehículos disponibles por el momento."
              : `${vehicles.length === 1 ? "1 vehículo disponible" : `${vehicles.length} vehículos disponibles`} · Precios en pesos`}
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {vehicles.length === 0 ? (
          <p className="text-gray-400 text-center py-20">Volvé pronto, estamos actualizando el catálogo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
