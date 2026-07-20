import React from 'react';
import { Link } from 'react-router-dom';
import './MaintenancePage.css';

const MaintenancePage = ({ title = 'This page is currently under maintenance' }) => {
  return (
    <div className="happy-tails-maintenance-page">
      <section className="happy-tails-maintenance-panel" aria-labelledby="maintenance-title">
        <p className="happy-tails-maintenance-kicker">Temporary notice</p>
        <h1 id="maintenance-title">{title}</h1>
        <p>
          Cafe and retail shop ordering are temporarily unavailable while we update the system.
          Appointment booking is still open.
        </p>
        <div className="happy-tails-maintenance-actions">
          <Link to="/booking" className="happy-tails-maintenance-primary">
            Book an Appointment
          </Link>
          <Link to="/" className="happy-tails-maintenance-secondary">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MaintenancePage;
