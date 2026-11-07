export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  carId: string;
  carName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  totalPrice: number; // IDR
  status: BookingStatus;
  createdAt: string;
}

export type BookingInput = Omit<Booking, 'id' | 'createdAt'>;
