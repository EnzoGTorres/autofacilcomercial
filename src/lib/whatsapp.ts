import { WHATSAPP_NUMBER } from "@/lib/config";

interface VehicleInfo {
  brand: string;
  model: string;
  year: number;
  price: number;
}

export function getWhatsAppUrl({ brand, model, year, price }: VehicleInfo): string {
  const formattedPrice = price.toLocaleString("es-AR");
  const message = encodeURIComponent(
    `Hola, vi este auto en Auto Fácil MZA:\n🚗 ${brand} ${model} ${year}\n💰 $ ${formattedPrice}\nQuisiera más información. Gracias.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}
