import React from 'react';
import './SiteAlertModal.css';

function SiteConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="site-alert-overlay" onClick={onCancel}>
      <div className="site-alert-card" onClick={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="site-alert-badge">PetHub</div>
        <h3 className="site-alert-title">Please Confirm</h3>
        <p className="site-alert-message">{message}</p>
        <div className="site-alert-actions">
          <button type="button" className="site-alert-btn site-alert-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="site-alert-btn" onClick={onConfirm}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default SiteConfirmModal;
