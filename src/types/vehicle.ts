export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuel_type: string | null;
  description: string | null;
  images: string[] | null;
  is_available: boolean;
  created_at: string;
  slug: string | null;
  mileage: number | null;
  updated_at: string | null;
}
