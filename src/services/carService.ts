import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Car, CarInput } from '../types';

export const SAMPLE_CARS: CarInput[] = [
  {
    brand: 'Toyota',
    model: 'Avanza 1.5 G',
    year: 2023,
    pricePerDay: 400000,
    seats: 7,
    transmission: 'manual',
    fuelType: 'petrol',
    category: 'MPV',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    description: 'The favorite Indonesian family MPV. Highly reliable, spacious, and fuel-efficient for both city trips and out-of-town adventures.',
    available: true,
  },
  {
    brand: 'Honda',
    model: 'Brio RS',
    year: 2024,
    pricePerDay: 350000,
    seats: 5,
    transmission: 'automatic',
    fuelType: 'petrol',
    category: 'city car',
    imageUrl: 'https://images.unsplash.com/photo-1590362891988-f778047831d6?auto=format&fit=crop&w=800&q=80',
    description: 'Sporty, compact, and nimble city car. Ideal for navigating urban traffic, daily commuting, and parking in tight spots.',
    available: true,
  },
  {
    brand: 'Mitsubishi',
    model: 'Pajero Sport Dakar',
    year: 2023,
    pricePerDay: 1100000,
    seats: 7,
    transmission: 'automatic',
    fuelType: 'diesel',
    category: 'SUV',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    description: 'Rugged yet prestigious 7-seater SUV. Powered by a potent turbo diesel engine with high clearance for all-terrain capability.',
    available: true,
  },
  {
    brand: 'Toyota',
    model: 'Innova Zenix 2.0 V',
    year: 2024,
    pricePerDay: 750000,
    seats: 7,
    transmission: 'automatic',
    fuelType: 'hybrid',
    category: 'MPV',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    description: 'Next-generation hybrid MPV offering whisper-quiet rides, exceptional fuel economy, captain seats, and advanced driver assistance.',
    available: true,
  },
  {
    brand: 'Hyundai',
    model: 'Ioniq 5 Signature',
    year: 2023,
    pricePerDay: 1250000,
    seats: 5,
    transmission: 'automatic',
    fuelType: 'electric',
    category: 'SUV',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    description: 'Iconic all-electric crossover featuring ultra-fast charging, sustainable materials, expansive legroom, and futuristic aesthetic.',
    available: true,
  },
  {
    brand: 'Daihatsu',
    model: 'Rocky 1.2 X',
    year: 2022,
    pricePerDay: 420000,
    seats: 5,
    transmission: 'manual',
    fuelType: 'petrol',
    category: 'SUV',
    imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
    description: 'Agile 5-seater compact SUV with great ground clearance, responsive handling, and generous trunk capacity for active lifestyles.',
    available: true,
  },
  {
    brand: 'Suzuki',
    model: 'Ertiga Hybrid GX',
    year: 2023,
    pricePerDay: 450000,
    seats: 7,
    transmission: 'manual',
    fuelType: 'hybrid',
    category: 'MPV',
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    description: 'Smart Hybrid MPV combining comfort, low emissions, and economical running costs. Perfect for long family journeys.',
    available: true,
  },
  {
    brand: 'Honda',
    model: 'HR-V 1.5 SE',
    year: 2024,
    pricePerDay: 650000,
    seats: 5,
    transmission: 'automatic',
    fuelType: 'petrol',
    category: 'SUV',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    description: 'Coupe-style urban SUV with refined interior ergonomics, leather-wrapped cabin, Honda Sensing suite, and panoramic glass roof.',
    available: true,
  },
];

/**
 * Retrieves all cars from the "cars" collection in Firestore.
 */
