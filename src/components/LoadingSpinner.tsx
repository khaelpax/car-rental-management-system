import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  return (
    <div className={`spinner-container spinner-${size}`}>
      <div className="spinner" />
      {message && <p className="spinner-text">{message}</p>}
    </div>
  );
};
