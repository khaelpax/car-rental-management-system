import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getCarById } from '../services/carService';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../hooks';
import { LoadingSpinner } from '../components';
import type { Car } from '../types';
import { formatIDR } from '../utils/formatters';

export const CarDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Today formatted as YYYY-MM-DD
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (!id) {
      setError('Vehicle ID not provided.');
      setLoading(false);
      return;
    }

    const fetchCar = async () => {
      setLoading(true);
      try {
        const data = await getCarById(id);
        if (data) {
          setCar(data);
          setError(null);
        } else {
          setError('Vehicle not found.');
        }
      } catch (err) {
        console.error('Error fetching car details:', err);
        setError('Failed to load car details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  // Live calculation of duration and total price
  const { totalDays, totalPrice, dateError } = useMemo(() => {
    if (!startDate || !endDate) {
      return { totalDays: 0, totalPrice: 0, dateError: null };
    }

    if (startDate < today) {
      return {
        totalDays: 0,
        totalPrice: 0,
        dateError: 'Start date cannot be in the past.',
      };
    }

    if (endDate <= startDate) {
      return {
        totalDays: 0,
        totalPrice: 0,
        dateError: 'End date must be after the start date.',
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const days = diffDays > 0 ? diffDays : 0;
    const price = car ? days * car.pricePerDay : 0;

    return { totalDays: days, totalPrice: price, dateError: null };
  }, [startDate, endDate, today, car]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!user) {
      setBookingError('You must be logged in to book a vehicle.');
      return;
    }

    if (!car) {
      setBookingError('Vehicle details not loaded.');
      return;
    }

    if (!car.available) {
      setBookingError('This vehicle is currently unavailable for rent.');
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Please select both a start date and an end date.');
      return;
    }

    if (startDate < today) {
      setBookingError('Start date cannot be in the past.');
      return;
    }

    if (endDate <= startDate) {
      setBookingError('End date must be after the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking({
        userId: user.uid,
        userName: user.name || user.email.split('@')[0],
        carId: car.id,
        carName: `${car.brand} ${car.model}`,
        startDate,
        endDate,
        totalDays,
        totalPrice,
        status: 'pending',
      });

      setBookingSuccess(
        `Reservation placed successfully for ${totalDays} day(s)! Status is currently pending confirmation.`
      );
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error('Booking failed:', err);
      setBookingError(
        err instanceof Error
          ? err.message
          : 'Failed to complete booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading vehicle specifications..." />;
  }

  if (error || !car) {
    return (
      <section className="page-container">
        <nav className="breadcrumbs">
          <Link to="/cars">← Back to Fleet</Link>
        </nav>
        <div className="empty-state">
          <h2>Vehicle Not Found</h2>
          <p className="empty-state-hint">
            {error || 'The vehicle you are looking for does not exist or has been removed.'}
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/cars" className="btn btn-primary">
              Browse Available Cars
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container car-detail-page">
      <nav className="breadcrumbs">
        <Link to="/cars">← Back to Fleet</Link>
        <span className="breadcrumb-separator">/</span>
        <span>
          {car.brand} {car.model}
        </span>
      </nav>

      <div className="car-detail-container">
        {/* Left Column: Image showcase */}
        <div className="car-detail-media">
          <div className="car-detail-image-box">
            <img
              src={car.imageUrl || 'https://placehold.co/800x500?text=No+Car+Image'}
              alt={`${car.brand} ${car.model}`}
              className="car-detail-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/800x500?text=No+Car+Image';
              }}
            />
            <span
              className={`car-badge detail-badge ${
                car.available ? 'badge-success' : 'badge-danger'
              }`}
            >
              {car.available ? 'Available for Rent' : 'Currently Unavailable'}
            </span>
          </div>
        </div>

        {/* Right Column: Specification & details */}
        <div className="car-detail-info">
          <div className="car-detail-header">
            <span className="car-detail-category">{car.category}</span>
            <h1 className="car-detail-title">
              {car.brand} {car.model}
            </h1>
            <p className="car-detail-year">Production Year: {car.year}</p>
          </div>

          <div className="car-detail-pricing-box">
            <div className="price-tag">
              <span className="price-tag-amount">{formatIDR(car.pricePerDay)}</span>
              <span className="price-tag-unit">/ day</span>
            </div>
            <span
              className={`status-pill ${
                car.available ? 'status-available' : 'status-unavailable'
              }`}
            >
              {car.available ? '● Ready to Book' : '● In Maintenance / Rented'}
            </span>
          </div>

          {/* Key Specs Grid */}
          <div className="car-detail-specs-grid">
            <div className="spec-item">
              <span className="spec-icon">👥</span>
              <div className="spec-meta">
                <span className="spec-label">Capacity</span>
                <strong className="spec-value">{car.seats} Seats</strong>
              </div>
            </div>

            <div className="spec-item">
              <span className="spec-icon">⚙️</span>
              <div className="spec-meta">
                <span className="spec-label">Transmission</span>
                <strong className="spec-value" style={{ textTransform: 'capitalize' }}>
                  {car.transmission}
                </strong>
              </div>
            </div>

            <div className="spec-item">
              <span className="spec-icon">⛽</span>
              <div className="spec-meta">
                <span className="spec-label">Fuel Type</span>
                <strong className="spec-value" style={{ textTransform: 'capitalize' }}>
                  {car.fuelType}
                </strong>
              </div>
            </div>

            <div className="spec-item">
              <span className="spec-icon">🏷️</span>
              <div className="spec-meta">
                <span className="spec-label">Class</span>
                <strong className="spec-value" style={{ textTransform: 'capitalize' }}>
                  {car.category}
                </strong>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="car-detail-description">
            <h3>Vehicle Overview</h3>
            <p>{car.description || 'No detailed description available for this vehicle.'}</p>
          </div>

          {/* Booking Form Card */}
          <div className="car-booking-section">
            <h3 className="booking-section-title">Reserve This Vehicle</h3>

            {!isAuthenticated ? (
              <div className="booking-guest-prompt">
                <p>
                  Please <strong>log in</strong> to book this vehicle and check real-time availability.
                </p>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="btn btn-primary"
                  style={{ marginTop: '0.75rem', display: 'inline-flex' }}
                >
                  Log in to Book
                </Link>
              </div>
            ) : !car.available ? (
              <div className="auth-error-alert" role="alert">
                <span>⚠️ This vehicle is currently unavailable for rental.</span>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="booking-form" noValidate>
                {bookingError && (
                  <div className="auth-error-alert" role="alert">
                    <span>⚠️ {bookingError}</span>
                  </div>
                )}

                {bookingSuccess && (
                  <div className="admin-notice admin-notice-success" role="status">
                    <span>✅ {bookingSuccess}</span>
                    <Link
                      to="/bookings"
                      className="btn btn-secondary btn-outline-sm"
                      style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
                    >
                      View My Bookings
                    </Link>
                  </div>
                )}

                <div className="booking-dates-grid">
                  <div className="form-group">
                    <label htmlFor="booking-start-date">Pick-up Date</label>
                    <input
                      id="booking-start-date"
                      type="date"
                      min={today}
                      className="form-input"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setBookingError(null);
                        setBookingSuccess(null);
                      }}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-end-date">Drop-off Date</label>
                    <input
                      id="booking-end-date"
                      type="date"
                      min={startDate || today}
                      className="form-input"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setBookingError(null);
                        setBookingSuccess(null);
                      }}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {dateError && (
                  <p className="booking-date-error-text">⚠️ {dateError}</p>
                )}

                {/* Live Cost Calculation Summary */}
                {totalDays > 0 && !dateError && (
                  <div className="booking-summary-box">
                    <div className="booking-summary-row">
                      <span>Rental Duration:</span>
                      <strong>
                        {totalDays} {totalDays === 1 ? 'day' : 'days'}
                      </strong>
                    </div>
                    <div className="booking-summary-row">
                      <span>Rate per Day:</span>
                      <span>{formatIDR(car.pricePerDay)}</span>
                    </div>
                    <div className="booking-summary-divider" />
                    <div className="booking-summary-row total-row">
                      <span>Total Estimated Price:</span>
                      <strong className="summary-total-price">
                        {formatIDR(totalPrice)}
                      </strong>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={isSubmitting || !!dateError || !startDate || !endDate}
                  style={{ marginTop: '1rem' }}
                >
                  {isSubmitting ? 'Processing Reservation...' : 'Confirm & Request Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
