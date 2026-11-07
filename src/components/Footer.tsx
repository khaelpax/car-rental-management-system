import React from 'react';

export interface FooterProps {
  companyName?: string;
  year?: number;
}

export const Footer: React.FC<FooterProps> = ({
  companyName = 'Car Rental Management System',
  year = new Date().getFullYear(),
}) => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          &copy; {year} {companyName}. All rights reserved.
        </p>
        <p className="footer-subtext">
          Scaffolded with React, TypeScript, Vite &amp; Firebase
        </p>
      </div>
    </footer>
  );
};
