export interface CarSummary {
  id: string;
  brand: string;
  model: string;
  category: string;
  seats: number;
  transmission: string;
  fuelType: string;
  pricePerDay: number;
  available: boolean;
}

export interface Recommendation {
  carId: string;
  reason: string;
}

export interface RecommendResponse {
  recommendations: Recommendation[];
  summary: string;
}