export const getCars = async (): Promise<Car[]> => {
  const carsCollection = collection(db, 'cars');
  const snapshot = await getDocs(carsCollection);

  const cars: Car[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    cars.push({
      id: docSnap.id,
      brand: data.brand ?? '',
      model: data.model ?? '',
      year: Number(data.year) || new Date().getFullYear(),
      pricePerDay: Number(data.pricePerDay) || 0,
      seats: Number(data.seats) || 5,
      transmission: data.transmission === 'manual' ? 'manual' : 'automatic',
      fuelType: data.fuelType || 'petrol',
      category: data.category || 'city car',
      imageUrl: data.imageUrl || '',
      description: data.description || '',
      available: data.available !== false,
      createdAt:
        typeof data.createdAt === 'string'
          ? data.createdAt
          : data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  });

  return cars.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Retrieves a single car by its document ID.
 */
export const getCarById = async (id: string): Promise<Car | null> => {
  const docRef = doc(db, 'cars', id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();
  return {
    id: snap.id,
    brand: data.brand ?? '',
    model: data.model ?? '',
    year: Number(data.year) || new Date().getFullYear(),
    pricePerDay: Number(data.pricePerDay) || 0,
    seats: Number(data.seats) || 5,
    transmission: data.transmission === 'manual' ? 'manual' : 'automatic',
    fuelType: data.fuelType || 'petrol',
    category: data.category || 'city car',
    imageUrl: data.imageUrl || '',
    description: data.description || '',
    available: data.available !== false,
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Adds a new car document to the "cars" collection.
 */
export const addCar = async (carData: CarInput): Promise<string> => {
  const carsCollection = collection(db, 'cars');
  const docRef = await addDoc(carsCollection, {
    brand: carData.brand.trim(),
    model: carData.model.trim(),
    year: Number(carData.year),
    pricePerDay: Number(carData.pricePerDay),
    seats: Number(carData.seats),
    transmission: carData.transmission,
    fuelType: carData.fuelType,
    category: carData.category.trim(),
    imageUrl: carData.imageUrl.trim(),
    description: carData.description.trim(),
    available: Boolean(carData.available),
    createdAt: new Date().toISOString(),
  });

  return docRef.id;
};

/**
 * Updates an existing car document.
 */
export const updateCar = async (
  id: string,
  updates: Partial<CarInput>
): Promise<void> => {
  const docRef = doc(db, 'cars', id);
  const cleaned: Partial<CarInput> = {};

  if (updates.brand !== undefined) cleaned.brand = updates.brand.trim();
  if (updates.model !== undefined) cleaned.model = updates.model.trim();
  if (updates.year !== undefined) cleaned.year = Number(updates.year);
  if (updates.pricePerDay !== undefined) cleaned.pricePerDay = Number(updates.pricePerDay);
  if (updates.seats !== undefined) cleaned.seats = Number(updates.seats);
  if (updates.transmission !== undefined) cleaned.transmission = updates.transmission;
  if (updates.fuelType !== undefined) cleaned.fuelType = updates.fuelType;
  if (updates.category !== undefined) cleaned.category = updates.category.trim();
  if (updates.imageUrl !== undefined) cleaned.imageUrl = updates.imageUrl.trim();
  if (updates.description !== undefined) cleaned.description = updates.description.trim();
  if (updates.available !== undefined) cleaned.available = Boolean(updates.available);

  await updateDoc(docRef, cleaned as Record<string, any>);
};

/**
 * Deletes a car document by ID.
 */
export const deleteCar = async (id: string): Promise<void> => {
  const docRef = doc(db, 'cars', id);
  await deleteDoc(docRef);
};

/**
 * Inserts 8 sample cars into the "cars" collection only when the collection is empty.
 */
export const insertSampleCars = async (): Promise<number> => {
  const existingCars = await getCars();
  if (existingCars.length > 0) {
    throw new Error('Sample data can only be inserted when the car collection is empty.');
  }

  for (const sample of SAMPLE_CARS) {
    await addCar(sample);
  }

  return SAMPLE_CARS.length;
};

export const carService = {
  getCars,
  getCarById,
  addCar,
  updateCar,
  deleteCar,
  insertSampleCars,
};

export default carService;
