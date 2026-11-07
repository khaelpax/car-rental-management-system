import { useState, useEffect, useCallback } from 'react';
import { getCars } from '../services/carService';
import type { Car } from '../types';

export interface UseCarsReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCars = (): UseCarsReturn => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCars();
      setCars(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  return { cars, loading, error, refetch: fetchCars };
};
