import { Metadata } from "next";
import VehicleCard from "@/components/VehicleCard";
import { supabase } from "@/lib/supabaseClient";
import { Vehicle } from "@/types/vehicle";

export const metadata: Metadata = {
  title: "Catálogo — AutoFácil",
  description: "Explorá todos los vehículos disponibles en AutoFácil.",
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Catálogo de autos</h1>
        <p className="text-gray-500 mt-2">
          {vehicles.length === 1 ? "1 vehículo disponible" : `${vehicles.length} vehículos disponibles`}
        </p>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No hay vehículos disponibles por el momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
