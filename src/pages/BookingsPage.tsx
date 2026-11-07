import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, useBookings } from '../hooks';
import { cancelBooking } from '../services/bookingService';
import { LoadingSpinner } from '../components';
import type { Booking } from '../types';
import { formatIDR } from '../utils/formatters';

export const BookingsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  // Fetch only this customer's bookings by their Firebase Auth uid
  const { bookings, loading, error, refetch } = useBookings(user ? user.uid : '');

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleOpenCancel = (booking: Booking) => {
    setBookingToCancel(booking);
    setActionNotice(null);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    setCancellingId(bookingToCancel.id);
    try {
      await cancelBooking(bookingToCancel.id);
      setActionNotice({
        type: 'success',
        text: `Booking for ${bookingToCancel.carName} has been cancelled.`,
      });
      setBookingToCancel(null);
      await refetch();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setActionNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to cancel booking.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated || !user) {
    return (
      <section className="page-container">
        <header className="page-header">
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">Track and manage your rental reservations.</p>
        </header>

        <div className="empty-state">
          <h2>Authentication Required</h2>
          <p className="empty-state-hint">
            Please log in with your account to view your past and upcoming reservations.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link
              to="/login"
              state={{ from: location }}
              className="btn btn-primary"
            >
              Log In to View Bookings
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container bookings-page">
      <header className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">
          Manage and track your vehicle reservations, period, and status.
        </p>
      </header>

      {/* Notifications */}
      {actionNotice && (
        <div
          className={`admin-notice ${
            actionNotice.type === 'success'
              ? 'admin-notice-success'
              : 'auth-error-alert'
          }`}
          role="status"
        >
          <span>{actionNotice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{actionNotice.text}</span>
          <button
            type="button"
            className="btn-icon-close"
            onClick={() => setActionNotice(null)}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      {loading && <LoadingSpinner message="Loading your bookings..." />}

      {error && !loading && (
        <div className="auth-error-alert" role="alert">
          <span>⚠️ {error}</span>
          <button
            type="button"
            className="btn btn-secondary btn-outline-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state">
          <h3>No Reservations Yet</h3>
          <p className="empty-state-hint">
            You don't have any bookings. Explore our available fleet and reserve your next vehicle today.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/cars" className="btn btn-primary">
              Browse Available Cars
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="customer-bookings-grid">
          {bookings.map((booking) => (
            <article key={booking.id} className="customer-booking-card">
              <div className="customer-booking-header">
                <div>
                  <h3 className="customer-booking-car-title">{booking.carName}</h3>
                  <span className="customer-booking-id">ID: #{booking.id.substring(0, 8)}</span>
                </div>
                <span className={`status-pill status-${booking.status}`}>
                  {booking.status.toUpperCase()}
                </span>
              </div>

              <div className="customer-booking-details">
                <div className="booking-info-item">
                  <span className="booking-info-label">Rental Period</span>
                  <strong className="booking-info-value">
                    {booking.startDate} &rarr; {booking.endDate}
                  </strong>
                </div>

                <div className="booking-info-item">
                  <span className="booking-info-label">Duration</span>
                  <strong className="booking-info-value">
                    {booking.totalDays} {booking.totalDays === 1 ? 'day' : 'days'}
                  </strong>
                </div>

                <div className="booking-info-item">
                  <span className="booking-info-label">Total Amount</span>
                  <strong className="booking-info-value booking-amount-highlight">
                    {formatIDR(booking.totalPrice)}
                  </strong>
                </div>

                <div className="booking-info-item">
                  <span className="booking-info-label">Booked At</span>
                  <span className="booking-info-value" style={{ fontSize: '0.85rem' }}>
                    {new Date(booking.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="customer-booking-footer">
                <Link to={`/cars/${booking.carId}`} className="btn btn-secondary btn-outline-sm">
                  View Vehicle
                </Link>

                {/* Cancel button: Only allowed for "pending" bookings */}
                {booking.status === 'pending' ? (
                  <button
                    type="button"
                    className="btn btn-danger-sm"
                    onClick={() => handleOpenCancel(booking)}
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                ) : (
                  <span className="booking-status-hint">
                    {booking.status === 'confirmed' && 'Booking is confirmed'}
                    {booking.status === 'completed' && 'Trip completed'}
                    {booking.status === 'cancelled' && 'Reservation cancelled'}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Customer Cancellation */}
      {bookingToCancel && (
        <div className="modal-backdrop" onClick={() => setBookingToCancel(null)}>
          <div
            className="modal-card modal-card-sm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-dialog"
          >
            <div className="modal-header">
              <h2 id="cancel-booking-dialog">Cancel Reservation</h2>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setBookingToCancel(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to cancel your booking for{' '}
                <strong>{bookingToCancel.carName}</strong> ({bookingToCancel.startDate} &rarr;{' '}
                {bookingToCancel.endDate})?
              </p>
              <p className="delete-warning-text">
                Your reservation will be marked as cancelled immediately.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setBookingToCancel(null)}
                disabled={cancellingId !== null}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
              >
                {cancellingId !== null ? 'Cancelling...' : 'Yes, Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
