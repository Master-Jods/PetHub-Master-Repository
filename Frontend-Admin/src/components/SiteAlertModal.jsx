import React from 'react';
import './SiteAlertModal.css';

function SiteAlertModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="site-alert-overlay" onClick={onClose}>
      <div className="site-alert-card" onClick={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="site-alert-badge">PetHub Admin</div>
        <h3 className="site-alert-title">Notice</h3>
        <p className="site-alert-message">{message}</p>
        <button type="button" className="site-alert-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

export default SiteAlertModal;
