import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <section className="page-container not-found-page">
      <div className="not-found-card">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you requested does not exist or may have been relocated.</p>
        <Link to="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    </section>
  );
};
