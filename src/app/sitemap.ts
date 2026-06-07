import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/lib/config";

interface VehicleSlugRow {
  slug: string | null;
  updated_at: string | null;
}

async function getVehicleSlugs(): Promise<VehicleSlugRow[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("slug, updated_at")
    .eq("is_available", true);

  if (error) {
    console.error("Error fetching vehicle slugs for sitemap:", error.message);
    return [];
  }

  return data ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await getVehicleSlugs();

  const vehicleEntries: MetadataRoute.Sitemap = vehicles
    .filter((vehicle): vehicle is VehicleSlugRow & { slug: string } => Boolean(vehicle.slug))
    .map((vehicle) => ({
      url: `${SITE_URL}/catalogo/${vehicle.slug}`,
      lastModified: vehicle.updated_at ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...vehicleEntries,
  ];
}
