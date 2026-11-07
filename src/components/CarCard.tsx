import React from 'react';
import { Link } from 'react-router-dom';
import type { Car } from '../types';
import { formatIDR } from '../utils/formatters';

export interface CarCardProps {
  car: Car;
}

export const CarCard: React.FC<CarCardProps> = ({ car }) => {
  return (
    <article className="car-card">
      <div className="car-card-image-wrapper">
        <img
          src={car.imageUrl || 'https://placehold.co/600x400?text=No+Car+Image'}
          alt={`${car.brand} ${car.model}`}
          className="car-card-image"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/600x400?text=No+Car+Image';
          }}
        />
        <span
          className={`car-badge ${car.available ? 'badge-success' : 'badge-danger'}`}
        >
          {car.available ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="car-card-body">
        <div className="car-card-header">
          <h3 className="car-card-title">
            {car.brand} {car.model}
          </h3>
          <span className="car-card-category">{car.category}</span>
        </div>

        <p className="car-card-year">Model Year: {car.year}</p>

        <div className="car-specs">
          <span>⚙️ {car.transmission}</span>
          <span>⛽ {car.fuelType}</span>
          <span>👥 {car.seats} Seats</span>
        </div>

        <p className="car-card-description">
          {car.description.length > 90
            ? `${car.description.substring(0, 90)}...`
            : car.description}
        </p>

        <div className="car-card-footer">
          <div className="car-price">
            <span className="price-amount">{formatIDR(car.pricePerDay)}</span>
            <span className="price-unit">/ day</span>
          </div>
          <div className="car-card-actions">
            <Link to={`/cars/${car.id}`} className="btn btn-primary-sm">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};
