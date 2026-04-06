import React from 'react';
import PropTypes from 'prop-types';
import './EditTotalModal.css';

/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   description: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   onClose: () => void,
 *   onSave: () => void
 * }} props
 */
function EditTotalModal({ open, title, description, value, onChange, onClose, onSave }) {
  if (!open) return null;

  return (
    <div className="edit-total-overlay" onClick={onClose}>
      <div className="edit-total-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <p>{description}</p>
        <input
          type="number"
          className="edit-total-input"
          value={value}
          min="0"
          step="0.01"
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="edit-total-actions">
          <button type="button" className="edit-total-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="edit-total-save" onClick={onSave}>Save Total</button>
        </div>
      </div>
    </div>
  );
}

EditTotalModal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default EditTotalModal;
