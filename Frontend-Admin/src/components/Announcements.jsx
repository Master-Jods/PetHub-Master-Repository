import React, { useEffect, useMemo, useState } from 'react';
import './Announcements.css';
import { siteConfirm } from '../utils/siteConfirm';
import { toFriendlyMessage } from '../utils/friendlyMessage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pethub-customer-api.onrender.com/api';

const baseFormState = {
  category: 'Announcement',
  tag: '',
  meta: '',
  title: '',
  description: '',
  note: '',
  highlight: '',
  footer: '',
  sortOrder: 0,
  isActive: true,
};

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(baseFormState);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sortedAnnouncements = useMemo(
    () => [...announcements].sort((a, b) => (a.sortOrder - b.sortOrder) || String(b.createdAt).localeCompare(String(a.createdAt))),
    [announcements]
  );

  const loadAnnouncements = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/announcements`);
      if (!response.ok) {
        throw new Error(`Failed to fetch announcements (${response.status})`);
      }

      const payload = await response.json();
      setAnnouncements(Array.isArray(payload.announcements) ? payload.announcements : []);
      setError('');
    } catch (fetchError) {
      setError(toFriendlyMessage(fetchError.message, 'We couldn’t load announcements right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const resetForm = () => {
    setForm(baseFormState);
    setEditingId('');
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        editingId ? `${API_BASE_URL}/announcements/${editingId}` : `${API_BASE_URL}/announcements`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            sortOrder: Number(form.sortOrder || 0),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save announcement (${response.status})`);
      }

      const payload = await response.json();
      const nextAnnouncement = payload.announcement;

      setAnnouncements((prev) => (
        editingId
          ? prev.map((item) => (item.id === editingId ? nextAnnouncement : item))
          : [nextAnnouncement, ...prev]
      ));
      resetForm();
      setError('');
    } catch (saveError) {
      setError(toFriendlyMessage(saveError.message, 'We couldn’t save that announcement right now.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setForm({
      category: announcement.category || 'Announcement',
      tag: announcement.tag || '',
      meta: announcement.meta || '',
      title: announcement.title || '',
      description: announcement.description || '',
      note: announcement.note || '',
      highlight: announcement.highlight || '',
      footer: announcement.footer || '',
      sortOrder: announcement.sortOrder || 0,
      isActive: announcement.isActive !== false,
    });
  };

  const handleDelete = async (id) => {
    if (!(await siteConfirm('Delete this announcement?'))) return;

    try {
      const response = await fetch(`${API_BASE_URL}/announcements/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Failed to delete announcement (${response.status})`);
      }

      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setError('');
    } catch (deleteError) {
      setError(toFriendlyMessage(deleteError.message, 'We couldn’t delete that announcement right now.'));
    }
  };

  return (
    <div className="announcements-page">
      <div className="announcements-header">
        <h1>Announcements</h1>
        <p>Create the cards shown in the customer homepage Events & Announcements section.</p>
      </div>

      {error && <div className="announcements-feedback announcements-feedback--error">{error}</div>}
      {loading && <div className="announcements-feedback">Loading announcements...</div>}

      <div className="announcements-layout">
        <section className="announcements-editor-card">
          <h2>{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
          <form className="announcements-form" onSubmit={handleSubmit}>
            <label>
              Category
              <input name="category" value={form.category} onChange={handleChange} required />
            </label>
            <label>
              Meta
              <input name="meta" value={form.meta} onChange={handleChange} placeholder="Small Breeds / Limited Time / New Arrivals" />
            </label>
            <label>
              Title
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
            </label>
            <label>
              Highlight
              <input name="highlight" value={form.highlight} onChange={handleChange} placeholder="SATURDAY / UP TO 20% OFF" />
            </label>
            <label>
              Note
              <textarea name="note" value={form.note} onChange={handleChange} rows="2" />
            </label>
            <label>
              Footer
              <input name="footer" value={form.footer} onChange={handleChange} />
            </label>
            <label>
              Sort Order
              <input name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} />
            </label>
            <label className="announcements-checkbox">
              <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} />
              Show on customer homepage
            </label>
            <div className="announcements-form-actions">
              <button type="button" className="announcements-secondary-btn" onClick={resetForm}>
                Clear
              </button>
              <button type="submit" className="announcements-primary-btn" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Announcement'}
              </button>
            </div>
          </form>
        </section>

        <section className="announcements-preview-card">
          <div className="announcements-preview-head">
            <h2>Live Cards</h2>
            <p>{sortedAnnouncements.length} announcement{sortedAnnouncements.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="announcements-grid">
            {sortedAnnouncements.map((item) => (
              <article key={item.id} className={`announcements-item ${item.isActive ? '' : 'is-inactive'}`}>
                <div className="announcements-item-mark" />
                <div className="announcements-item-pill">{item.category}</div>
                <span className="announcements-item-meta">{item.meta || 'No meta yet'}</span>
                <h3>{item.title}</h3>
                <p>{item.description || 'No description yet.'}</p>
                <div className="announcements-item-highlight">{item.highlight || 'ADD HIGHLIGHT'}</div>
                <div className="announcements-item-note">{item.note || 'Add a note for customers.'}</div>
                <div className="announcements-item-footer">{item.footer || 'Footer text'}</div>
                <div className="announcements-item-actions">
                  <button type="button" className="announcements-secondary-btn" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="announcements-danger-btn" onClick={() => handleDelete(item.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {!loading && sortedAnnouncements.length === 0 && (
              <div className="announcements-empty-state">No announcements created yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Announcements;
