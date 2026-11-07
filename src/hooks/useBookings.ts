import { useState, useEffect, useCallback } from 'react';
import { getBookingsByUser, getAllBookings } from '../services/bookingService';
import type { Booking } from '../types';

export interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useBookings = (userId?: string): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    // If an explicit empty string is passed, do not fetch
    if (userId === '') {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = userId
        ? await getBookingsByUser(userId)
        : await getAllBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch bookings'
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, error, refetch: fetchBookings };
};
