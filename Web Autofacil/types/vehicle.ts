export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  images: string[] | string;
  is_available: boolean;
}
