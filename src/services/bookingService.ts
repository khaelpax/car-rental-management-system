import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Booking, BookingInput, BookingStatus } from '../types';

/**
 * Creates a new booking in the "bookings" collection.
 * Prevents double booking if the same car already has a "pending" or "confirmed"
 * reservation overlapping with the requested date range.
 */
export const createBooking = async (
  bookingData: BookingInput
): Promise<string> => {
  const bookingsRef = collection(db, 'bookings');

  // Double-booking check: fetch all existing bookings for this car
  const overlapQuery = query(
    bookingsRef,
    where('carId', '==', bookingData.carId)
  );
  const snapshot = await getDocs(overlapQuery);

  const overlappingBooking = snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status as BookingStatus,
      };
    })
    .find((b) => {
      // Only active (pending or confirmed) bookings block dates
      if (b.status !== 'pending' && b.status !== 'confirmed') {
        return false;
      }
      // Check interval overlap: [A_start, A_end] and [B_start, B_end] overlap if A_start <= B_end && A_end >= B_start
      return (
        bookingData.startDate <= b.endDate && bookingData.endDate >= b.startDate
      );
    });

  if (overlappingBooking) {
    throw new Error(
      `This vehicle is already booked from ${overlappingBooking.startDate} to ${overlappingBooking.endDate}. Please choose different dates.`
    );
  }

  // Insert the booking
  const docRef = await addDoc(bookingsRef, {
    userId: bookingData.userId,
    userName: bookingData.userName.trim(),
    carId: bookingData.carId,
    carName: bookingData.carName.trim(),
    startDate: bookingData.startDate,
    endDate: bookingData.endDate,
    totalDays: Number(bookingData.totalDays),
    totalPrice: Number(bookingData.totalPrice),
    status: bookingData.status || 'pending',
    createdAt: new Date().toISOString(),
  });

  return docRef.id;
};

/**
 * Retrieves all bookings belonging to a specific customer userId.
 */
export const getBookingsByUser = async (
  userId: string
): Promise<Booking[]> => {
  const bookingsRef = collection(db, 'bookings');
  const userQuery = query(bookingsRef, where('userId', '==', userId));
  const snapshot = await getDocs(userQuery);

  const bookings: Booking[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    bookings.push({
      id: docSnap.id,
      userId: data.userId ?? '',
      userName: data.userName ?? '',
      carId: data.carId ?? '',
      carName: data.carName ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      totalDays: Number(data.totalDays) || 0,
      totalPrice: Number(data.totalPrice) || 0,
      status: (data.status as BookingStatus) || 'pending',
      createdAt:
        typeof data.createdAt === 'string'
          ? data.createdAt
          : data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  });

  return bookings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Retrieves all bookings across all users (for administrators).
 */
export const getAllBookings = async (): Promise<Booking[]> => {
  const bookingsRef = collection(db, 'bookings');
  const snapshot = await getDocs(bookingsRef);

  const bookings: Booking[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    bookings.push({
      id: docSnap.id,
      userId: data.userId ?? '',
      userName: data.userName ?? '',
      carId: data.carId ?? '',
      carName: data.carName ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      totalDays: Number(data.totalDays) || 0,
      totalPrice: Number(data.totalPrice) || 0,
      status: (data.status as BookingStatus) || 'pending',
      createdAt:
        typeof data.createdAt === 'string'
          ? data.createdAt
          : data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  });

  return bookings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Retrieves a single booking by ID.
 */
export const getBookingById = async (id: string): Promise<Booking | null> => {
  const docRef = doc(db, 'bookings', id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId ?? '',
    userName: data.userName ?? '',
    carId: data.carId ?? '',
    carName: data.carName ?? '',
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    totalDays: Number(data.totalDays) || 0,
    totalPrice: Number(data.totalPrice) || 0,
    status: (data.status as BookingStatus) || 'pending',
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Updates the status of an existing booking.
 */
export const updateBookingStatus = async (
  id: string,
  status: BookingStatus
): Promise<void> => {
  const docRef = doc(db, 'bookings', id);
  await updateDoc(docRef, { status });
};

/**
 * Cancels a booking by setting its status to "cancelled".
 */
export const cancelBooking = async (id: string): Promise<void> => {
  await updateBookingStatus(id, 'cancelled');
};

export const bookingService = {
  createBooking,
  getBookingsByUser,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
};

export default bookingService;
