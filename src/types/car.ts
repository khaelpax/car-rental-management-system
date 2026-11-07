export type TransmissionType = 'manual' | 'automatic';

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  seats: number;
  transmission: TransmissionType;
  fuelType: FuelType;
  category: string;
  imageUrl: string;
  description: string;
  available: boolean;
  createdAt: string;
}

export type CarInput = Omit<Car, 'id' | 'createdAt'>;
