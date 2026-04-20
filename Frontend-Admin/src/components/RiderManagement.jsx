import React, { useEffect, useState } from 'react';
import './RiderManagement.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pethub-customer-api.onrender.com/api';
const RECORDS_PER_PAGE = 10;

const mapRider = (rider) => ({
  id: rider.riderId || rider.rider_id || String(rider.id),
  name: rider.name || '',
  contact: rider.contact || '',
  vehicle: rider.vehicle || '',
  plateNumber: rider.plateNumber || rider.plate_number || ''
});

function RiderManagement() {
  const [riders, setRiders] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    vehicle: '',
    plateNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadRiders = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/riders`);
      if (!response.ok) {
        throw new Error(`Failed to fetch riders (${response.status})`);
      }

      const payload = await response.json();
      setRiders(Array.isArray(payload.riders) ? payload.riders.map(mapRider) : []);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load riders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [riders]);

  const totalPages = Math.max(1, Math.ceil(riders.length / RECORDS_PER_PAGE));
  const paginatedRiders = riders.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE);
  const pageStart = riders.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RECORDS_PER_PAGE, riders.length);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddRider = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/riders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save rider (${response.status})`);
      }

      const payload = await response.json();
      const newRider = mapRider(payload.rider);
      setRiders((prev) => [...prev, newRider]);
      setFormData({ name: '', contact: '', vehicle: '', plateNumber: '' });
      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save rider.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRider = async (id) => {
    setDeletingId(id);

    try {
      const response = await fetch(`${API_BASE_URL}/riders/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to remove rider (${response.status})`);
      }

      setRiders((prev) => prev.filter((rider) => rider.id !== id));
      setError('');
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to remove rider.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="rider-page">
      <div className="rider-header">
        <h1>Rider Management</h1>
        <p>Manage rider details for order assignment.</p>
      </div>

      {error && <div className="rider-feedback rider-feedback--error">{error}</div>}
      {loading && <div className="rider-feedback">Loading riders...</div>}

      <div className="rider-layout">
        <div className="rider-card">
          <h2>Add Rider</h2>
          <form onSubmit={handleAddRider} className="rider-form">
            <label htmlFor="rider-name">Name</label>
            <input id="rider-name" name="name" value={formData.name} onChange={handleChange} required />

            <label htmlFor="rider-contact">Contact</label>
            <input id="rider-contact" name="contact" value={formData.contact} onChange={handleChange} required />

            <label htmlFor="rider-vehicle">Vehicle</label>
            <input id="rider-vehicle" name="vehicle" value={formData.vehicle} onChange={handleChange} required />

            <label htmlFor="rider-plate">Plate Number</label>
            <input id="rider-plate" name="plateNumber" value={formData.plateNumber} onChange={handleChange} required />

            <button type="submit" className="rider-add-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Rider'}
            </button>
          </form>
        </div>

        <div className="rider-card">
          <h2>Riders List</h2>
          <div className="rider-table-wrapper">
            <table className="rider-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Vehicle</th>
                  <th>Plate Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRiders.map((rider) => (
                  <tr key={rider.id}>
                    <td>{rider.name}</td>
                    <td>{rider.contact}</td>
                    <td>{rider.vehicle}</td>
                    <td>{rider.plateNumber}</td>
                    <td>
                      <button
                        type="button"
                        className="rider-delete-btn"
                        onClick={() => handleDeleteRider(rider.id)}
                        disabled={deletingId === rider.id}
                      >
                        {deletingId === rider.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && riders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="rider-empty">No riders saved yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="records-footer">
            <div className="customers-results-count">
              Showing {pageStart}-{pageEnd} of {riders.length} riders
            </div>
            {!loading && riders.length > RECORDS_PER_PAGE && (
              <div className="records-pagination records-pagination--inline">
                <button
                  type="button"
                  className="records-pagination__btn records-pagination__btn--small"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <div className="records-pagination__info">Page {currentPage} of {totalPages}</div>
                <button
                  type="button"
                  className="records-pagination__btn records-pagination__btn--small"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiderManagement;
