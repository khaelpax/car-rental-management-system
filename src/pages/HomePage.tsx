import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <section className="page-container home-page">
      <header className="hero-banner">
        <h1>Welcome to Car Rental Management</h1>
        <p className="hero-subtitle">
          Find, reserve, and manage premium vehicle rentals with real-time updates and seamless booking.
        </p>
        <div className="hero-cta-group">
          <Link to="/cars" className="btn btn-primary btn-large">
            Browse Fleet
          </Link>
          <Link to="/bookings" className="btn btn-outline btn-large">
            View My Bookings
          </Link>
        </div>
      </header>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🚘</div>
          <h3>Wide Vehicle Selection</h3>
          <p>From economical compacts to luxury SUVs, choose the vehicle that fits your journey.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Instant Reservations</h3>
          <p>Book quickly with our cloud-powered real-time reservation platform.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure &amp; Reliable</h3>
          <p>Protected by Firebase Authentication and Firestore security rules.</p>
        </div>
      </section>
    </section>
  );
};
