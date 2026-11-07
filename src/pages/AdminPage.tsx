import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks';
import {
  getCars,
  addCar,
  updateCar,
  deleteCar,
  insertSampleCars,
} from '../services/carService';
import {
  getAllBookings,
  updateBookingStatus,
} from '../services/bookingService';
import { LoadingSpinner } from '../components';
import type {
  Car,
  CarInput,
  TransmissionType,
  FuelType,
  Booking,
  BookingStatus,
} from '../types';
import { formatIDR } from '../utils/formatters';

interface CarFormState {
  brand: string;
  model: string;
  year: string;
  pricePerDay: string;
  seats: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  category: string;
  imageUrl: string;
  description: string;
  available: boolean;
}

const INITIAL_FORM_STATE: CarFormState = {
  brand: '',
  model: '',
  year: new Date().getFullYear().toString(),
  pricePerDay: '',
  seats: '5',
  transmission: 'automatic',
  fuelType: 'petrol',
  category: 'city car',
  imageUrl: '',
  description: '',
  available: true,
};

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings'>('fleet');

  // Cars Fleet State
  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsError, setCarsError] = useState<string | null>(null);

  // Bookings State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // Notifications
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal State for Add / Edit Car
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState<CarFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Delete Car Confirmation
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sample data loading state
  const [isAddingSample, setIsAddingSample] = useState(false);

  // Fetch Cars Fleet
  const fetchFleet = useCallback(async () => {
    setCarsLoading(true);
    try {
      const data = await getCars();
      setCars(data);
      setCarsError(null);
    } catch (err) {
      console.error('Failed to fetch cars:', err);
      setCarsError('Failed to load vehicle list from Firestore.');
    } finally {
      setCarsLoading(false);
    }
  }, []);

  // Fetch All Bookings
  const fetchBookingsList = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await getAllBookings();
      setBookings(data);
      setBookingsError(null);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setBookingsError('Failed to load reservations list from Firestore.');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchFleet();
      fetchBookingsList();
    }
  }, [isAdmin, fetchFleet, fetchBookingsList]);

  // Car Form actions
  const handleOpenAdd = () => {
    setEditingCar(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (car: Car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year.toString(),
      pricePerDay: car.pricePerDay.toString(),
      seats: car.seats.toString(),
      transmission: car.transmission,
      fuelType: car.fuelType,
      category: car.category,
      imageUrl: car.imageUrl,
      description: car.description,
      available: car.available,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCar(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const brand = formData.brand.trim();
    const model = formData.model.trim();
    const yearNum = parseInt(formData.year, 10);
    const priceNum = parseFloat(formData.pricePerDay);
    const seatsNum = parseInt(formData.seats, 10);
    const category = formData.category.trim();
    const imageUrl = formData.imageUrl.trim();
    const description = formData.description.trim();

    if (!brand) {
      setFormError('Vehicle Brand is required.');
      return;
    }
    if (!model) {
      setFormError('Vehicle Model is required.');
      return;
    }
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 2) {
      setFormError(`Please enter a valid production year (1990 - ${new Date().getFullYear() + 2}).`);
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Price per day must be a valid positive number in IDR.');
      return;
    }
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 30) {
      setFormError('Seats must be a positive number between 1 and 30.');
      return;
    }
    if (!category) {
      setFormError('Vehicle category is required (e.g. city car, SUV, MPV).');
      return;
    }
    if (!imageUrl) {
      setFormError('Image URL is required.');
      return;
    }
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      setFormError('Image URL must start with http:// or https://');
      return;
    }
    if (!description) {
      setFormError('Please provide a brief vehicle description.');
      return;
    }

    const payload: CarInput = {
      brand,
      model,
      year: yearNum,
      pricePerDay: priceNum,
      seats: seatsNum,
      transmission: formData.transmission,
      fuelType: formData.fuelType,
      category,
      imageUrl,
      description,
      available: formData.available,
    };

    setIsSubmitting(true);
    try {
      if (editingCar) {
        await updateCar(editingCar.id, payload);
        setNotice({
          type: 'success',
          message: `Successfully updated vehicle "${brand} ${model}".`,
        });
      } else {
        await addCar(payload);
        setNotice({
          type: 'success',
          message: `Successfully added new vehicle "${brand} ${model}".`,
        });
      }
      handleCloseForm();
      await fetchFleet();
    } catch (err) {
      console.error('Failed to save car:', err);
      setFormError(
        err instanceof Error ? err.message : 'An error occurred while saving the vehicle.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (car: Car) => {
    setCarToDelete(car);
  };

  const handleConfirmDelete = async () => {
    if (!carToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCar(carToDelete.id);
      setNotice({
        type: 'success',
        message: `Vehicle "${carToDelete.brand} ${carToDelete.model}" was deleted.`,
      });
      setCarToDelete(null);
      await fetchFleet();
    } catch (err) {
      console.error('Failed to delete car:', err);
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete vehicle.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSampleData = async () => {
    if (cars.length > 0) {
      setNotice({
        type: 'error',
        message: 'Sample data can only be inserted when the collection is empty.',
      });
      return;
    }

    setIsAddingSample(true);
    try {
      const insertedCount = await insertSampleCars();
      setNotice({
        type: 'success',
        message: `Successfully inserted ${insertedCount} sample vehicles into Firestore.`,
      });
      await fetchFleet();
    } catch (err) {
      console.error('Failed to insert sample cars:', err);
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to insert sample cars.',
      });
    } finally {
      setIsAddingSample(false);
    }
  };

  // Booking status update handler
  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    carName: string
  ) => {
    setUpdatingBookingId(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      setNotice({
        type: 'success',
        message: `Booking for ${carName} updated to "${newStatus.toUpperCase()}".`,
      });
      await fetchBookingsList();
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update booking status.',
      });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Filtered Bookings computation
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus =
        bookingFilter === 'all' || b.status === bookingFilter;

      const term = bookingSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        b.userName.toLowerCase().includes(term) ||
        b.carName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingFilter, bookingSearch]);

  // Dashboard Stats Calculations
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const revenueTotal = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  if (!isAdmin) {
    return (
      <section className="page-container">
        <div className="auth-error-alert" role="alert">
          <span>⚠️ Access Denied: This page is restricted to administrators only.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container admin-dashboard">
      <header className="page-header admin-header">
        <div>
          <h1 className="page-title">Admin Management Portal</h1>
          <p className="page-subtitle">
            Logged in as <strong>{user?.name || user?.email}</strong> (Admin). Oversee fleet records and handle customer bookings.
          </p>
        </div>

        {activeTab === 'fleet' && (
          <div className="admin-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddSampleData}
              disabled={isAddingSample || carsLoading || cars.length > 0}
              title={
                cars.length > 0
                  ? 'Sample data can only be added when the collection is empty'
                  : 'Insert 8 varied sample vehicles'
              }
            >
              {isAddingSample ? 'Adding Sample Fleet...' : '✨ Add Sample Data'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
            >
              + Add New Car
            </button>
          </div>
        )}
      </header>

      {/* Notifications */}
      {notice && (
        <div
          className={`admin-notice ${
            notice.type === 'success' ? 'admin-notice-success' : 'auth-error-alert'
          }`}
          role="status"
        >
          <span>{notice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{notice.message}</span>
          <button
            type="button"
            className="btn-icon-close"
            onClick={() => setNotice(null)}
            aria-label="Close notice"
          >
            ×
          </button>
        </div>
      )}

      {/* Live Operational Stats */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h4>Fleet Inventory</h4>
          <p className="stat-value">{cars.length}</p>
          <span className="stat-label">Active registered vehicles</span>
        </div>
        <div className="stat-card">
          <h4>Pending Requests</h4>
          <p className="stat-value" style={{ color: pendingCount > 0 ? '#b45309' : 'inherit' }}>
            {pendingCount}
          </p>
          <span className="stat-label">Reservations awaiting confirmation</span>
        </div>
        <div className="stat-card">
          <h4>Confirmed Bookings</h4>
          <p className="stat-value">{confirmedCount}</p>
          <span className="stat-label">Active / confirmed rentals</span>
        </div>
        <div className="stat-card">
          <h4>Active Revenue</h4>
          <p className="stat-value" style={{ fontSize: '1.4rem' }}>
            {formatIDR(revenueTotal)}
          </p>
          <span className="stat-label">Confirmed &amp; completed rentals</span>
        </div>
      </div>

      {/* Admin Tab Switching */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          🚗 Vehicle Fleet ({cars.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Customer Bookings ({bookings.length})
          {pendingCount > 0 && (
            <span className="admin-tab-badge-pending">{pendingCount} pending</span>
          )}
        </button>
      </div>

      {/* TAB 1: FLEET MANAGEMENT */}
      {activeTab === 'fleet' && (
        <div className="admin-table-container">
          <div className="admin-table-toolbar">
            <h3 className="admin-table-title">Fleet Vehicles ({cars.length})</h3>
          </div>

          {carsLoading && <LoadingSpinner message="Loading fleet database..." />}

          {carsError && !carsLoading && (
            <div className="auth-error-alert" role="alert" style={{ margin: '1rem' }}>
              <span>⚠️ {carsError}</span>
              <button
                type="button"
                className="btn btn-secondary btn-outline-sm"
                style={{ marginLeft: 'auto' }}
                onClick={fetchFleet}
              >
                Retry
              </button>
            </div>
          )}

          {!carsLoading && !carsError && cars.length === 0 && (
            <div className="empty-state">
              <h3>No Vehicles in Database</h3>
              <p className="empty-state-hint">
                The "cars" collection is empty. Click <strong>"Add Sample Data"</strong> above to seed 8 vehicles or <strong>"+ Add New Car"</strong> to create one.
              </p>
            </div>
          )}

          {!carsLoading && !carsError && cars.length > 0 && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Year</th>
                    <th>Price / Day</th>
                    <th>Specifications</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => (
                    <tr key={car.id}>
                      <td>
                        <div className="table-vehicle-cell">
                          <img
                            src={car.imageUrl || 'https://placehold.co/100x70?text=Car'}
                            alt={`${car.brand} ${car.model}`}
                            className="table-vehicle-thumb"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/100x70?text=Car';
                            }}
                          />
                          <div>
                            <strong>
                              {car.brand} {car.model}
                            </strong>
                            <div className="table-vehicle-desc-preview">
                              {car.description.substring(0, 45)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-category-tag">{car.category}</span>
                      </td>
                      <td>{car.year}</td>
                      <td>
                        <strong>{formatIDR(car.pricePerDay)}</strong>
                      </td>
                      <td>
                        <div className="table-specs-summary">
                          <span>👥 {car.seats}s</span>
                          <span>⚙️ {car.transmission}</span>
                          <span>⛽ {car.fuelType}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`table-status-pill ${
                            car.available ? 'status-pill-active' : 'status-pill-inactive'
                          }`}
                        >
                          {car.available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn btn-secondary btn-outline-sm"
                            onClick={() => handleOpenEdit(car)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-sm"
                            onClick={() => handleOpenDelete(car)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="admin-table-container">
          <div className="admin-table-toolbar admin-bookings-toolbar">
            <div>
              <h3 className="admin-table-title">Customer Reservations ({bookings.length})</h3>
            </div>

            <div className="admin-bookings-filter-bar">
              <input
                type="text"
                placeholder="Search by customer, car, or ID..."
                className="form-input form-input-sm"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                style={{ maxWidth: '260px' }}
              />

              <select
                className="form-input form-input-sm"
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                style={{ maxWidth: '160px' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-outline-sm"
                onClick={fetchBookingsList}
                disabled={bookingsLoading}
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {bookingsLoading && (
            <LoadingSpinner message="Loading customer reservations..." />
          )}

          {bookingsError && !bookingsLoading && (
            <div className="auth-error-alert" role="alert" style={{ margin: '1rem' }}>
              <span>⚠️ {bookingsError}</span>
              <button
                type="button"
                className="btn btn-secondary btn-outline-sm"
                style={{ marginLeft: 'auto' }}
                onClick={fetchBookingsList}
              >
                Retry
              </button>
            </div>
          )}

          {!bookingsLoading && !bookingsError && bookings.length === 0 && (
            <div className="empty-state">
              <h3>No Bookings Recorded</h3>
              <p className="empty-state-hint">
                There are currently no customer bookings in the Firestore "bookings" collection.
              </p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && bookings.length > 0 && filteredBookings.length === 0 && (
            <div className="empty-state">
              <h3>No Matching Bookings</h3>
              <p className="empty-state-hint">
                No reservations match the selected search keyword or status filter.
              </p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && filteredBookings.length > 0 && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Booking / Customer</th>
                    <th>Vehicle</th>
                    <th>Rental Dates</th>
                    <th>Duration</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.userName}</strong>
                        <div className="table-booking-subtext">
                          ID: #{b.id.substring(0, 8)} | UID: {b.userId.substring(0, 6)}...
                        </div>
                      </td>
                      <td>
                        <strong>{b.carName}</strong>
                      </td>
                      <td>
                        <span className="table-dates-pill">
                          {b.startDate} &rarr; {b.endDate}
                        </span>
                      </td>
                      <td>
                        {b.totalDays} {b.totalDays === 1 ? 'day' : 'days'}
                      </td>
                      <td>
                        <strong>{formatIDR(b.totalPrice)}</strong>
                      </td>
                      <td>
                        <span className={`status-pill status-${b.status}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-group">
                          {/* Admin can Confirm, Complete, or Cancel any booking */}
                          {b.status !== 'confirmed' && b.status !== 'completed' && (
                            <button
                              type="button"
                              className="btn btn-success-sm"
                              onClick={() => handleUpdateStatus(b.id, 'confirmed', b.carName)}
                              disabled={updatingBookingId === b.id}
                              title="Confirm this reservation"
                            >
                              Confirm
                            </button>
                          )}

                          {b.status === 'confirmed' && (
                            <button
                              type="button"
                              className="btn btn-primary-sm"
                              onClick={() => handleUpdateStatus(b.id, 'completed', b.carName)}
                              disabled={updatingBookingId === b.id}
                              title="Mark as completed"
                            >
                              Complete
                            </button>
                          )}

                          {b.status !== 'cancelled' && (
                            <button
                              type="button"
                              className="btn btn-danger-sm"
                              onClick={() => handleUpdateStatus(b.id, 'cancelled', b.carName)}
                              disabled={updatingBookingId === b.id}
                              title="Cancel this reservation"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Car Modal Dialog */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={handleCloseForm}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">
                {editingCar ? `Edit Car: ${editingCar.brand} ${editingCar.model}` : 'Add New Vehicle'}
              </h2>
              <button
                type="button"
                className="btn-icon-close"
                onClick={handleCloseForm}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="auth-error-alert" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
                <span>⚠️ {formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="modal-form" noValidate>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label htmlFor="car-brand">
                    Brand <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-brand"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Toyota, Honda, Mitsubishi"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-model">
                    Model <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-model"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Avanza 1.5 G, Brio RS"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-year">
                    Production Year <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 2}
                    className="form-input"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-category">
                    Category <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-category"
                    type="text"
                    className="form-input"
                    placeholder="e.g. city car, SUV, MPV, sedan"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-price">
                    Price Per Day (IDR) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-price"
                    type="number"
                    min="10000"
                    step="5000"
                    className="form-input"
                    placeholder="e.g. 450000"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-seats">
                    Seats Count <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-seats"
                    type="number"
                    min="1"
                    max="30"
                    className="form-input"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-transmission">
                    Transmission <span className="text-danger">*</span>
                  </label>
                  <select
                    id="car-transmission"
                    className="form-input"
                    value={formData.transmission}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transmission: e.target.value as TransmissionType,
                      })
                    }
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="car-fuel">
                    Fuel Type <span className="text-danger">*</span>
                  </label>
                  <select
                    id="car-fuel"
                    className="form-input"
                    value={formData.fuelType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fuelType: e.target.value as FuelType,
                      })
                    }
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="car-image">
                  Image URL <span className="text-danger">*</span>
                </label>
                <input
                  id="car-image"
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-desc">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="car-desc"
                  rows={3}
                  className="form-input form-textarea"
                  placeholder="Overview of vehicle features, condition, comfort..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group form-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) =>
                      setFormData({ ...formData, available: e.target.checked })
                    }
                  />
                  <span>Mark as Available for Renting</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingCar
                    ? 'Update Vehicle'
                    : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog Modal */}
      {carToDelete && (
        <div className="modal-backdrop" onClick={() => setCarToDelete(null)}>
          <div
            className="modal-card modal-card-sm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="modal-header">
              <h2 id="delete-dialog-title">Confirm Deletion</h2>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setCarToDelete(null)}
                aria-label="Cancel deletion"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to permanently delete vehicle{' '}
                <strong>
                  {carToDelete.brand} {carToDelete.model} ({carToDelete.year})
                </strong>
                ?
              </p>
              <p className="delete-warning-text">
                This action cannot be undone and will remove the car from the customer fleet catalog.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCarToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
