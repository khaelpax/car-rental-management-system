import React, { useState, useMemo } from 'react';
import { useCars } from '../hooks';
import { CarCard, LoadingSpinner } from '../components';

export const CarsPage: React.FC = () => {
  const { cars, loading, error, refetch } = useCars();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTransmission, setSelectedTransmission] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

  // Dynamically extract unique categories from loaded cars
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    cars.forEach((car) => {
      if (car.category) {
        categories.add(car.category.toLowerCase());
      }
    });
    return Array.from(categories);
  }, [cars]);

  // Filtered cars computation
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        car.brand.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        `${car.brand} ${car.model}`.toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === 'all' ||
        car.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesTransmission =
        selectedTransmission === 'all' ||
        car.transmission === selectedTransmission;

      const matchesAvailability =
        selectedAvailability === 'all' ||
        (selectedAvailability === 'available' && car.available) ||
        (selectedAvailability === 'unavailable' && !car.available);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesTransmission &&
        matchesAvailability
      );
    });
  }, [
    cars,
    searchTerm,
    selectedCategory,
    selectedTransmission,
    selectedAvailability,
  ]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedTransmission !== 'all' ||
    selectedAvailability !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTransmission('all');
    setSelectedAvailability('all');
  };

  return (
    <section className="page-container">
      <header className="page-header">
        <h1 className="page-title">Available Vehicles</h1>
        <p className="page-subtitle">
          Explore and find the best rental car tailored for your travel journey.
        </p>
      </header>

      {/* Filter and Search Controls */}
      <div className="catalog-filters-card">
        <div className="filters-grid">
          {/* Search by brand or model */}
          <div className="filter-group">
            <label htmlFor="search-input">Search Vehicle</label>
            <input
              id="search-input"
              type="text"
              className="form-input"
              placeholder="Search by brand or model (e.g. Toyota, Brio)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter by Category */}
          <div className="filter-group">
            <label htmlFor="category-select">Category</label>
            <select
              id="category-select"
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Transmission */}
          <div className="filter-group">
            <label htmlFor="transmission-select">Transmission</label>
            <select
              id="transmission-select"
              className="form-input"
              value={selectedTransmission}
              onChange={(e) => setSelectedTransmission(e.target.value)}
            >
              <option value="all">All Transmissions</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Filter by Availability */}
          <div className="filter-group">
            <label htmlFor="availability-select">Availability</label>
            <select
              id="availability-select"
              className="form-input"
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="filter-active-bar">
            <span>
              Showing {filteredCars.length} of {cars.length} cars
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-outline-sm"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner message="Loading available car fleet from Firestore..." />
      )}

      {/* Error State */}
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

      {/* Empty Database State */}
      {!loading && !error && cars.length === 0 && (
        <div className="empty-state">
          <h3>No Cars in Fleet Yet</h3>
          <p className="empty-state-hint">
            The vehicle database is currently empty. An administrator can add vehicles
            or populate sample data from the Admin Panel.
          </p>
        </div>
      )}

      {/* Filter Empty State */}
      {!loading && !error && cars.length > 0 && filteredCars.length === 0 && (
        <div className="empty-state">
          <h3>No Vehicles Match Your Filters</h3>
          <p className="empty-state-hint">
            Try adjusting your search keyword or clearing filter selections.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary-sm"
              onClick={handleResetFilters}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Cars Grid */}
      {!loading && !error && filteredCars.length > 0 && (
        <div className="cars-grid">
          {filteredCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </section>
  );
};
