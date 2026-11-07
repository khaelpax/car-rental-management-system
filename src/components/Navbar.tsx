import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';

export interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Car Rental' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-logo-icon">🚗</span>
          <span className="navbar-brand-name">{title}</span>
        </Link>

        <button
          type="button"
          className="navbar-hamburger"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav className={`navbar-nav ${isOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Home
          </NavLink>
          <NavLink
            to="/cars"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Browse Cars
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Bookings
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={closeMenu}
            >
              Admin Panel
            </NavLink>
          )}

          <div className="navbar-auth-buttons">
            {isAuthenticated && user ? (
              <div className="navbar-user-section">
                <span className="navbar-user-greeting">
                  Hi, <strong>{user.name || user.email.split('@')[0]}</strong>
                  <span className={`navbar-role-pill ${user.role}`}>
                    {user.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary navbar-logout-btn"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
